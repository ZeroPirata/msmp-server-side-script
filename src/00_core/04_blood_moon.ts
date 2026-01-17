import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $Entity } from "net.minecraft.world.entity.Entity";

console.log("[MSMP] Carregando sistema Blood Moon...");

// ============================================
// CONFIGURAÇÕES DA BLOOD MOON
// ============================================

interface BloodMoonConfig {
  ENABLED: boolean; // Se o evento está ativado
  MIN_DAYS: number; // Mínimo de dias entre blood moons
  MAX_DAYS: number; // Máximo de dias entre blood moons
  DURATION_TICKS: number; // Duração do evento em ticks (padrão: 1 noite = ~10 minutos)
  BOSS_SPAWN_DELAY: number; // Delay em ticks antes de spawnar o boss após iniciar
  BOSS_CLASSE: string; // Classe do boss que spawna na blood moon
  ANNOUNCE_START: boolean; // Anunciar início da blood moon
  ANNOUNCE_END: boolean; // Anunciar fim da blood moon
  SKY_COLOR: boolean; // Mudar cor do céu (visual)
}

const DEFAULT_BLOOD_MOON_CONFIG: BloodMoonConfig = {
  ENABLED: true,
  MIN_DAYS: 7,
  MAX_DAYS: 10,
  DURATION_TICKS: 12000, // Uma noite completa
  BOSS_SPAWN_DELAY: 100, // 5 segundos
  BOSS_CLASSE: "blood_mage", // Boss padrão para blood moon
  ANNOUNCE_START: true,
  ANNOUNCE_END: true,
  SKY_COLOR: true
};

const BLOOD_MOON_CONFIG_KEY = "kubejs_blood_moon_config";
const BLOOD_MOON_STATE_KEY = "kubejs_blood_moon_state";

// ============================================
// ESTADO DA BLOOD MOON
// ============================================

interface BloodMoonState {
  nextBloodMoonDay: number; // Dia em que a próxima blood moon vai acontecer
  isActive: boolean; // Se a blood moon está ativa agora
  startTick: number; // Tick em que a blood moon começou
  bossSpawned: boolean; // Se o boss já foi spawnado
  bossUuid: string | null; // UUID do boss spawnado
  bossKilled: boolean; // Se o boss foi morto
}

let currentBloodMoonState: BloodMoonState | null = null;

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================
function saveBloodMoonConfig(server: $MinecraftServer, config: BloodMoonConfig): void {
  server.persistentData.putString(BLOOD_MOON_CONFIG_KEY, JSON.stringify(config));
  console.log("[MSMP Blood Moon] Configuração salva!");
}

function getBloodMoonConfig(server: $MinecraftServer): BloodMoonConfig {
  let data = server.persistentData.getString(BLOOD_MOON_CONFIG_KEY);

  if (!data) {
    saveBloodMoonConfig(server, DEFAULT_BLOOD_MOON_CONFIG);
    return DEFAULT_BLOOD_MOON_CONFIG;
  }

  try {
    return Object.assign({}, DEFAULT_BLOOD_MOON_CONFIG, JSON.parse(data));
  } catch (e) {
    console.error(`[MSMP Blood Moon] Erro ao carregar configuração: ${e}`);
    return DEFAULT_BLOOD_MOON_CONFIG;
  }
}

// ============================================
// FUNÇÕES DE ESTADO
// ============================================

function saveBloodMoonState(server: $MinecraftServer, state: BloodMoonState): void {
  server.persistentData.putString(BLOOD_MOON_STATE_KEY, JSON.stringify(state));
}

function loadBloodMoonState(server: $MinecraftServer): BloodMoonState | null {
  let data = server.persistentData.getString(BLOOD_MOON_STATE_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`[MSMP Blood Moon] Erro ao carregar estado: ${e}`);
    return null;
  }
}

function initBloodMoonState(currentDay: number, daysUntilNext: number): BloodMoonState {
  return {
    nextBloodMoonDay: currentDay + daysUntilNext,
    isActive: false,
    startTick: 0,
    bossSpawned: false,
    bossUuid: null,
    bossKilled: false
  };
}

// ============================================
// FUNÇÕES DE LÓGICA
// ============================================

function calculateNextBloodMoonDay(config: BloodMoonConfig, currentDay: number): number {
  let minDays = config.MIN_DAYS;
  let maxDays = config.MAX_DAYS;
  let daysUntil = randomBetween(minDays, maxDays);
  return currentDay + daysUntil;
}

function startBloodMoon(server: $MinecraftServer, currentTick: number): void {
  if (!currentBloodMoonState) return;

  currentBloodMoonState.isActive = true;
  currentBloodMoonState.startTick = currentTick;
  currentBloodMoonState.bossSpawned = false;
  currentBloodMoonState.bossUuid = null;
  currentBloodMoonState.bossKilled = false;
  saveBloodMoonState(server, currentBloodMoonState);

  let config = getBloodMoonConfig(server);

  if (config.ANNOUNCE_START) {
    announceBloodMoonStart(server);
  }

  console.log("[MSMP Blood Moon] Blood Moon iniciada!");
}

function endBloodMoon(server: $MinecraftServer): void {
  if (!currentBloodMoonState) return;

  let config = getBloodMoonConfig(server);
  let overworld = server.overworld();
  let currentDay = Math.floor(overworld.getDayTime() / 24000);

  // Se o boss ainda está vivo, remove-lo
  if (currentBloodMoonState.bossSpawned && !currentBloodMoonState.bossKilled && currentBloodMoonState.bossUuid) {
    removeBossIfAlive(server, currentBloodMoonState.bossUuid);
  }

  // Calcular próxima blood moon
  let nextDay = calculateNextBloodMoonDay(config, currentDay);

  currentBloodMoonState.isActive = false;
  currentBloodMoonState.nextBloodMoonDay = nextDay;
  currentBloodMoonState.bossSpawned = false;
  currentBloodMoonState.bossUuid = null;
  currentBloodMoonState.bossKilled = false;
  saveBloodMoonState(server, currentBloodMoonState);

  if (config.ANNOUNCE_END) {
    announceBloodMoonEnd(server, currentBloodMoonState.bossKilled);
  }

  console.log(`[MSMP Blood Moon] Blood Moon finalizada! Próxima no dia ${nextDay}`);
}

function spawnBloodMoonBoss(server: $MinecraftServer): void {
  if (!currentBloodMoonState) return;

  // IMPORTANTE: Marcar como spawnado IMEDIATAMENTE para evitar spawn duplo
  // Isso previne race condition onde a função pode ser chamada múltiplas vezes
  if (currentBloodMoonState.bossSpawned) {
    console.log("[MSMP Blood Moon] Boss já foi spawnado, ignorando chamada duplicada.");
    return;
  }

  currentBloodMoonState.bossSpawned = true;
  saveBloodMoonState(server, currentBloodMoonState);

  let config = getBloodMoonConfig(server);
  let overworld = server.overworld();
  let currentDay = Math.floor(overworld.getDayTime() / 24000);

  // Encontrar o boss correto
  let bossConfig = getRandomBoss(true);

  if (!bossConfig) {
    console.error(`[MSMP Blood Moon] Boss de bloodmon não encontrado!`);
    // Reverter flag se falhar
    currentBloodMoonState.bossSpawned = false;
    saveBloodMoonState(server, currentBloodMoonState);
    return;
  }

  console.log(`[MSMP Blood Moon] Preparando spawn do boss ${bossConfig.name}...`);
  // Gerar posição para o boss
  let msmpConfig = getMsmpConfig(server);
  let pos = generateBossPosition(overworld, [], msmpConfig);

  if (!pos) {
    console.error("[MSMP Blood Moon] Não foi possível encontrar posição válida para o boss!");
    // Reverter flag se falhar
    currentBloodMoonState.bossSpawned = false;
    saveBloodMoonState(server, currentBloodMoonState);
    return;
  }

  // Marcar o pending boss como Blood Moon boss para identificação posterior
  let pendingIndex = pendingBosses.length;

  // Spawnar o boss (ele ficará pendente até jogador se aproximar)
  prepareBossSpawnMulti(server, overworld, bossConfig, pos, currentDay);

  // Marcar o boss pendente como Blood Moon boss
  if (pendingBosses[pendingIndex]) {
    pendingBosses[pendingIndex].isBloodMoonBoss = true;
  }

  announceBloodMoonBossSpawn(server, bossConfig.name, pos);
  console.log(`[MSMP Blood Moon] Boss ${bossConfig.name} preparado em X:${Math.floor(pos.getX())} Y:${Math.floor(pos.getY())} Z:${Math.floor(pos.getZ())}`);
  console.log(`[MSMP Blood Moon] Boss será ativado quando um jogador se aproximar!`);
}

function removeBossIfAlive(server: $MinecraftServer, bossUuid: string): void {
  let boss = findBossByUuid(server, bossUuid);

  if (boss && boss.isAlive()) {
    boss.kill();
    console.log(`[MSMP Blood Moon] Boss removido (Blood Moon terminou sem ele ser morto)`);
    announceBloodMoonBossRemoved(server);
  }
}

function checkBossKilled(server: $MinecraftServer): void {
  if (!currentBloodMoonState) return;
  if (!currentBloodMoonState.bossSpawned) return;
  if (currentBloodMoonState.bossKilled) return;
  if (!currentBloodMoonState.bossUuid) return;

  let boss = findBossByUuid(server, currentBloodMoonState.bossUuid);

  if (!boss || !boss.isAlive()) {
    currentBloodMoonState.bossKilled = true;
    saveBloodMoonState(server, currentBloodMoonState);
    announceBloodMoonBossKilled(server);
    console.log("[MSMP Blood Moon] Boss da Blood Moon foi derrotado!");
  }
}

// ============================================
// ANÚNCIOS
// ============================================
function announceBloodMoonStart(server: $MinecraftServer): void {
  server.tell([
    Component.literal(""),
    Component.literal("§4§l════════════════════════════════").bold(),
    Component.literal("§c§l        🩸 BLOOD MOON 🩸").bold(),
    Component.literal("§4§l════════════════════════════════").bold(),
    Component.literal(""),
    Component.literal("§7A lua está vermelha como sangue..."),
    Component.literal("§7Um boss poderoso está prestes a surgir!"),
    Component.literal(""),
    Component.literal("§4§l════════════════════════════════").bold(),
    Component.literal("")
  ]);
}

function announceBloodMoonEnd(server: $MinecraftServer, bossKilled: boolean): void {
  if (bossKilled) {
    server.tell([
      Component.literal(""),
      Component.literal("§a§l════════════════════════════════").bold(),
      Component.literal("§a§l      🌙 BLOOD MOON VENCIDA 🌙").bold(),
      Component.literal("§a§l════════════════════════════════").bold(),
      Component.literal(""),
      Component.literal("§7O boss foi derrotado e a lua voltou ao normal!"),
      Component.literal("§aParabéns aos guerreiros!"),
      Component.literal(""),
      Component.literal("§a§l════════════════════════════════").bold(),
      Component.literal("")
    ]);
  } else {
    server.tell([
      Component.literal(""),
      Component.literal("§6§l════════════════════════════════").bold(),
      Component.literal("§6§l      🌙 BLOOD MOON TERMINOU 🌙").bold(),
      Component.literal("§6§l════════════════════════════════").bold(),
      Component.literal(""),
      Component.literal("§7A lua voltou ao normal..."),
      Component.literal("§cO boss não foi derrotado e desapareceu nas sombras."),
      Component.literal(""),
      Component.literal("§6§l════════════════════════════════").bold(),
      Component.literal("")
    ]);
  }
}

function announceBloodMoonBossSpawn(server: $MinecraftServer, bossName: string, pos: $BlockPos): void {
  server.tell([
    Component.literal(""),
    Component.literal("§4§l⚔ BOSS DA BLOOD MOON ⚔").bold(),
    Component.literal(""),
    Component.literal(`§7${bossName} §capareceu!`),
    Component.literal(`§7Localização: §bX: ${Math.floor(pos.getX())} Y: ${Math.floor(pos.getY())} Z: ${Math.floor(pos.getZ())}`),
    Component.literal(""),
    Component.literal("§cDerrote-o antes que a noite acabe!"),
    Component.literal("")
  ]);
}

function announceBloodMoonBossRemoved(server: $MinecraftServer): void {
  server.tell([Component.literal("§7O boss da Blood Moon desapareceu com o amanhecer...")]);
}

function announceBloodMoonBossKilled(server: $MinecraftServer): void {
  server.tell([Component.literal(""), Component.literal("§a§l✓ O boss da Blood Moon foi derrotado!").bold(), Component.literal("")]);
}

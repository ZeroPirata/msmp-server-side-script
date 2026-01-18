import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $Entity } from "net.minecraft.world.entity.Entity";

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
let lastSoundTick: Record<string, number> = {}; // Tracker para sons ambiente por player

// ============================================
// FUNÇÕES DE CONFIGURAÇÃO
// ============================================
function saveBloodMoonConfig(server: $MinecraftServer, config: BloodMoonConfig): void {
  server.persistentData.putString(BLOOD_MOON_CONFIG_KEY, JSON.stringify(config));
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
  let overworld = server.overworld();

  // CONGELAR O TEMPO (parar ciclo dia/noite)
  server.runCommandSilent("gamerule doDaylightCycle false");
  // Fixar o tempo na noite
  overworld.setDayTime(18000);

  let config = getBloodMoonConfig(server);

  // Ativar tempo tempestade se configurado
  if (config.THUNDER_WEATHER) {
    overworld.setWeatherParameters(0, 24000, true, true); // Chuva + Trovão
  }

  if (config.ANNOUNCE_START) {
    announceBloodMoonStart(server);
  }
}

function endBloodMoon(server: $MinecraftServer): void {
  if (!currentBloodMoonState) return;

  let config = getBloodMoonConfig(server);
  let overworld = server.overworld();

  // DESCONGELAR O TEMPO (retomar ciclo dia/noite)
  server.runCommandSilent("gamerule doDaylightCycle true");

  // REMOVER BUFFS DE TODOS OS MOBS
  removeBloodMoonBuffsFromMobs(server);
  overworld.setWeatherParameters(6000, 0, false, false); // Tempo limpo
  let currentDay = Math.floor(overworld.getDayTime() / 24000);

  // Se o boss ainda está vivo, remove-lo
  if (currentBloodMoonState.bossSpawned && !currentBloodMoonState.bossKilled && currentBloodMoonState.bossUuid) {
    removeBossIfAlive(server, currentBloodMoonState.bossUuid);
  }

  // Calcular próxima blood moon
  let nextDay = calculateNextBloodMoonDay(config, currentDay);

  // IMPORTANTE: Salvar estado de boss morto ANTES de resetar
  let wasBossKilled = currentBloodMoonState.bossKilled;

  currentBloodMoonState.isActive = false;
  currentBloodMoonState.nextBloodMoonDay = nextDay;
  currentBloodMoonState.bossSpawned = false;
  currentBloodMoonState.bossUuid = null;
  currentBloodMoonState.bossKilled = false;
  saveBloodMoonState(server, currentBloodMoonState);

  if (config.ANNOUNCE_END) {
    announceBloodMoonEnd(server, wasBossKilled);
  }
}

function spawnBloodMoonBoss(server: $MinecraftServer): void {
  if (!currentBloodMoonState) return;

  // IMPORTANTE: Marcar como spawnado IMEDIATAMENTE para evitar spawn duplo
  // Isso previne race condition onde a função pode ser chamada múltiplas vezes
  if (currentBloodMoonState.bossSpawned) {
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
  // silent=true para não mostrar mensagem de invasão normal
  prepareBossSpawnMulti(server, overworld, bossConfig, pos, currentDay, true);

  // Marcar o boss pendente como Blood Moon boss
  if (pendingBosses[pendingIndex]) {
    pendingBosses[pendingIndex].isBloodMoonBoss = true;
  }

  announceBloodMoonBossSpawn(server, bossConfig.name, pos);
}

function removeBossIfAlive(server: $MinecraftServer, bossUuid: string): void {
  let boss = findBossByUuid(server, bossUuid);

  if (boss && boss.isAlive()) {
    boss.kill();
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
  }
}

// ============================================
// ANÚNCIOS
// ============================================
function announceBloodMoonStart(server: $MinecraftServer): void {
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
  server.tell(Component.literal("§c§l🩸 BLOOD MOON 🩸").bold());
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
  server.tell(Component.literal("§7A lua vermelha surgiu..."));
  server.tell(Component.literal("§7Boss poderoso chegando!"));
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
}

function announceBloodMoonEnd(server: $MinecraftServer, bossKilled: boolean): void {
  if (bossKilled) {
    server.tell(Component.literal("§a§l═══════════════════════════════").bold());
    server.tell(Component.literal("§a§l🌙 BLOOD MOON VENCIDA 🌙").bold());
    server.tell(Component.literal("§a§l═══════════════════════════════").bold());
    server.tell(Component.literal("§7Boss derrotado!"));
    server.tell(Component.literal("§aParabéns guerreiros!"));
    server.tell(Component.literal("§a§l═══════════════════════════════").bold());
  } else {
    server.tell(Component.literal("§6§l═══════════════════════════════").bold());
    server.tell(Component.literal("§6§l🌙 BLOOD MOON TERMINOU 🌙").bold());
    server.tell(Component.literal("§6§l═══════════════════════════════").bold());
    server.tell(Component.literal("§7A lua voltou ao normal"));
    server.tell(Component.literal("§cBoss fugiu nas sombras"));
    server.tell(Component.literal("§6§l═══════════════════════════════").bold());
  }
}

function announceBloodMoonBossSpawn(server: $MinecraftServer, bossName: string, pos: $BlockPos): void {
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
  server.tell(Component.literal("§4§l⚔ BLOOD MOON BOSS ⚔").bold());
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
  server.tell(Component.literal(`§7${bossName} §capareceu!`));
  server.tell(Component.literal(`§bX:${Math.floor(pos.getX())} Y:${Math.floor(pos.getY())} Z:${Math.floor(pos.getZ())}`));
  server.tell(Component.literal("§c⚠ Derrote-o rápido!"));
  server.tell(Component.literal("§4§l═══════════════════════════════").bold());
}

function announceBloodMoonBossRemoved(server: $MinecraftServer): void {
  server.tell([Component.literal("§7O boss da Blood Moon desapareceu com o amanhecer...")]);
}

function announceBloodMoonBossKilled(server: $MinecraftServer): void {
  server.tell(Component.literal("§a§l✓ O boss da Blood Moon foi derrotado!").bold());
}

function applyBloodMoonEffects(server: $MinecraftServer): void {
  if (!currentBloodMoonState || !currentBloodMoonState.isActive) return;

  let config = getBloodMoonConfig(server);
  let overworld = server.overworld();

  // Aplicar efeitos visuais e sonoros em todos os jogadores online
  overworld.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;

    // Partículas vermelhas no céu (efeito de lua vermelha)
    if (config.SKY_COLOR) {
      spawnBloodMoonParticles(player);
    }

    // Sons ambiente assustadores
    if (config.AMBIENT_SOUNDS) {
      playBloodMoonAmbientSound(player);
    }
  });
}

function spawnBloodMoonParticles(player: any): void {
  let server = player.server;
  let uuid = player.uuid.toString();

  // 1. Partículas no céu (Poeira Vermelha e Esporos Carmesim)
  // Criamos uma área de dispersão de 15 blocos (30 total) a 20 blocos de altura
  // Comando: particle <nome> <x> <y> <z> <deltaX> <deltaY> <deltaZ> <velocidade> <quantidade>

  // Poeira Vermelha Intensa no céu - mais densa e espalhada
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:dust 1 0 0 2 ~ ~25 ~ 20 5 20 0.1 15`);

  // Adicionar mais layers de partículas vermelhas para criar um "fog" vermelho
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:dust 0.8 0 0 1.5 ~ ~15 ~ 15 5 15 0.1 10`);
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:dust 0.6 0 0 1.2 ~ ~10 ~ 12 5 12 0.1 8`);

  // Esporos Carmesim caindo
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:crimson_spore ~ ~20 ~ 15 5 15 0.05 5`);

  // 2. Partículas próximas ao chão (Névoa de sangue baixa)
  // Poeira Vermelha Escura
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:dust 0.5 0 0 1 ~ ~1 ~ 5 0.5 5 0.01 5`);

  // Névoa vermelha ao redor do player (meio-corpo)
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:dust 0.7 0 0 1 ~ ~1.5 ~ 3 1 3 0.01 8`);

  // OPCIONAL: Adiciona uma leve névoa de fumaça para dar volume
  server.runCommandSilent(`execute at ${uuid} run particle minecraft:ash ~ ~1 ~ 5 0.5 5 0.01 2`);
}

function playBloodMoonAmbientSound(player: any): void {
  let playerUuid = player.uuid.toString();
  let currentTick = player.level.server.tickCount;

  // Tocar som apenas a cada 10 segundos para cada jogador
  if (lastSoundTick[playerUuid] && currentTick - lastSoundTick[playerUuid] < 200) {
    return;
  }

  lastSoundTick[playerUuid] = currentTick;

  // Sons assustadores aleatórios
  let sounds = ["minecraft:entity.ender_dragon.growl", "minecraft:entity.warden.ambient", "minecraft:entity.wither.ambient", "minecraft:ambient.cave", "minecraft:block.portal.ambient"];

  let randomSound = sounds[Math.floor(Math.random() * sounds.length)];
  player.playSound(randomSound, 0.3, 0.8);
}

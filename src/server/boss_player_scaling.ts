import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";

/**
 * Sistema de Scaling de Boss baseado em Players Próximos
 *
 * Buffs aplicados POR PLAYER próximo:
 * - +30% de ataque
 * - +50% de armor (defesa)
 * - +25% de armor toughness (defesa geral)
 * - Vida aumenta em 100% da vida base por player
 *
 * Cada player é contado apenas UMA VEZ (não recontar se sair e entrar)
 */

// Armazena quais players já foram contados para cada boss
let bossPlayerScaling: Map<string, Set<string>> = new Map();

/**
 * Verifica e aplica scaling quando players se aproximam de um boss
 */
function checkBossPlayerScaling(server: $MinecraftServer, boss: $LivingEntity): void {
  if (!boss || !boss.isAlive()) return;

  // Verificar se é um boss (tem a tag de ativação)
  if (!boss.persistentData.contains("kubejs_activationRange")) return;

  let bossUuid = boss.uuid.toString();
  let bossPos = boss.position();
  let level = boss.level;

  // Usar um sistema mais simples: contador de players no NBT
  let scalingCount = boss.persistentData.getInt("kubejs_scaling_count");

  // Verificar players próximos (64 blocos de range)
  let nearbyPlayers = level.players.filter((player) => {
    if (player.isSpectator() || !player.isAlive()) return false;

    let playerPos = player.position();
    let distance = Math.sqrt(Math.pow(playerPos.x - bossPos.x, 2) + Math.pow(playerPos.y - bossPos.y, 2) + Math.pow(playerPos.z - bossPos.z, 2));

    return distance <= 64;
  });

  // Verificar quais players ainda não foram contados
  let newPlayersToCount = 0;
  nearbyPlayers.forEach((player) => {
    let playerUuid = player.uuid.toString();
    // Usar split/join ao invés de regex para compatibilidade com Rhino
    let cleanUuid = playerUuid.split("-").join("_");
    let tagKey = `kubejs_scaled_${cleanUuid}`;

    if (!boss.persistentData.getBoolean(tagKey)) {
      boss.persistentData.putBoolean(tagKey, true);
      newPlayersToCount++;
    }
  });

  // Se novos players foram contados, aplicar scaling
  if (newPlayersToCount > 0) {
    let oldCount = scalingCount;
    let newCount = scalingCount + newPlayersToCount;

    boss.persistentData.putInt("kubejs_scaling_count", newCount);

    // Log temporário para debug
    console.warn(`[DEBUG SCALING] Boss ${bossUuid.substring(0, 8)}: +${newPlayersToCount} player(s), total: ${newCount}`);

    applyBossPlayerScaling(boss, oldCount, newCount);
  }
}

/**
 * Aplica o scaling incremental do boss
 */
function applyBossPlayerScaling(boss: $LivingEntity, oldPlayerCount: number, newPlayerCount: number): void {
  let additionalPlayers = newPlayerCount - oldPlayerCount;
  if (additionalPlayers <= 0) return;

  // Obter vida base do boss (armazenada quando spawnou)
  let baseHealth = boss.persistentData.getDouble("kubejs_base_health");
  if (baseHealth === 0) {
    // Primeira vez, salvar vida base
    baseHealth = boss.maxHealth;
    boss.persistentData.putDouble("kubejs_base_health", baseHealth);
  }

  // VIDA: +100% da vida base por player adicional
  let healthIncrease = baseHealth * additionalPlayers;
  let newMaxHealth = boss.maxHealth + healthIncrease;
  let healthPercentage = boss.health / boss.maxHealth;
  boss.maxHealth = newMaxHealth;
  boss.health = newMaxHealth * healthPercentage; // Manter porcentagem de vida

  // ATAQUE: +30% por player adicional
  let attackAttribute = boss.getAttribute("minecraft:generic.attack_damage");
  if (attackAttribute) {
    let baseAttack = boss.persistentData.getDouble("kubejs_base_attack");
    if (baseAttack === 0) {
      baseAttack = attackAttribute.baseValue;
      boss.persistentData.putDouble("kubejs_base_attack", baseAttack);
    }

    let attackMultiplier = 1.0 + newPlayerCount * 0.3;
    attackAttribute.baseValue = baseAttack * attackMultiplier;
  }

  // DEFESA (ARMOR): +50% por player adicional
  let armorAttribute = boss.getAttribute("minecraft:generic.armor");
  if (armorAttribute) {
    let baseArmor = boss.persistentData.getDouble("kubejs_base_armor");
    if (baseArmor === 0) {
      baseArmor = armorAttribute.baseValue;
      boss.persistentData.putDouble("kubejs_base_armor", baseArmor);
    }

    let armorMultiplier = 1.0 + newPlayerCount * 0.5;
    armorAttribute.baseValue = baseArmor * armorMultiplier;
  }

  // DEFESA GERAL (ARMOR TOUGHNESS): +25% por player adicional
  let toughnessAttribute = boss.getAttribute("minecraft:generic.armor_toughness");
  if (toughnessAttribute) {
    let baseToughness = boss.persistentData.getDouble("kubejs_base_toughness");
    if (baseToughness === 0) {
      baseToughness = toughnessAttribute.baseValue;
      boss.persistentData.putDouble("kubejs_base_toughness", baseToughness);
    }

    let toughnessMultiplier = 1.0 + newPlayerCount * 0.25;
    toughnessAttribute.baseValue = baseToughness * toughnessMultiplier;
  }

  // Atualizar bossbar com a vida nova
  let bossUuid = boss.uuid.toString();
  let healthPercent = boss.health / boss.maxHealth;
  updateBossBarForBoss(bossUuid, boss.level.server, undefined, healthPercent);

  // Efeito visual de power up
  boss.level.server.runCommandSilent(`particle minecraft:end_rod ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 0.1 30 force`);
  boss.level.server.runCommandSilent(`particle minecraft:dragon_breath ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 0.05 20 force`);
  boss.level.server.runCommandSilent(`playsound minecraft:entity.evoker.prepare_summon hostile @a ${boss.x} ${boss.y} ${boss.z} 1 0.8`);

  // Anunciar power up apenas se for novo(s) player(s)
  let lastAnnounce = boss.persistentData.getLong("kubejs_last_scaling_announce");
  let currentTick = boss.level.server.tickCount;

  if (additionalPlayers > 0 && currentTick - lastAnnounce > 100) {
    boss.persistentData.putLong("kubejs_last_scaling_announce", currentTick);
    let bossName = boss.displayName.string;
    boss.level.server.tell([Component.gold(`⚡ ${bossName} §7ficou mais poderoso! §c(${newPlayerCount} player${newPlayerCount > 1 ? "s" : ""})`)]);
  }
}

/**
 * Limpar dados de scaling quando boss morre
 */
function cleanupBossScaling(bossUuid: string): void {
  // Dados agora estão no NBT do boss, não precisa limpar
}

// Adicionar verificação periódica no tick do servidor
ServerEvents.tick((event) => {
  let server = event.server;

  // Verificar a cada 2 segundos (40 ticks)
  if (server.tickCount % 40 !== 0) return;

  // Verificar todos os bosses ativos
  for (let formattedUuid in activeBosses) {
    let bossData = activeBosses[formattedUuid];
    let boss = findBossByUuid(server, bossData.uuid);

    if (boss && boss.isAlive()) {
      checkBossPlayerScaling(server, boss);
    }
  }
});

// Dados agora persistem no NBT do boss, não precisa de evento de morte específico

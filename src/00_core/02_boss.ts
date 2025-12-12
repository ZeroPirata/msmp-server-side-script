import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de boss...");

function asLiving(entity: $Entity): $LivingEntity | null {
  return entity as unknown as $LivingEntity;
}

function getSafeSpawnPos(level: $ServerLevel, x: number, z: number): BlockPos {
  let y = level.getHeight();
  let pos = new BlockPos(x, y, z);

  while (y > level.getMinBuildHeight() && level.getBlockState(pos).isAir()) {
    y--;
    pos = new BlockPos(x, y, z);
  }
  return new BlockPos(x, y + 3, z);
}

function generateRandomPositionBoss(server: $ServerLevel) {
  let msmpConfig = getMsmpConfig(server.getServer());
  if (msmpConfig === null) return;
  let spawn = server.getSharedSpawnPos();
  let angle = Math.random() * 2 * Math.PI;
  let distanceOffset = randomBetween(msmpConfig.MIN_DISTANCE, msmpConfig.MAX_DISTANCE);
  let distance = msmpConfig.SPAWN_SAFE_RADIUS + distanceOffset;
  let x = Math.floor(spawn.x + distance * Math.cos(angle));
  let z = Math.floor(spawn.z + distance * Math.sin(angle));
  let pos = getSafeSpawnPos(server, x, z);
  return pos;
}

function forceLoadBossChunk(level: $ServerLevel, pos: BlockPos) {
  let centerChunkX = Math.floor(pos.x / 16);
  let centerChunkZ = Math.floor(pos.z / 16);
  let radius = 1;
  bossChunkPositions = [];
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      let chunkX = centerChunkX + x;
      let chunkZ = centerChunkZ + z;
      level.setChunkForced(chunkX, chunkZ, true);
      bossChunkPositions.push({ x: chunkX, z: chunkZ });
    }
  }
}

function activateBoss(boss: $LivingEntity, player: $ServerPlayer, level: $ServerLevel) {
  boss.nbt.putBoolean("NoAI", false);
  boss.persistentData.putBoolean("kubejs_bossActivated", true);

  let bossName = boss.customName?.getString() || "Boss";

  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 0 0 0 1 5 force`);
  level.runCommandSilent(`particle minecraft:flame ${boss.x} ${boss.y} ${boss.z} 1 1 1 0.1 50 force`);
  level.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.8`);

  boss.potionEffects.add("minecraft:strength", 200, 1, false, false);
  boss.potionEffects.add("minecraft:speed", 200, 0, false, false);
}

function checkBossActivation(server: $MinecraftServer, boss: $LivingEntity) {
  if (boss.persistentData.getBoolean("kubejs_bossActivated")) return;

  let activationRange = boss.persistentData.getDouble("kubejs_activationRange") || 32.0;
  let bossPos = boss.position();

  let level = boss.level as $ServerLevel;
  let nearbyPlayers = level.players.filter((player) => {
    if (player.isSpectator() || !player.isAlive()) return false;
    let playerPos = player.position();
    let distance = Math.sqrt(Math.pow(playerPos.x - bossPos.x, 2) + Math.pow(playerPos.y - bossPos.y, 2) + Math.pow(playerPos.z - bossPos.z, 2));
    return distance <= activationRange;
  });

  if (nearbyPlayers.length > 0) {
    activateBoss(boss, nearbyPlayers[0], level);
  }
}

function prepareBossSpawn(server: $ServerLevel, bossConfig: IMiniBoss, x: number, y: number, z: number): void {
  let spawnPos = new BlockPos(x, y, z);
  forceLoadBossChunk(server, spawnPos);

  pendingBossSpawn = {
    config: bossConfig,
    x: x,
    y: y,
    z: z,
    activationRange: 64.0
  };

  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
  server.runCommandSilent(`tellraw @a "§c§l💥 ALERTA DE INVASÃO IMINENTE! 💥"`);
  server.runCommandSilent(`tellraw @a "§6LOCALIZAÇÃO: X:§a${Math.floor(x)}§6 | Y:§a${Math.floor(y)}§6 | Z:§a${Math.floor(z)}"`);
  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
}

function checkPendingBossActivation(server: $ServerLevel, pendingBoss: typeof pendingBossSpawn): void {
  if (!pendingBoss) return;

  let { config, x, y, z, activationRange } = pendingBoss;

  let nearbyPlayers = server.players.filter((player) => {
    if (player.isSpectator() || !player.isAlive()) return false;

    let playerPos = player.position();
    let distance = Math.sqrt(Math.pow(playerPos.x - x, 2) + Math.pow(playerPos.y - y, 2) + Math.pow(playerPos.z - z, 2));

    return distance <= activationRange;
  });

  if (nearbyPlayers.length > 0) {
    let player = nearbyPlayers[0];
    spawnBossAtPosition(server, config, x, y, z);
    pendingBossSpawn = null;
  }
}

function spawnBossAtPosition(server: $ServerLevel, bossConfig: IMiniBoss, x: number, y: number, z: number): void {
  let chunkX = Math.floor(x / 16);
  let chunkZ = Math.floor(z / 16);

  let chunk = server.getChunk(chunkX, chunkZ);
  if (!chunk) {
    console.log(`[MSMP] ERRO: Chunk não está carregado em ${chunkX}, ${chunkZ}`);
    return;
  }

  let mineServer = server.getServer();

  mineServer.scheduleInTicks(5, () => {
    let boss = server.createEntity(bossConfig.id as any);
    if (!boss) {
      console.log(`[MSMP] Falha ao criar boss: tipo inválido '${bossConfig.id}'`);
      removeBossChunkForceLoad(server);
      pendingBossSpawn = null;
      return;
    }

    boss.nbt.putByte("PersistenceRequired", 1);
    boss.nbt.putInt("DespawnDelay", -1);
    boss.nbt.putBoolean("CanPickUpLoot", false);
    boss.nbt.putBoolean("NoAI", true);
    boss.nbt.putBoolean("CustomPersistenceRequired", true);

    boss.setPos(x + 0.5, y, z + 0.5);
    boss.setCustomName(bossConfig.name);
    boss.setCustomNameVisible(true);

    let living = asLiving(boss);
    if (!living) {
      console.log(`[MSMP] Erro ao criar o boss: ${bossConfig.id}`);
      removeBossChunkForceLoad(server);
      pendingBossSpawn = null;
      return;
    }

    basicStatusEnemys(living, bossConfig);
    equipEntity(living, bossConfig.equipment);

    living.health = bossConfig.health;
    living.maxHealth = bossConfig.health;

    if (bossConfig.specialAbilities) {
      applyBossPotions(living, bossConfig.specialAbilities);
    }

    living.persistentData.putBoolean("kubejs_customDrops", true);
    living.persistentData.putString("kubejs_damageTracker", JSON.stringify({}));
    living.persistentData.putBoolean("kubejs_bossActivated", false);
    living.persistentData.putDouble("kubejs_activationRange", 24.0);
    living.persistentData.putInt("kubejs_bossChunkX", chunkX);
    living.persistentData.putInt("kubejs_bossChunkZ", chunkZ);
    applyBossPotions(living, bossConfig.specialAbilities);
    boss.spawn();
    server.setChunkForced(chunkX, chunkZ, true);

    server.runCommandSilent(`particle minecraft:explosion_emitter ${x} ${y + 1} ${z} 1 1 1 0.5 10 force`);
    server.runCommandSilent(`particle minecraft:soul_fire_flame ${x} ${y} ${z} 2 2 2 0.1 100 force`);
    server.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${x} ${y} ${z} 3 0.8`);

    let mineServer = server.getServer();
    createBossBar(mineServer, `${bossConfig.name} - Aguardando...`, "PURPLE", "PROGRESS");
    setBossActive(living, bossConfig);
  });
}

function applyBossPotions(living: $LivingEntity, abilities: string[]): void {
  if (!abilities) return;
  let EFFECTS: Record<string, { id: string; duration: number; amplifier: number }> = {
    regeneration: { id: "minecraft:regeneration", duration: 999999, amplifier: 1 },
    speed: { id: "minecraft:speed", duration: 999999, amplifier: 1 },
    speed_burst: { id: "minecraft:speed", duration: 999999, amplifier: 2 },
    strength: { id: "minecraft:strength", duration: 999999, amplifier: 1 },
    resistance: { id: "minecraft:resistance", duration: 999999, amplifier: 1 },
    fire_resistance: { id: "minecraft:fire_resistance", duration: 999999, amplifier: 0 },
    water_breathing: { id: "minecraft:water_breathing", duration: 999999, amplifier: 0 },
    night_vision: { id: "minecraft:night_vision", duration: 999999, amplifier: 0 },
    invisibility: { id: "minecraft:invisibility", duration: 999999, amplifier: 0 },
    haste: { id: "minecraft:haste", duration: 999999, amplifier: 1 },
    mining_fatigue: { id: "minecraft:mining_fatigue", duration: 999999, amplifier: 1 },
    jump_boost: { id: "minecraft:jump_boost", duration: 999999, amplifier: 2 },
    poison: { id: "minecraft:poison", duration: 999999, amplifier: 1 },
    weakness: { id: "minecraft:weakness", duration: 999999, amplifier: 1 },
    wither: { id: "minecraft:wither", duration: 999999, amplifier: 1 },
    glowing: { id: "minecraft:glowing", duration: 999999, amplifier: 0 },
    absorption: { id: "minecraft:absorption", duration: 999999, amplifier: 3 },
    health_boost: { id: "minecraft:health_boost", duration: 999999, amplifier: 4 },
    saturation: { id: "minecraft:saturation", duration: 999999, amplifier: 5 },
    luck: { id: "minecraft:luck", duration: 999999, amplifier: 2 },
    unluck: { id: "minecraft:unluck", duration: 999999, amplifier: 2 },
    slow_falling: { id: "minecraft:slow_falling", duration: 999999, amplifier: 0 },
    dolphin_grace: { id: "minecraft:dolphins_grace", duration: 999999, amplifier: 1 }
  };
  abilities.forEach((key) => {
    let cfg = EFFECTS[key];
    if (!cfg) return;
    living.potionEffects.add(cfg.id as any, cfg.duration, cfg.amplifier, false, true);
  });
}

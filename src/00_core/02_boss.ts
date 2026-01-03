import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $Heightmap } from "net.minecraft.world.level.levelgen.Heightmap";
import { $Heightmap$Types } from "net.minecraft.world.level.levelgen.Heightmap$Types";

console.log("[MSMP] Carregando core de boss...");

function asLiving(entity: $Entity): $LivingEntity | null {
  return entity as unknown as $LivingEntity;
}

function getSafeSpawnPos(level: $ServerLevel, x: number, z: number, spawnY: number): BlockPos {
  let surfaceY = level.getHeight(HeightmapTypes.MOTION_BLOCKING_NO_LEAVES, x, z);

  let maxY = spawnY + 15;
  if (surfaceY > maxY) {
    surfaceY = maxY;
    let tempPos = new BlockPos(x, surfaceY, z);
    while (surfaceY > level.getMinBuildHeight()) {
      let blockBelow = level.getBlockState(tempPos.below());
      if (blockBelow.isSolid()) break;
      surfaceY--;
      tempPos = tempPos.below();
    }
  }

  return new BlockPos(x, surfaceY, z);
}

function generateRandomPositionBoss(level: $ServerLevel, msmpConfig: any) {
  if (!msmpConfig) return null;
  let spawn = level.getSharedSpawnPos();
  let angle = Math.random() * 2 * Math.PI;
  let distanceOffset = randomBetween(msmpConfig.MIN_DISTANCE, msmpConfig.MAX_DISTANCE);
  let distance = msmpConfig.SPAWN_SAFE_RADIUS + distanceOffset;
  let x = Math.floor(spawn.x + distance * Math.cos(angle));
  let z = Math.floor(spawn.z + distance * Math.sin(angle));
  return getSafeSpawnPos(level, x, z, spawn.y);
}

function activateBoss(boss: $LivingEntity, player: $ServerPlayer, level: $ServerLevel) {
  boss.nbt.putBoolean("NoAI", false);
  boss.persistentData.putBoolean("kubejs_bossActivated", true);

  if (boss.vehicle) {
    boss.vehicle.nbt.putBoolean("NoAI", false);
  }

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

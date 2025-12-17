import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de chuncks...");

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

function removeBossChunkForceLoad(level: $ServerLevel, bossUuid: string): void {
  if (!bossUuid) {
    console.log("[MULTI-BOSS] removeBossChunkForceLoad: bossUuid está undefined");
    return;
  }

  let bossUuidFormated = bossUuid.split("-").join("").toLowerCase();
  let bossData = activeBosses[bossUuidFormated];
  if (!bossData) return;

  let boss = findBossByUuid(level.server, bossUuid);
  if (!boss) return;

  let chunkX = boss.persistentData.getInt("kubejs_bossChunkX");
  let chunkZ = boss.persistentData.getInt("kubejs_bossChunkZ");

  level.setChunkForced(chunkX, chunkZ, false);
}

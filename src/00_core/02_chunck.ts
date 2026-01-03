import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

// Variável global para controle (opcional, mas bom para debug)
let bossChunkPositions = [];

function forceLoadBossChunk(level: $ServerLevel, pos: $BlockPos) {
  if (!level) return;
  let server = level.getServer();
  if (!server) return;

  let cx = pos.x >> 4;
  let cz = pos.z >> 4;

  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) {
      server.runCommandSilent(`forceload add ${(cx + x) * 16} ${(cz + z) * 16}`);
    }
  }
}

function removeBossChunkForceLoad(level: $ServerLevel, bossUuid: string): void {
  if (!bossUuid) return;

  // Buscamos o boss para ler as coordenadas salvas no NBT dele
  let boss = findBossByUuid(level.server, bossUuid);
  if (!boss) return;

  let chunkX = boss.persistentData.getInt("kubejs_bossChunkX");
  let chunkZ = boss.persistentData.getInt("kubejs_bossChunkZ");

  // Se as coordenadas forem 0,0 (padrão se não existir), pode ser erro,
  // então verificamos se realmente foi salvo algo
  if (chunkX === 0 && chunkZ === 0) return;

  let radius = 1;
  for (let x = -radius; x <= radius; x++) {
    for (let z = -radius; z <= radius; z++) {
      level.server.runCommandSilent(`forceload remove ${(chunkX + x) * 16} ${(chunkZ + z) * 16}`);
    }
  }
  console.log(`[CHUNKS] Área de boss ${bossUuid} liberada.`);
}

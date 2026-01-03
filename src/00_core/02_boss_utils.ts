import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";

function findBossByUuid(server: $MinecraftServer, uuid: string): $LivingEntity | null {
  let found: $LivingEntity | null = null;
  let entity = server.overworld().getEntityByUUID(uuid);
  if (!entity) return null;
  found = entity as $LivingEntity;
  return found;
}

function removeBossChunkForceLoadMulti(level: $ServerLevel, chunkX: number, chunkZ: number): void {
  level.setChunkForced(chunkX, chunkZ, false);
}

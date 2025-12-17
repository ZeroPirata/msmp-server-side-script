function findBossByUuid(server: $MinecraftServer, uuid: string): $LivingEntity | null {
  let found: $LivingEntity | null = null;
  server.overworld().entities.forEach((entity) => {
    if (entity.uuid.toString() === uuid) {
      found = entity as $LivingEntity;
    }
  });
  return found;
}

function removeBossChunkForceLoadMulti(level: $ServerLevel, chunkX: number, chunkZ: number): void {
  level.setChunkForced(chunkX, chunkZ, false);
}

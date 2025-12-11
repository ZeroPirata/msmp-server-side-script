EntityEvents.death((event) => {
  let entity = event.entity;
  let level = entity.level;
  let server = event.server;
  let pd = entity.persistentData;
  if (!pd.contains("kubejs_customDrops")) return;

  let pos = entity.blockPosition();
  if (!level.isClientSide()) {
    removeBossChunkForceLoad(level as $ServerLevel);
    removeBossBar(server);
    pendingBossSpawn = null;
  }
  pd.remove("kubejs_customDrops");
});

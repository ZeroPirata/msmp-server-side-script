EntityEvents.death((event) => {
  let entity = event.entity;
  let level = entity.level;
  let server = event.server;
  let pd = entity.persistentData;
  if (!pd.contains("kubejs_customDrops")) return;
  let pos = entity.blockPosition();
  if (!level.isClientSide()) {
    server.scheduleInTicks(2, () => {
      level.runCommandSilent(`execute positioned ${pos.x} ${pos.y} ${pos.z} run kill @e[type=item,distance=..5]`);
    });
    clearBossFromAllPlayers(entity.stringUuid);
    removeBossChunkForceLoad(level as $ServerLevel);
    removeBossBar(server);
    pendingBossSpawn = null;
  }
  pd.remove("kubejs_customDrops");
});

function registerActiveBoss(boss: $LivingEntity, config: IMiniBoss, spawnDay: number, server: $MinecraftServer): void {
  let uuid = boss.uuid.toString();
  let bossUuidFormated = uuid.split("-").join("").toLowerCase();
  let bossBarId = `${bossUuidFormated}`;
  let bossData: ActiveBossData = {
    uuid: uuid,
    config: config,
    bossBarId: bossBarId,
    spawnDay: spawnDay,
    position: { x: boss.x, y: boss.y, z: boss.z },
    isAlive: true
  };
  activeBosses[bossUuidFormated] = bossData;
  bossActivationCheckTimers[bossUuidFormated] = 0;
  createBossBarForBoss(server, uuid, `${config.name} - Aguardando...`, "PURPLE", "PROGRESS");
  console.log(`[MULTI-BOSS] Boss registrado: ${config.name} (${uuid})`);
}

function unregisterActiveBoss(server: $MinecraftServer, bossUuid: string): void {
  let bossUuidFormated = bossUuid.split("-").join("").toLowerCase();
  removeBossBarForBoss(server, bossUuid);
  delete activeBosses[bossUuidFormated];
  delete bossActivationCheckTimers[bossUuidFormated];
}

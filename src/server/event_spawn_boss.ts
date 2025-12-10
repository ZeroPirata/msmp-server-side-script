ServerEvents.tick((e) => {
  let level = e.server;
  let msmpConfig = getMsmpConfig(level);
  if (msmpConfig === null) return;

  let lastBossSpawnDay = level.persistentData.getInt(TAG_LAST_DAY);

  let { boss, config }: { boss: $LivingEntity; config: IMiniBoss } = getBossActive(level);

  if (boss && boss.isAlive() && boss.isAddedToLevel()) {
    bossActivationCheckTimer++;
    if (bossActivationCheckTimer >= 20) {
      bossActivationCheckTimer = 0;
      checkBossActivation(level, boss);
    }
    return;
  }

  if (boss && !boss.isAlive()) {
    removeBossChunkForceLoad(level.overworld());
    pendingBossSpawn = null;
  }

  if (pendingBossSpawn !== null) {
    checkPendingBossActivation(level.overworld(), pendingBossSpawn);
    return;
  }

  let overworld = level.overworld();
  let isNight = overworld.isNight();
  if (!isNight) return;

  let day = Math.floor(overworld.getDayTime() / 24000);
  if (day < msmpConfig.MIN_DAY) return;
  if (lastBossSpawnDay === day) return;

  let roll = randomBetween(1, 100);
  if (roll > msmpConfig.CHANCE_PERCENT) return;

  lastBossSpawnDay = day;
  level.persistentData.putInt(TAG_LAST_DAY, day);

  let bossConfig = getRandomBoss();
  let pos = generateRandomPositionBoss(overworld);

  prepareBossSpawn(overworld, bossConfig, pos.getX(), pos.getY(), pos.getZ());
});

import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";

ServerEvents.tick((e) => {
  let server = e.server;

  if (!cachedMsmpConfig || server.tickCount - lastConfigReload > 1200) {
    cachedMsmpConfig = getMsmpConfig(server);
    lastConfigReload = server.tickCount;
  }

  if (!cachedMsmpConfig) return;

  for (let formattedUuid in activeBosses) {
    let bossData = activeBosses[formattedUuid];
    let boss = findBossByUuid(server, bossData.uuid);

    if (boss) {
      if (boss.isAlive() && boss.isAddedToLevel()) {
        bossPhases(boss, bossData.config, server, bossData.uuid);
      } else if (!boss.isAlive()) {
        removeBossChunkForceLoad(boss.level, bossData.uuid);
        unregisterActiveBoss(server, bossData.uuid);
      }
    } else {
      console.log(`[MSMP] Boss ${bossData.uuid} está fora de alcance, aguardando...`);
    }
  }
  // --- FIM DA ALTERAÇÃO ---

  // O resto do código permanece idêntico
  if (server.tickCount % 100 !== 0) return;

  let overworld = server.overworld();
  if (pendingBosses.length > 0) {
    checkPendingBosses(overworld);
  }

  let currentDay = Math.floor(overworld.getDayTime() / 24000);
  let isNight = overworld.isNight();

  if (!isNight) {
    if (currentNightState && currentNightState.day < currentDay) {
      currentNightState = null;
      server.persistentData.remove("kubejs_night_state");
    }
    return;
  }

  if (!currentNightState || currentNightState.day < currentDay) {
    let loaded = loadNightState(server);
    if (loaded && loaded.day === currentDay) {
      currentNightState = loaded;
    } else {
      currentNightState = initNightState(currentDay);
      saveNightState(server, currentNightState);
    }
  }

  if (currentNightState.spawnedCount >= cachedMsmpConfig.MAX_BOSS_NIGHT) return;
  if (currentNightState.attemptCount >= cachedMsmpConfig.MAX_SPAWN_ATTEMPTS) return;
  if (currentDay < cachedMsmpConfig.MIN_DAY) return;

  let roll = randomBetween(1, 100);
  if (roll > cachedMsmpConfig.CHANCE_PERCENT) return;

  currentNightState.attemptCount++;
  saveNightState(server, currentNightState);

  attemptBossSpawn(server, overworld, currentNightState, cachedMsmpConfig, currentDay);
});

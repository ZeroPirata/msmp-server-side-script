import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";

ServerEvents.tick((e) => {
  let server = e.server;
  let overworld = server.overworld();
  let msmpConfig = getMsmpConfig(server);
  if (!msmpConfig) return;

  let currentDay = Math.floor(overworld.getDayTime() / 24000);
  let isNight = overworld.isNight();

  // Processa bosses ativos
  let bossKeys = Object.keys(activeBosses);
  for (let i = 0; i < bossKeys.length; i++) {
    let formattedUuid = bossKeys[i];
    let bossData = activeBosses[formattedUuid];
    if (!bossData) continue;

    let boss = findBossByUuid(server, bossData.uuid);

    if (boss && boss.isAlive() && boss.isAddedToLevel()) {
      // Gerencia fases e habilidades
      bossPhases(boss, bossData.config, server, bossData.uuid);

      // Verifica ativação
      let timer = bossActivationCheckTimers[formattedUuid] || 0;
      timer++;
      bossActivationCheckTimers[formattedUuid] = timer;

      if (timer >= 20) {
        bossActivationCheckTimers[formattedUuid] = 0;
        checkBossActivation(server, boss);
      }
    } else if (boss && !boss.isAlive()) {
      // Boss morreu
      removeBossChunkForceLoad(boss.level, bossData.uuid);
      unregisterActiveBoss(server, bossData.uuid);
    } else {
      // Boss não encontrado (pode ter sido removido ou descarregado)
      unregisterActiveBoss(server, bossData.uuid);
    }
  } // <-- O fechamento do FOR era aqui

  // Processa bosses pendentes (SEMPRE)
  if (pendingBosses.length > 0) {
    checkPendingBosses(overworld);
  }

  if (!isNight) {
    if (currentNightState && currentNightState.day < currentDay) {
      console.log(`[MULTI-BOSS] Novo dia amanheceu. Resetando estado da noite.`);
      currentNightState = null;
      server.persistentData.remove("kubejs_night_state");
    }
    return; // Agora este return é válido porque está dentro do tick
  }

  if (!currentNightState || currentNightState.day < currentDay) {
    let loaded = loadNightState(server);
    if (loaded && loaded.day === currentDay) {
      currentNightState = loaded;
      console.log(`[MULTI-BOSS] Estado da noite carregado: Dia ${currentDay}, Spawnados: ${currentNightState.spawnedCount}`);
    } else {
      currentNightState = initNightState(currentDay);
      saveNightState(server, currentNightState);
      console.log(`[MULTI-BOSS] Nova noite iniciada: Dia ${currentDay}`);
    }
  }

  if (currentNightState.spawnedCount >= msmpConfig.MAX_BOSS_NIGHT) return;
  if (currentNightState.attemptCount >= msmpConfig.MAX_SPAWN_ATTEMPTS) return;
  if (currentDay < msmpConfig.MIN_DAY) return;

  // Roll de chance
  let roll = randomBetween(1, 100);
  if (roll > msmpConfig.CHANCE_PERCENT) return;

  // Incrementa tentativa
  currentNightState.attemptCount++;
  saveNightState(server, currentNightState);

  // Tenta spawnar um novo boss
  attemptBossSpawn(server, overworld, currentNightState, msmpConfig, currentDay);
});

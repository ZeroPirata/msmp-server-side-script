EntityEvents.death((event) => {
  let entity = event.entity;
  let level = entity.level;
  let server = event.server;
  let pd = entity.persistentData;

  // ============================================
  // VERIFICAR SE É BOSS DA BLOOD MOON
  // ============================================
  if (pd.getBoolean("kubejs_blood_moon_boss")) {
    let bossUUID = entity.uuid.toString();
    console.log(`[MSMP Blood Moon] Boss da Blood Moon morto! UUID: ${bossUUID}`);

    // Verificar e marcar como morto no estado da Blood Moon
    if (currentBloodMoonState && currentBloodMoonState.bossUuid === bossUUID) {
      if (!currentBloodMoonState.bossKilled) {
        currentBloodMoonState.bossKilled = true;
        saveBloodMoonState(server, currentBloodMoonState);
        announceBloodMoonBossKilled(server);
        console.log("[MSMP Blood Moon] Boss da Blood Moon confirmado como derrotado!");
      }
    }
  }

  if (!pd.contains("kubejs_customDrops")) return;

  let bossUUID = entity.uuid.toString();
  let bossUuidFormated = bossUUID.split("-").join("").toLowerCase();

  let bossData = activeBosses[bossUuidFormated];

  if (!bossData) {
    let bossType = pd.getString("boss_type");
    let possibleConfig = MINIBOSSES.find((b) => b.classe === bossType);
    if (!possibleConfig) {
      let bossKeys = Object.keys(activeBosses);
      for (let i = 0; i < bossKeys.length; i++) {
        let uuid = bossKeys[i];
        let data = activeBosses[uuid];
      }
      return;
    }
    bossData = {
      uuid: bossUUID,
      config: possibleConfig,
      bossBarId: bossUuidFormated,
      spawnDay: Math.floor(level.dayTime() / 24000),
      position: { x: entity.x, y: entity.y, z: entity.z }
    };
  }

  let config = bossData.config;
  let msmpConfig = getMsmpConfig(server);

  let source = event.source.actual;
  if (source && source.isPlayer()) {
    let playerUUID = source.uuid.toString();
    let maxHealth = entity.maxHealth;

    if (!(bossUUID in damageAccumulator)) {
      damageAccumulator[bossUUID] = {};
    }

    let bossTracker = damageAccumulator[bossUUID];
    let currentTotal = 0;
    let playerUUIDs = Object.keys(bossTracker);
    for (let i = 0; i < playerUUIDs.length; i++) {
      currentTotal += bossTracker[playerUUIDs[i]];
    }

    let missingDamage = maxHealth - currentTotal;
    if (missingDamage > 0) {
      let currentDamage = bossTracker[playerUUID] || 0;
      bossTracker[playerUUID] = currentDamage + missingDamage;
    }
  }

  if (bossUUID in damageAccumulator) {
    let tracker = damageAccumulator[bossUUID];
    let existingTracker = pd.getString("kubejs_damageTracker");
    let fullTracker: DamageTracker = existingTracker ? JSON.parse(existingTracker) : {};

    let playerUUIDs = Object.keys(tracker);
    for (let i = 0; i < playerUUIDs.length; i++) {
      let playerUUID = playerUUIDs[i];
      let damage = tracker[playerUUID];
      if (!fullTracker[playerUUID]) {
        let player = server.getPlayerList().getPlayer(playerUUID);
        fullTracker[playerUUID] = {
          playerName: player?.username || "Desconhecido",
          damage: 0
        };
      }
      fullTracker[playerUUID].damage += damage;
    }

    pd.putString("kubejs_damageTracker", JSON.stringify(fullTracker));
    delete damageAccumulator[bossUUID];
  }

  if (pd.contains("kubejs_damageTracker")) {
    let trackerString = pd.getString("kubejs_damageTracker");
    let tracker = JSON.parse(trackerString);
    let uuids = Object.keys(tracker);

    if (uuids.length > 0) {
      let totalDamage = uuids.reduce((sum, u) => sum + tracker[u].damage, 0);
      let bossPos = entity.blockPosition();
      let totalOnlinePlayers = level.players.filter((p) => p && p.isAlive() && !p.isSpectator()).length;
      let playersToScale = Math.max(0, totalOnlinePlayers - 1);
      let dropMultiplier = 1.0 + playersToScale * (config.scaling?.dropMultiplierFactor ?? 0.15);

      let ranking = uuids.map((uuid) => {
        let data = tracker[uuid];
        return { uuid: uuid, playerName: data.playerName, damage: data.damage };
      });

      ranking.sort((a, b) => b.damage - a.damage);

      let winnerMessages: string[] = [];
      winnerMessages.push("§a=======================================");
      winnerMessages.push(`§c${config.name} DERROTADO!`);
      winnerMessages.push("§a=======================================");

      let activePlayers: string[] = [];

      server.scheduleInTicks(5, () => {
        ranking.forEach((data, index) => {
          let rank = index + 1;
          let damagePercent = data.damage / totalDamage;
          let rankDisplay = rankingPlayersRaid(rank);
          let damageP = (damagePercent * 100).toFixed(1);
          winnerMessages.push(`${rankDisplay} §r- §b${data.playerName} §7(${damageP}%)`);

          let lootTableSuffix = demageLootCalculate(damagePercent);
          let lootTable = `kubejs:${config.lootrName}_${lootTableSuffix}`;
          let offsetX = index * 2;
          let chestPos = new BlockPos(bossPos.x + offsetX, bossPos.y + 1, bossPos.z);

          let setblockCommand = `setblock ${chestPos.x} ${chestPos.y} ${chestPos.z} lootr:lootr_chest{LootTable:"${lootTable}",CustomName:'{"text":"§6${data.playerName}"}'} replace`;
          server.runCommandSilent(setblockCommand);

          let chestKey = getChestKey(chestPos);
          let key = getPlayerChestKey(chestKey, data.uuid);
          let save: PlayerChestData = {
            lootTable: lootTable,
            damagePercent: damagePercent,
            used: false,
            dropMultiplier: dropMultiplier
          };

          server.persistentData.putString(key, JSON.stringify(save));
          saveChestKey(data.uuid, { pos: chestPos, ticks: 0 }, server);
          activePlayers.push(data.uuid);

          server.runCommandSilent(`particle minecraft:totem_of_undying ${chestPos.x + 0.5} ${chestPos.y + 1} ${chestPos.z + 0.5} 0.2 0.2 0.2 0.05 15 force @a`);
        });

        saveActiveChestPlayers(activePlayers, server);
        winnerMessages.push("§a=======================================");

        winnerMessages.forEach((line) => {
          server.runCommandSilent(`execute positioned ${bossPos.x} ${bossPos.y} ${bossPos.z} run tellraw @a[distance=..64] "${line}"`);
        });

        if (msmpConfig) {
          let minutes = msmpConfig.DELAY_TICKS / 1200;
          activePlayers.forEach((uuid) => {
            let player = server.getPlayerList().getPlayer(uuid);
            if (player) {
              player.tell(`§eO baú irá desaparecer em ${minutes} minutos!`);
            }
          });
        }
      });
    }
  }

  // Limpa dados
  pd.remove("kubejs_damageTracker");
  pd.remove("kubejs_isEnraged");
  pd.remove("kubejs_maxHealth");
  pd.remove("kubejs_bossActivated");
  pd.remove("kubejs_activationRange");

  for (let i = 0; i < 10; i++) {
    pd.remove(`phase_${i}_crystals`);
    pd.remove(`phase_${i}_crystalDamage`);
    pd.remove(`phase_${i}_crystalsCleared`);
    pd.remove(`phase_${i}_inRitual`);
    pd.remove(`phase_${i}_ritualStartTick`);
    pd.remove(`phase_${i}_baseDamage`);
    for (let j = 0; j < 20; j++) {
      pd.remove(`phase_${i}_ability_${j}_lastTick`);
    }
  }
  pd.remove("currentPhase");
  pd.remove("lastPhaseChangeTick");

  unregisterActiveBoss(server, bossUUID);
});

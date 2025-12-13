EntityEvents.death((event) => {
  let entity = event.entity;
  let level = entity.level;
  let server = event.server;
  let pd = entity.persistentData;

  if (!pd.contains("kubejs_customDrops")) return;

  let msmpConfig = getMsmpConfig(server);
  if (msmpConfig === null) {
    console.log(`[BOSS DEATH] ERRO: msmpConfig é null!`);
    return;
  }

  let { boss, config } = getBossActive(server);
  if (!boss || !config) {
    console.log(`[BOSS DEATH] ERRO: Boss ou config não encontrado!`);
    return;
  }

  let bossUUID = entity.uuid.toString();
  if (damageAccumulator.has(bossUUID)) {
    let tracker = damageAccumulator.get(bossUUID);
    let existingTracker = pd.getString("kubejs_damageTracker");
    let fullTracker: DamageTracker = existingTracker ? JSON.parse(existingTracker) : {};

    tracker.forEach((damage, playerUUID) => {
      if (!fullTracker[playerUUID]) {
        let player = server.getPlayerList().getPlayer(playerUUID);
        fullTracker[playerUUID] = {
          playerName: player?.username || "Desconhecido",
          damage: 0
        };
      }
      fullTracker[playerUUID].damage += damage;
    });

    pd.putString("kubejs_damageTracker", JSON.stringify(fullTracker));
    damageAccumulator.delete(bossUUID);
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
        return {
          uuid: uuid,
          playerName: data.playerName,
          damage: data.damage
        };
      });

      ranking.sort((a, b) => b.damage - a.damage);

      let winnerMessages: string[] = [];
      winnerMessages.push("§a=======================================");
      winnerMessages.push("§cBOSS DERROTADO! PARTICIPANTES DA RAID");
      winnerMessages.push("§a=======================================");

      let activePlayers: string[] = [];

      server.scheduleInTicks(5, () => {
        ranking.forEach((data, index) => {
          let rank = index + 1;
          let damagePercent = data.damage / totalDamage;
          let rankDisplay = rankingPlayersRaid(rank);
          let damageP = (damagePercent * 100).toFixed(1);
          winnerMessages.push(`${rankDisplay} §r- §b${data.playerName} §7(Dano: ${damageP}%)`);

          let lootTableSuffix = demageLootCalculate(damagePercent);
          let lootTable = `kubejs:${config.lootrName}_${lootTableSuffix}`;
          let offsetX = index * 2;
          let chestPos = new BlockPos(bossPos.x + offsetX, bossPos.y + 1, bossPos.z);

          // Cria o baú
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

          // ✅ Partículas reduzidas
          server.runCommandSilent(`particle minecraft:totem_of_undying ${chestPos.x + 0.5} ${chestPos.y + 1} ${chestPos.z + 0.5} 0.2 0.2 0.2 0.05 15 force @a`);
        });

        saveActiveChestPlayers(activePlayers, server);
        winnerMessages.push("§a=======================================");

        // ✅ Mensagens só para players próximos
        winnerMessages.forEach((line) => {
          server.runCommandSilent(`execute positioned ${bossPos.x} ${bossPos.y} ${bossPos.z} run tellraw @a[distance=..64] "${line}"`);
        });

        let minutes = msmpConfig.DELAY_TICKS / 1200;
        activePlayers.forEach((uuid) => {
          let player = server.getPlayerList().getPlayer(playerUUID);
          if (player) {
            player.tell(`§eO baú irá desaparecer em ${minutes} minutos!`);
          }
        });
      });
    }
  }

  // ✅ Cleanup imediato
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
});

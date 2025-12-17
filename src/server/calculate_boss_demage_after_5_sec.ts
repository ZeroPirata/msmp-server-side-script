ServerEvents.tick((e) => {
  if (e.server.tickCount % 100 !== 0) return;

  let bossUUIDs = Object.keys(damageAccumulator);
  for (let i = 0; i < bossUUIDs.length; i++) {
    let bossUUID = bossUUIDs[i];
    let tracker = damageAccumulator[bossUUID];
    let boss = e.server.overworld().getEntityByUUID(bossUUID);
    if (!boss) {
      delete damageAccumulator[bossUUID];
      continue;
    }

    let pd = boss.persistentData;
    let existingTracker = pd.getString("kubejs_damageTracker");
    let fullTracker: DamageTracker = existingTracker ? JSON.parse(existingTracker) : {};

    let playerUUIDs = Object.keys(tracker);
    for (let j = 0; j < playerUUIDs.length; j++) {
      let playerUUID = playerUUIDs[j];
      let damage = tracker[playerUUID];
      if (!fullTracker[playerUUID]) {
        let player = e.server.getPlayerList().getPlayer(playerUUID);
        fullTracker[playerUUID] = {
          playerName: player?.username || "Desconhecido",
          damage: 0
        };
      }
      fullTracker[playerUUID].damage += damage;
    }

    pd.putString("kubejs_damageTracker", JSON.stringify(fullTracker));
    damageAccumulator[bossUUID] = {};
  }
});

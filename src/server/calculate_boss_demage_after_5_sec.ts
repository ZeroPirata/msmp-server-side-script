ServerEvents.tick((e) => {
  if (e.server.tickCount % 100 !== 0) return;

  damageAccumulator.forEach((tracker, bossUUID) => {
    let boss = e.server.overworld().getEntityByUUID(bossUUID);
    if (!boss) {
      damageAccumulator.delete(bossUUID);
      return;
    }

    let pd = boss.persistentData;
    let existingTracker = pd.getString("kubejs_damageTracker");
    let fullTracker: DamageTracker = existingTracker ? JSON.parse(existingTracker) : {};

    tracker.forEach((damage, playerUUID) => {
      if (!fullTracker[playerUUID]) {
        let player = e.server.getPlayerList().getPlayer(playerUUID);
        fullTracker[playerUUID] = {
          playerName: player?.username || "Desconhecido",
          damage: 0
        };
      }
      fullTracker[playerUUID].damage += damage;
    });

    pd.putString("kubejs_damageTracker", JSON.stringify(fullTracker));
    tracker.clear();
  });
});
EntityEvents.afterHurt((event) => {
  let e = event.entity;
  let pd = e.persistentData;

  if (!pd.contains("kubejs_customDrops")) return;
  let source = event.source.actual;

  if (!source || !source.isPlayer()) return;
  let player = source;
  let damage = event.damage;

  let trackerJson = pd.getString("kubejs_damageTracker");
  let tracker: DamageTracker = trackerJson ? JSON.parse(trackerJson) : {};

  let uuid = player.uuid.toString();
  if (!tracker[uuid]) {
    tracker[uuid] = {
      playerName: player.username,
      damage: 0
    };
  }
  tracker[uuid].damage += damage;
  pd.putString("kubejs_damageTracker", JSON.stringify(tracker));
});

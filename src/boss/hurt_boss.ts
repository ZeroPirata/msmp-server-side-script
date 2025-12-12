EntityEvents.afterHurt((event) => {
  let e = event.entity;
  let pd = e.persistentData;

  if (!pd.contains("kubejs_customDrops")) return;
  let source = event.source.actual;

  if (!source || !source.isPlayer()) return;
  let player = source;
  let damage = event.damage;

  let bossUUID = e.uuid.toString();
  let playerUUID = player.uuid.toString();

  if (!damageAccumulator.has(bossUUID)) {
    damageAccumulator.set(bossUUID, new Map());
  }

  let bossTracker = damageAccumulator.get(bossUUID);
  let currentDamage = bossTracker.get(playerUUID) || 0;
  bossTracker.set(playerUUID, currentDamage + damage);
});

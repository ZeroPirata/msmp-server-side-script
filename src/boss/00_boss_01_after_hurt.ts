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

  if (!(bossUUID in damageAccumulator)) {
    damageAccumulator[bossUUID] = {};
  }

  let bossTracker = damageAccumulator[bossUUID];
  let currentDamage = bossTracker[playerUUID] || 0;
  bossTracker[playerUUID] = currentDamage + damage;
});

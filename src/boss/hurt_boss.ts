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

  let living = e;
  let currentHealth = living.health;
  let maxHealth = pd.getFloat("kubejs_maxHealth");
  let enrageThreshold = pd.getFloat("kubejs_enrageThreshold");
  let isEnraged = pd.getBoolean("kubejs_isEnraged");

  let tick = event.server.tickCount;
  if (pd.getLong("kubejs_lastEnrageTick") === tick) return;

  if (enrageThreshold > 0 && !isEnraged && currentHealth / maxHealth <= enrageThreshold) {
    e.server.runCommandSilent(`tellraw @a [{"text":"§c§l⚡ ${living.customName} ESTÁ ENFURECIDO! ⚡"}]`);
    e.server.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl master @a ${e.x} ${e.y} ${e.z} 2.0 0.5`);

    pd.putLong("kubejs_lastEnrageTick", tick);
    pd.putBoolean("kubejs_isEnraged", true);

    let enrageAbilities = ["strength", "speed_burst", "resistance"];
    applyBossPotions(living, enrageAbilities);

    let originalAbilities = pd.getString("kubejs_specialAbilities");
    if (originalAbilities) {
      let abilities = JSON.parse(originalAbilities);
      applyBossPotions(living, abilities);
    }

    if (pd.getBoolean("kubejs_summonMinions")) {
      envokeMinions(e.level);
      e.server.runCommandSilent(`tellraw @a [{"text":"§e⚠ Reforços foram convocados!"}]`);
    }
  }
});

EntityEvents.death((event) => {
  let entity = event.entity;
  let pd = entity.persistentData;
  let level = entity.level;
  let server = event.server;
  if (!pd.getBoolean("kubejs_personalized_minion")) return;
  let abilitiesRaw = pd.getString("kubejs_minion_abilities");
  if (abilitiesRaw) {
    let abilities: IMinionAbility[] = JSON.parse(abilitiesRaw);
    abilities.forEach((ability, index) => {
      let abilityKey = `kubejs_minion_ability_${index}_lastTick`;
      pd.remove(abilityKey);
    });
  }
  pd.remove("kubejs_personalized_minion");
  pd.remove("kubejs_minion_abilities");
  let pos = entity.blockPosition();
  server.scheduleInTicks(2, () => {
    level.runCommandSilent(`execute positioned ${pos.x} ${pos.y} ${pos.z} run kill @e[type=item,distance=..3]`);
  });
});

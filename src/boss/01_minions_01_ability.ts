import { $PathfinderMob } from "net.minecraft.world.entity.PathfinderMob";

ServerEvents.tick((event) => {
  let level = event.server.overworld();
  let currentTick = event.server.getTickCount();
  if (currentTick % 5 !== 0) return;
  level.getEntities().forEach((entity) => {
    if (!entity.isLiving()) return;
    let living = entity as $LivingEntity;
    let pd = living.persistentData;
    if (!pd.getBoolean("kubejs_personalized_minion")) return;
    let abilitiesRaw = pd.getString("kubejs_minion_abilities");
    if (!abilitiesRaw) return;
    let abilities: IMinionAbility[] = JSON.parse(abilitiesRaw);
    abilities.forEach((ability, index) => {
      let abilityKey = `kubejs_minion_ability_${index}_lastTick`;
      let lastTick = pd.getInt(abilityKey) || 0;
      if (currentTick - lastTick < ability.config.intervalTicks) return;
      executeMinionAbility(living, ability, level, currentTick);
      pd.putInt(abilityKey, currentTick);
    });
  });
});

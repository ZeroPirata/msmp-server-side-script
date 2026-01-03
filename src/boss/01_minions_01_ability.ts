import { $PathfinderMob } from "net.minecraft.world.entity.PathfinderMob";
import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";

let activeMinions = [];

ServerEvents.tick((event) => {
  let currentTick = event.server.getTickCount();
  if (currentTick % 10 !== 0) return;

  for (let i = activeMinions.length - 1; i >= 0; i--) {
    let minionData = activeMinions[i];
    let minion: $LivingEntity = minionData.entity;

    if (!minion || !minion.isAlive() || !minion.isAddedToLevel()) {
      activeMinions.splice(i, 1);
      continue;
    }

    let pd = minion.persistentData;
    let abilities = minionData.abilities;

    for (let j = 0; j < abilities.length; j++) {
      let ability = abilities[j];
      let abilityKey = `minion_lastTick_${j}`;
      let lastTick = pd.getInt(abilityKey) || 0;
      if (currentTick - lastTick >= ability.config.intervalTicks) {
        executeMinionAbility(minion, ability, event.getServer().overworld(), currentTick);
        pd.putInt(abilityKey, currentTick);
      }
    }
  }
});

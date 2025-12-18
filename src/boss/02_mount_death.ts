EntityEvents.death((event) => {
  let entity = event.entity;

  if (entity.persistentData.getBoolean("kubejs_boss_mount")) {
    let bossUUID = entity.persistentData.getString("kubejs_boss_passenger_uuid");

    entity.passengers.forEach((passenger) => {
      if (passenger.uuid.toString() === bossUUID) {
        passenger.stopRiding();

        if (passenger.isLiving()) {
          let boss = passenger as $LivingEntity;
          boss.potionEffects.add("minecraft:strength", 9999, 2, false, false);
          boss.potionEffects.add("minecraft:speed", 9999, 1, false, false);

          let server = event.server;
          server.runCommandSilent(`tellraw @a "§c§l${boss.customName?.getString()} perdeu sua montaria!."`);
        }
      }
    });
  }
});

EntityEvents.spawned((event) => {
  let minion = event.entity;
  if (!minion.persistentData.getBoolean("kubejs_personalized_minion") && !pd.getBoolean("kubejs_boss_mount")) return;
  if (!(minion instanceof Java.loadClass("net.minecraft.world.entity.PathfinderMob"))) return;

  let pathfinderMinion = minion as $PathfinderMob;
  pathfinderMinion.targetSelector.addGoal(1, new NearestAttackableTargetGoal(pathfinderMinion, Player, true));

  if (pd.getBoolean("kubejs_boss_mount") && !bossType) {
    let passenger = entity.passengers[0];
    if (passenger) {
      bossType = passenger.persistentData.getString("boss_type");
    }
  }

  let minionType = minion.persistentData.getString("minion_type");

  switch (minionType) {
    case "mage":
    case "summoner":
    case "necromancer_minion":
      pathfinderMinion.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMinion, Player, 10.0, 1.3, 1.6));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 12.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.9));
      break;
    case "battle_mage_minion":
      pathfinderMinion.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMinion, Player, 6.0, 1.2, 1.4));
      pathfinderMinion.goalSelector.addGoal(2, new MeleeAttackGoal(pathfinderMinion, 1.3, false));
      pathfinderMinion.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMinion, Player, 10.0));
      break;

    case "warrior":
    case "knight":
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 1.4, false));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 8.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 1.0));
      break;

    case "berserker_minion":
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 1.8, false)); // Muito agressivo
      pathfinderMinion.goalSelector.addGoal(2, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 1.3));
      break;

    case "tank":
    case "guardian":
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 0.9, true));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 8.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.6));
      break;
    case "archer":
    case "ranger":
      pathfinderMinion.goalSelector.addGoal(1, new RangedBowAttackGoal(pathfinderMinion, 1.1, 18, 15.0));
      pathfinderMinion.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMinion, Player, 5.0, 1.2, 1.0));
      pathfinderMinion.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMinion, Player, 12.0));
      pathfinderMinion.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.8));
      break;

    case "sniper":
      pathfinderMinion.goalSelector.addGoal(1, new RangedBowAttackGoal(pathfinderMinion, 1.0, 22, 18.0));
      pathfinderMinion.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMinion, Player, 7.0, 1.3, 1.1));
      pathfinderMinion.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMinion, Player, 15.0));
      break;

    case "support":
    case "healer":
    case "cleric":
      pathfinderMinion.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMinion, Player, 12.0, 1.2, 1.4));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 10.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.9));
      break;

    case "assassin":
    case "rogue":
      pathfinderMinion.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMinion, Player, 3.0, 1.8, 1.0));
      pathfinderMinion.goalSelector.addGoal(2, new MeleeAttackGoal(pathfinderMinion, 1.7, false));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 1.3));
      break;

    case "bomber":
    case "exploder":
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 1.5, false));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 8.0));
      break;

    case "shielder":
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 1.0, true));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 8.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.7));
      break;

    default:
      pathfinderMinion.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMinion, 1.2, false));
      pathfinderMinion.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMinion, Player, 8.0));
      pathfinderMinion.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMinion, 0.8));
      console.warn(`[MINION AI] Tipo desconhecido: ${minionType}, usando IA padrão`);
      break;
  }
});

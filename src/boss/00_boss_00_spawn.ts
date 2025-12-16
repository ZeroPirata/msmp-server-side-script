EntityEvents.spawned((event) => {
  let entity = event.entity;
  let pd = entity.persistentData;

  if (!pd.getBoolean("kubejs_personalized_boss")) return;
  if (!(entity instanceof Java.loadClass("net.minecraft.world.entity.PathfinderMob"))) return;

  let pathfinderMob = entity as $PathfinderMob;
  let bossType = pd.getString("boss_type");

  // Prioridade 1: Alvo (Sempre ataca o Jogador mais próximo)
  pathfinderMob.targetSelector.addGoal(1, new NearestAttackableTargetGoal(pathfinderMob, Player, true));

  switch (bossType) {
    case "mage_summoner":
      // Nivel de prioridade 1: Reposicionamento Tático (Mantém distância - Kiting Rápido)
      // Entidade que está fugindo (o Boss)
      // Classe de alvo a ser evitada (o Jogador)
      // [avoidDistance] Raio de Ativação da Fuga: O Boss só foge se o jogador estiver a 9 blocos ou menos.
      // [fleeSpeed] Multiplicador de Velocidade ao Fugir: Velocidade moderada de fuga (1.4x o atributo base do Boss).
      // [normalSpeed] Multiplicador de Velocidade Padrão: Velocidade para se mover fora do raio de fuga, visando reposicionamento rápido (1.8x).
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 12.0, 1.5, 1.8)); // Foge agressivamente
      // Prioridade 2: Foco Visual (Crucial para o /cast)
      // Entidade que está olhando
      // Classe de alvo a ser olhada (o Jogador)]
      // Distância máxima em que o Boss irá se virar para olhar.
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 15.0));
      // Prioridade 3: Movimento (Se não estiver fugindo, anda aleatoriamente)
      // Entidade que está caminhando
      // Multiplicador de Velocidade: A velocidade base para caminhar aleatoriamente (lento e casual).
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.9));
      break;

    case "battle_mage":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 7.0, 1.3, 1.5));
      pathfinderMob.goalSelector.addGoal(2, new MeleeAttackGoal(pathfinderMob, 1.2, false));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 12.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.0));
      break;

    case "necromancer":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 15.0, 1.4, 1.6));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 20.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.6));
      break;

    case "blood_mage":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 8.0, 1.4, 1.7));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 12.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.1));
      break;

    case "crystal_guardian":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 1.0, false));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 10.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.7));
      break;

    case "tank_brawler":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 0.9, true));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 8.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.5));
      break;

    case "berserker":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 2.0, false));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 10.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.5));
      break;

    case "fallen_hero":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 1.6, false));
      pathfinderMob.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMob, Player, 4.0, 1.5, 1.2));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 12.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.2));
      break;

    case "armored_juggernaut":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 0.7, true));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 6.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.4));
      break;

    case "assassin":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 4.0, 2.2, 1.0));
      pathfinderMob.goalSelector.addGoal(2, new MeleeAttackGoal(pathfinderMob, 2.0, false));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 8.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.4));
      break;

    case "archer_sniper":
      pathfinderMob.goalSelector.addGoal(1, new RangedBowAttackGoal(pathfinderMob, 1.2, 15, 20.0));
      pathfinderMob.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMob, Player, 8.0, 1.4, 1.2));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 25.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.8));
      break;

    case "archer_assassin":
      pathfinderMob.goalSelector.addGoal(1, new RangedBowAttackGoal(pathfinderMob, 1.5, 10, 15.0));
      pathfinderMob.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMob, Player, 5.0, 1.6, 1.2));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 12.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.2));
      break;

    case "marksman":
      pathfinderMob.goalSelector.addGoal(1, new RangedBowAttackGoal(pathfinderMob, 1.3, 12, 18.0));
      pathfinderMob.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMob, Player, 6.0, 1.3, 1.1));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 15.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.9));
      break;

    case "elemental_fury":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 10.0, 1.3, 1.6));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 15.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.0));
      break;

    case "void_walker":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 1.4, false));
      pathfinderMob.goalSelector.addGoal(2, new AvoidEntityGoal(pathfinderMob, Player, 3.0, 1.8, 1.0));
      pathfinderMob.goalSelector.addGoal(3, new LookAtPlayerGoal(pathfinderMob, Player, 12.0));
      pathfinderMob.goalSelector.addGoal(4, new WaterAvoidingRandomStrollGoal(pathfinderMob, 1.1));
      break;

    case "storm_caller":
      pathfinderMob.goalSelector.addGoal(1, new AvoidEntityGoal(pathfinderMob, Player, 14.0, 1.4, 1.7));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 18.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.8));
      break;

    case "plague_bearer":
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 1.1, false));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 10.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.9));
      break;

    default:
      pathfinderMob.goalSelector.addGoal(1, new MeleeAttackGoal(pathfinderMob, 1.2, false));
      pathfinderMob.goalSelector.addGoal(2, new LookAtPlayerGoal(pathfinderMob, Player, 10.0));
      pathfinderMob.goalSelector.addGoal(3, new WaterAvoidingRandomStrollGoal(pathfinderMob, 0.8));
      break;
  }
});

let MINIONS: IMinionConfig[] = [
  {
    id: "minecraft:zombie",
    name: "§cZumbi Guerreiro",
    health: 40,
    count: 5,
    classe: "warrior",
    equipment: {
      mainHand: {
        id: "minecraft:iron_sword"
      }
    },
    attributes: {
      damage: 6,
      speed: 0.25
    }
  },
  {
    id: "minecraft:skeleton",
    name: "§eEsqueleto Arqueiro",
    health: 30,
    count: 3,
    classe: "archer",
    equipment: {
      mainHand: {
        id: "minecraft:bow"
      }
    },
    attributes: {
      speed: 0.3
    },
    abilities: [
      {
        type: "shoot_projectile",
        config: {
          projectileType: "minecraft:arrow",
          intervalTicks: 45,
          range: 25,
          targetMode: "nearest_enemy"
        }
      }
    ]
  },
  {
    id: "minecraft:creeper",
    name: "§aCreeper Bombardeiro",
    health: 10,
    count: 2,
    classe: "bomber",
    attributes: {
      speed: 0.35
    },
    potionEffects: [
      {
        id: "minecraft:speed",
        duration: 1000000,
        amplifier: 2
      }
    ]
  }
];

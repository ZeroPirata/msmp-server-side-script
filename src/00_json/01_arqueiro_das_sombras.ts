let TWO_PHASE_BOSS: IMiniBoss = {
  id: "minecraft:skeleton",
  name: "§6Arqueiro das Sombras",
  health: 800,
  lootrName: "archer_chest",
  spawnWeight: 8,
  attack: 6,
  armor: 8,
  armorToughness: 3,
  equipment: {
    // mainHand: {
    //   id: "minecraft:bow",
    //   enchantments: {
    //     possible: [
    //       { id: "minecraft:power", minLevel: 1, maxLevel: 3, chance: 0.6 },
    //       { id: "minecraft:punch", minLevel: 1, maxLevel: 1, chance: 0.3 }
    //     ]
    //   }
    // },
    // offHand: {
    //   id: "minecraft:tipped_arrow[minecraft:potion_contents='minecraft:strong_slowness']",
    //   count: 64
    // }
  },
  phases: [
    // ===== FASE 1: 100% ~ 50% =====
    {
      threshold: 1.0, // Começa em 100%
      name: "Fase Inicial",
      abilities: [
        // {
        //   type: "shoot_projectiles",
        //   config: {
        //     projectileType: "minecraft:arrow",
        //     intervalTicks: 40, // Atira a cada 2 segundos
        //     count: 1,
        //     speed: 2.0
        //   }
        // },
        {
          type: "projectile_rain",
          config: {
            projectileType: "projectvibrantjourneys:icicle",
            intervalTicks: 150, // A cada 7.5 segundos
            radius: 20,
            projectileCount: 5, // Um icicle por player próximo
            fallHeight: 30,
            targetMode: "players",
            warningTime: 30, // 1.5 segundos de aviso
            warningParticle: "minecraft:snowflake",
            damage: 12 // 6 corações
          }
        }
      ]
    },
    {
      threshold: 0.7,
      name: "Fúria do Arqueiro",
      onEnterMessage: "§c§l⚠ O Arqueiro das Sombras entrou em fúria!",
      bossBarColor: "RED",
      abilities: [
        {
          type: "buff_attributes",
          config: {
            speed: 1.3, // 30% mais rápido
            potionEffects: [{ id: "minecraft:strength", amplifier: 1 }]
          }
        },
        // {
        //   type: "shoot_projectiles",
        //   config: {
        //     projectileType: "minecraft:arrow",
        //     intervalTicks: 40,
        //     count: 1,
        //     speed: 2.0
        //   }
        // },
        {
          type: "projectile_rain",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 200, // A cada 10 segundos
            radius: 5,
            projectileCount: 30,
            fallHeight: 25,
            targetMode: "players",
            warningTime: 0, // 1 segundo de aviso
            warningParticle: "minecraft:crit"
          }
        }
      ]
    },
    {
      threshold: 0.5,
      name: "Chuva de Flechas",
      abilities: [
        {
          type: "projectile_rain",
          config: {
            projectileType: "minecraft:fireball",
            intervalTicks: 300, // A cada 15 segundos
            radius: 12,
            projectileCount: 16,
            fallHeight: 20,
            targetMode: "boss", // Centrado no boss
            spreadPattern: "circle", // Padrão circular
            warningTime: 40, // 2 segundos de aviso
            warningParticle: "minecraft:flame"
          }
        }
      ]
    }
  ]
};

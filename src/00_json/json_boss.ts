let BOSS_NAME_FOR_CONFIG = {
  BOSS_1: 0,
  BOSS_2: 1,
  BOSS_3: 2,
  BOSS_4: 3,
  BOSS_5: 4,
  BOSS_6: 5,
  BOSS_7: 6,
  BOSS_8: 7,
  BOSS_9: 8,
  BOSS_10: 9,
  BOSS_11: 10
};

let BOSS_1: IMiniBoss = {
  difficulty: "FACIL",
  id: "minecraft:zombie",
  name: "§fiez! telecom",
  lootrName: "teste_lootr",
  spawnWeight: 10,
  health: 150,
  attack: 3,
  armor: 4,
  armorToughness: 2,
  speed: 0.35,
  drops: [],
  equipment: {
    mainHand: {
      id: "minecraft:stone_sword"
    },
    head: {
      id: "chainmail_helmet[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
      enchantments: {
        "minecraft:protection": 2
      }
    },
    chest: {
      id: "chainmail_chestplate[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
      enchantments: {
        "minecraft:protection": 2
      }
    },
    legs: {
      id: "chainmail_leggings[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
      enchantments: {
        "minecraft:protection": 2
      }
    },
    feet: {
      id: " chainmail_boots[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
      enchantments: {
        "minecraft:protection": 2
      }
    },
    offHand: {
      id: "minecraft:shield"
    }
  },
  classe: "tank_brawler"
};

let BOSS_2: IMiniBoss = {
  difficulty: "FACIL",
  spawnWeight: 10,
  id: "minecraft:skeleton",
  lootrName: "teste_lootr",
  classe: "archer_sniper",
  name: "§fPrefeitura de São José dos Campos",
  health: 250,
  attack: 5,
  armor: 6,
  armorToughness: 3,
  speed: 0.25,
  drops: [],
  equipment: {
    mainHand: {
      id: "minecraft:bow",
      enchantments: {
        guaranteed: {
          "minecraft:power": 3,
          "minecraft:infinity": 1
        }
      }
    },
    offHand: {
      id: "tipped_arrow[potion_contents={potion:'minecraft:strong_slowness', custom_effects:[{id:'minecraft:instant_damage', amplifier:1}]}]",
      count: 1,
      enchantments: {
        guaranteed: {
          "minecraft:infinity": 1
        }
      },
      head: {
        id: "minecraft:leather_helmet[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:gold', pattern:'minecraft:eye'}, dyed_color={rgb:4673362}]",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 2
          }
        }
      },
      chest: {
        id: "minecraft:leather_chestplate[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:gold', pattern:'minecraft:eye'}, dyed_color={rgb:4673362}]",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 2
          }
        }
      },
      legs: {
        id: "minecraft:leather_leggings[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:gold', pattern:'minecraft:eye'}, dyed_color={rgb:4673362}]",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 2
          }
        }
      },
      feet: {
        id: "minecraft:leather_boots[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:gold', pattern:'minecraft:eye'}, dyed_color={rgb:4673362}]",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 2
          }
        }
      }
    },
    dropChance: {
      mainHand: 0.0
    }
  }
};

let BOSS_3: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:zombie",
  name: "§5Mago Porradeiro",
  health: 750,
  attack: 7.5,
  armor: 10,
  armorToughness: 5,
  speed: 0.3,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "battle_mage",
  equipment: {
    mainHand: {
      id: "minecraft:iron_axe"
    },
    head: { id: "minecraft:golden_helmet[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:amethyst', pattern:'minecraft:vex'}]" },
    chest: { id: "minecraft:golden_chestplate[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:amethyst', pattern:'minecraft:vex'}]" },
    legs: { id: "minecraft:golden_leggings[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:amethyst', pattern:'minecraft:vex'}]" },
    feet: { id: "minecraft:golden_boots[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:amethyst', pattern:'minecraft:vex'}]" }
  },
  phases: [
    {
      threshold: 1.0,
      name: "Chamado dos Servos",
      bossBarColor: "PURPLE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "summon_minions",
          onEnter: true,
          config: {
            minions: [ZOMBIES.zombieBasico, SKELETON.archerBasico],
            periodic: {
              intervalTicks: 1200
            }
          }
        }
      ]
    },
    {
      threshold: 0.6,
      onEnterMessage: "§5Mago Porradeiro: 'Se você se cura, por que eu não posso?!'",
      name: "Vem X1 Lixo",
      bossBarColor: "RED",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [ZOMBIES.zombieNormal, SKELETON.archerNormal],
            onEnter: true,
            periodic: {
              intervalTicks: 1600
            }
          }
        },
        {
          type: "heal",
          config: {
            amount: 5,
            onEnter: true,
            percentage: 25,
            periodic: {
              intervalTicks: 200,
              amount: 50
            }
          }
        },
        {
          type: "cast_spell",
          config: {
            id: "burning_dash",
            intervalTicks: 400,
            targetMode: "nearest_player",
            castCount: 10,
            soundEffectPath: "amendments:explosion.fireball"
          }
        }
      ]
    }
  ]
};

let BOSS_4: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:skeleton",
  name: "§eAtirador Esquelético",
  health: 750,
  attack: 8,
  armor: 0,
  armorToughness: 0,
  speed: 0.3,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "archer_sniper",
  equipment: {
    head: { id: "minecraft:chainmail_helmet[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
    chest: { id: "minecraft:chainmail_chestplate[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
    legs: { id: "minecraft:chainmail_leggings[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
    feet: { id: "minecraft:chainmail_boots[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" }
  },
  phases: [
    {
      threshold: 1.0,
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 30,
            count: 1,
            speed: 2.5
          }
        }
      ]
    },
    {
      threshold: 0.6,
      name: "Fase de Precisão",
      onEnterMessage: "§eAtirador Esquelético: 'Você acha que pode me alcançar?'",
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 25,
            count: 1,
            speed: 3
          }
        }
      ]
    }
  ]
};

let BOSS_5: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:zombie",
  name: "§2Zumbi Tanque",
  health: 1000,
  attack: 8,
  armor: 12,
  armorToughness: 7,
  speed: 0.2,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "tank_brawler",
  mount: {
    id: "minecraft:skeleton_horse",
    name: "§7Cavalo Sombrio",
    health: 500,
    statusBase: {
      attack: 4,
      armor: 10,
      armorToughness: 3,
      speed: 0.4
    }
  },
  phases: [
    {
      threshold: 1.0,
      abilities: [
        {
          type: "buff_attributes",
          config: {
            armor: 5,
            knockbackResistance: 1.0,
            potionEffects: [
              {
                id: "minecraft:resistance",
                amplifier: 1
              }
            ]
          }
        }
      ]
    },
    {
      threshold: 0.75,
      onEnterMessage: "§2Zumbi Tanque: 'Você vai ter que fazer melhor que isso!'",
      abilities: [
        {
          type: "buff_attributes",
          config: {
            armor: 2,
            speed: 0.1,
            knockbackResistance: 1.5,
            potionEffects: [
              {
                id: "minecraft:resistance",
                amplifier: 2
              },
              {
                id: "minecraft:strength",
                amplifier: 1
              },
              {
                id: "minecraft:regeneration",
                amplifier: 1
              }
            ]
          }
        }
      ]
    },
    {
      threshold: 0.4,
      onEnterMessage: "§2Zumbi Tanque: 'Agora eu fico sério!'",
      abilities: [
        {
          type: "buff_attributes",
          config: {
            armor: 2,
            speed: 0.1,
            knockbackResistance: 1.5,
            potionEffects: [
              {
                id: "minecraft:resistance",
                amplifier: 3
              },
              {
                id: "minecraft:strength",
                amplifier: 2
              },
              {
                id: "minecraft:regeneration",
                amplifier: 1
              }
            ]
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 4.5,
            damage: 0.5,
            intervalTicks: 100,
            particleEffect: "supplementaries:green_flame",
            knockback: 0.5
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 120,
            radius: 8,
            toLowHealthPlayer: true
          }
        }
      ]
    }
  ]
};

let BOSS_6: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:skeleton",
  name: "§dEsqueleto Evasivo",
  health: 1250,
  attack: 10,
  armor: 8,
  armorToughness: 10,
  speed: 0.35,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "assassin",
  mount: {
    id: "minecraft:skeleton_horse",
    name: "§7Cavalo Sombrio",
    health: 500,
    statusBase: {
      attack: 4,
      armor: 10,
      speed: 0.4
    }
  },
  equipment: {
    mainHand: {
      id: "born_in_chaos_v1:intoxicating_dagger",
      enchantments: {
        possible: [
          { id: "minecraft:sharpness", minLevel: 4, maxLevel: 5, chance: 1.0 },
          { id: "minecraft:fire_aspect", minLevel: 1, maxLevel: 2, chance: 0.6 },
          { id: "minecraft:knockback", minLevel: 1, maxLevel: 2, chance: 0.4 }
        ]
      },
      head: { id: "minecraft:iron_helmet[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      chest: { id: "minecraft:iron_chestplate[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      legs: { id: "minecraft:iron_leggings[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      feet: { id: "minecraft:iron_boots[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" }
    }
  },
  phases: [
    {
      threshold: 1.0,
      abilities: [
        {
          type: "teleport",
          config: {
            intervalTicks: 120,
            radius: 10,
            toLowHealthPlayer: false
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:fireball",
            intervalTicks: 30,
            count: 3,
            speed: 4,
            spread: 3
          }
        }
      ]
    },
    {
      threshold: 0.6,
      onEnterMessage: "§dEsqueleto Evasivo: 'Você não pode me pegar!'",
      abilities: [
        {
          type: "teleport",
          config: {
            intervalTicks: 120,
            radius: 10,
            toLowHealthPlayer: true
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 3,
            damage: 1.25,
            intervalTicks: 120,
            particleEffect: "minecraft:large_smoke",
            knockback: 2.5
          }
        },
        {
          type: "projectile_rain",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 200,
            radius: 8,
            projectileCount: 10,
            fallHeight: 5,
            targetMode: "player",
            damage: 2.4,
            spreadPattern: "grid"
          }
        }
      ]
    },
    {
      threshold: 0.3,
      onEnterMessage: "§dEsqueleto Evasivo: 'Agora você vai ver do que eu sou capaz!'",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [SKELETON.archerMedio, ZOMBIES.zombieMedio],
            onEnter: true
          }
        },
        {
          type: "enrage",
          config: {
            damageMultiplier: 2.0,
            speedMultiplier: 1.25,
            particleEffect: true
          }
        },
        {
          type: "heal",
          config: {
            percentage: 30,
            onEnter: true
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:fireball",
            intervalTicks: 50,
            count: 1,
            speed: 2.5
          }
        }
      ]
    }
  ]
};

let BOSS_7: IMiniBoss = {
  difficulty: "FACIL",
  id: "minecraft:zombie",
  name: "§cZumbi Furioso",
  health: 80,
  attack: 12,
  armor: 2,
  armorToughness: 0,
  speed: 0.3,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "berserker",
  phases: [
    {
      threshold: 1.0,
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 2.0,
            speedMultiplier: 1.5
          }
        }
      ]
    }
  ]
};

let BOSS_8: IMiniBoss = {
  difficulty: "NORMAL",
  id: "minecraft:zombie",
  name: "§8Necromante Zumbi",
  health: 600,
  attack: 6,
  armor: 4,
  armorToughness: 2,
  speed: 0.2,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "necromancer",
  phases: [
    {
      threshold: 1.0,
      name: "Fase de Invocação",
      onEnterMessage: "§8Necromante: 'Meus servos, venham a mim!'",
      bossBarColor: "PURPLE",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [ZOMBIES.zombieBasico, SKELETON.archerBasico],
            periodic: {
              intervalTicks: 300
            }
          }
        }
      ]
    },
    {
      threshold: 0.5,
      name: "Fase de Desespero",
      onEnterMessage: "§8Necromante: 'Vocês me forçaram a usar meu poder total!'",
      bossBarColor: "RED",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [ZOMBIES.zombieNormal, SKELETON.archerNormal, ZOMBIES.zombieBasico, SKELETON.archerBasico],
            onEnter: true
          }
        },
        {
          type: "heal",
          config: {
            percentage: 0.3,
            onEnter: true
          }
        },
        {
          type: "enrage",
          config: {
            damageMultiplier: 1.8,
            speedMultiplier: 1.3
          }
        }
      ]
    }
  ]
};

let BOSS_9: IMiniBoss = {
  difficulty: "RAID",
  id: "minecraft:skeleton",
  name: "§bGuardião de Cristal",
  health: 2000,
  attack: 12,
  armor: 10,
  armorToughness: 4,
  speed: 0.35,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "archer_sniper",
  equipment: {
    mainHand: {
      id: "minecraft:bow",
      enchantments: {
        possible: [
          { id: "minecraft:power", minLevel: 1, maxLevel: 3, chance: 0.6 },
          { id: "minecraft:punch", minLevel: 1, maxLevel: 1, chance: 0.3 }
        ],
        guaranteed: {
          "minecraft:infinity": 1
        }
      }
    },
    offHand: {
      id: "minecraft:tipped_arrow[minecraft:potion_contents='minecraft:strong_slowness']",
      count: 1
    },
    head: { id: "minecraft:diamond_helmet[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
    chest: { id: "minecraft:diamond_chestplate[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
    legs: { id: "minecraft:diamond_leggings[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
    feet: { id: "minecraft:diamond_boots[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" }
  },
  phases: [
    {
      threshold: 1.0,
      name: "Fase de Proteção",
      bossBarColor: "BLUE",
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 40,
            count: 3,
            spread: 0.2,
            speed: 2.0
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [SKELETON.archerMedio, ZOMBIES.zombieMedio],
            onEnter: true
          }
        }
      ]
    },
    {
      threshold: 0.3,
      name: "Fase dos Cristais",
      onEnterMessage: "§bGuardião: 'Cristais, concedam-me seu poder!'",
      bossBarColor: "RED",
      abilities: [
        {
          type: "crystal_phase",
          config: {
            onEnter: true,
            crystalBlockType: "minecraft:end_crystal",
            crystalCount: 5,
            distanceFromBoss: 20,
            minionSpawnPerCrystal: [ZOMBIES.zombieDificil, ZOMBIES.zombieMedio, SKELETON.archerDificil],
            ritualHeight: 4,
            maxRitualTime: 1200,
            damageBuffPerSecond: 0.1,
            maxDamageBuff: 5,
            respawnTime: 0,
            particleEffect: "minecraft:enchant",
            protectionRadius: 3
          }
        },
        {
          type: "buff_attributes",
          config: {
            damage: 5,
            armor: 15,
            potionEffects: [
              {
                id: "minecraft:resistance",
                amplifier: 3
              },
              {
                id: "minecraft:strength",
                amplifier: 2
              },
              {
                id: "minecraft:regeneration",
                amplifier: 1
              }
            ]
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 3,
            damage: 1.25,
            intervalTicks: 120,
            particleEffect: "minecraft:large_smoke",
            knockback: 2.5
          }
        },
        {
          type: "cast_spell",
          config: {
            spellId: "irons_spellbooks:blood_slash",
            intervalTicks: 300,
            targetMode: "nearest_player",
            range: 10,
            requiresLineOfSight: true,
            soundEffectPath: "irons_spellbooks:blood_slash.cast",
            castCount: 4
          }
        }
      ]
    }
  ]
};

let BOSS_10: IMiniBoss = {
  difficulty: "DIFICIL",
  id: "minecraft:zombie",
  name: "§9Zumbi Tempestuoso",
  health: 2500,
  attack: 7,
  armor: 5,
  armorToughness: 3,
  speed: 0.22,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "storm_caller",
  equipment: {
    mainHand: {
      id: "minecraft:diamond_sword",
      enchantments: {
        guaranteed: { "minecraft:sharpness": 4, "minecraft:unbreaking": 3, "minecraft:looting": 2 }
      }
    },
    offHand: {
      id: "minecraft:shield"
    },
    head: {
      id: "minecraft:diamond_helmet[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:amethyst', pattern:'minecraft:eye'}]",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 3,
          "minecraft:unbreaking": 2
        }
      }
    },
    chest: {
      id: "minecraft:diamond_chestplate[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:amethyst', pattern:'minecraft:eye'}]",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 3,
          "minecraft:unbreaking": 2
        }
      }
    },
    legs: {
      id: "minecraft:diamond_leggings[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:amethyst', pattern:'minecraft:eye'}]",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 3,
          "minecraft:unbreaking": 2
        }
      }
    },
    feet: {
      id: "minecraft:diamond_boots[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:amethyst', pattern:'minecraft:eye'}]",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 3,
          "minecraft:unbreaking": 2
        }
      }
    }
  },
  phases: [
    {
      threshold: 1.0,
      name: "Fase da Chuva",
      bossBarColor: "GREEN",
      abilities: [
        {
          type: "weather_change",
          config: {
            weather: "rain",
            onEnter: true
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:snowball",
            intervalTicks: 50,
            count: 1,
            speed: 2.0
          }
        }
      ]
    },
    {
      threshold: 0.4,
      name: "Fase da Tempestade",
      onEnterMessage: "§9Zumbi Tempestuoso: 'A tempestade se intensifica!'",
      bossBarColor: "YELLOW",
      abilities: [
        {
          type: "weather_change",
          config: {
            weather: "thunder",
            onEnter: true
          }
        },
        {
          type: "projectile_rain",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 80,
            radius: 6,
            projectileCount: 20,
            fallHeight: 20,
            targetMode: "players",
            damage: 4,
            spreadPattern: "random",
            warningTime: 20,
            warningParticle: "minecraft:cloud"
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 6,
            damage: 8,
            intervalTicks: 120,
            particleEffect: "minecraft:electric_spark",
            knockback: 1.5
          }
        },
        {
          type: "cast_spell",
          config: {
            spellId: "electrocute",
            intervalTicks: 200,
            targetMode: "nearest_player",
            range: 15,
            castCount: 100
          }
        },
        {
          type: "enrage",
          config: {
            damageMultiplier: 1.5,
            speedMultiplier: 1.2,
            particleEffect: true
          }
        }
      ]
    }
  ]
};

let BOSS_11: IMiniBoss = {
  id: "minecraft:skeleton",
  name: "§6Falso Lorde Esquelético",
  health: 200,
  attack: 10,
  armor: 6,
  armorToughness: 3,
  speed: 0.28,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "fallen_hero",
  equipment: {
    mainHand: {
      id: "minecraft:iron_sword",
      enchantments: {
        "minecraft:sharpness": 2
      }
    },
    head: {
      id: "minecraft:iron_helmet"
    },
    dropChance: {
      mainHand: 0.1,
      head: 0.05
    }
  },
  phases: [
    {
      threshold: 1.0,
      name: "Fase de Combate",
      onEnterMessage: "§6Lorde Esquelético: 'Enfrente meu poder!'",
      bossBarColor: "WHITE",
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 25,
            count: 1,
            speed: 2.8
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:skeleton",
                count: 2,
                health: 40,
                classe: "archer",
                equipment: {
                  mainHand: {
                    id: "minecraft:bow"
                  }
                }
              }
            ],
            periodic: {
              intervalTicks: 400
            }
          }
        }
      ]
    },
    {
      threshold: 0.65,
      name: "Fase de Fúria",
      onEnterMessage: "§6Lorde Esquelético: 'Minha fúria é infinita!'",
      bossBarColor: "GREEN",
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 1.8,
            speedMultiplier: 1.4,
            particleEffect: true
          }
        },
        {
          type: "buff_attributes",
          config: {
            damage: 1.5,
            speed: 1.3,
            potionEffects: [
              {
                id: "minecraft:strength",
                amplifier: 1
              }
            ]
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 150,
            radius: 15,
            toLowHealthPlayer: true
          }
        }
      ]
    },
    {
      threshold: 0.3,
      name: "Fase Final",
      onEnterMessage: "§6Lorde Esquelético: 'TUDO OU NADA!'",
      bossBarColor: "RED",
      abilities: [
        {
          type: "heal",
          config: {
            percentage: 0.2,
            onEnter: true
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:zombie",
                count: 4,
                health: 60,
                classe: "berserker_minion",
                attributes: {
                  damage: 8,
                  speed: 0.3
                }
              }
            ],
            onEnter: true
          }
        },
        {
          type: "projectile_rain",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 60,
            radius: 15,
            projectileCount: 30,
            fallHeight: 25,
            targetMode: "players",
            spreadPattern: "circle",
            warningTime: 30
          }
        },
        {
          type: "cast_spell",
          config: {
            spellId: "magic_arrow",
            intervalTicks: 40,
            targetMode: "nearest_player",
            range: 30,
            castCount: 3
          }
        }
      ]
    }
  ]
};

let MINIBOSSES: IMiniBoss[] = [BOSS_1, BOSS_2, BOSS_3, BOSS_4, BOSS_5, BOSS_6, BOSS_7, BOSS_8, BOSS_9, BOSS_10, BOSS_11];

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
  name: "§fZumbi de Teste",
  lootrName: "teste_lootr",
  spawnWeight: 10,
  health: 20,
  attack: 3,
  armor: 0,
  armorToughness: 0,
  speed: 0.23,
  drops: [],
  equipment: {
    mainHand: {
      id: "minecraft:stone_sword"
    },
    dropChance: {
      mainHand: 0.0
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
  name: "§fEsqueleto de Teste",
  health: 20,
  attack: 2,
  armor: 0,
  armorToughness: 0,
  speed: 0.25,
  drops: [],
  equipment: {
    mainHand: {
      id: "minecraft:bow"
    },
    dropChance: {
      mainHand: 0.0
    }
  }
};

let BOSS_3: IMiniBoss = {
  difficulty: "FACIL",
  id: "minecraft:zombie",
  name: "§5Zumbi Invocador",
  health: 100,
  attack: 5,
  armor: 5,
  armorToughness: 2,
  speed: 0.2,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "mage_summoner",
  phases: [
    {
      threshold: 1.0,
      name: "Chamado dos Servos",
      bossBarColor: "PURPLE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:zombie",
                name: "Servo do Invocador",
                count: 3,
                health: 30,
                classe: "warrior"
              }
            ],
            periodic: {
              intervalTicks: 200
            }
          }
        }
      ]
    }
  ]
};

let BOSS_4: IMiniBoss = {
  difficulty: "FACIL",
  id: "minecraft:skeleton",
  name: "§eAtirador Esquelético",
  health: 80,
  attack: 8,
  armor: 0,
  armorToughness: 0,
  speed: 0.3,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "archer_sniper",
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
    }
  ]
};

let BOSS_5: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:zombie",
  name: "§2Zumbi Tanque",
  health: 150,
  attack: 8,
  armor: 10,
  armorToughness: 5,
  speed: 0.15,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "tank_brawler",
  mount: {
      id: "minecraft:skeleton_horse",
      name: "§7Cavalo Sombrio",
      health: 500
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
    }
  ]
};

let BOSS_6: IMiniBoss = {
  difficulty: "MEDIO",
  id: "minecraft:skeleton",
  name: "§dEsqueleto Evasivo",
  health: 60,
  attack: 10,
  armor: 0,
  armorToughness: 0,
  speed: 0.35,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "assassin",
  mount: {
      id: "minecraft:skeleton_horse",
      name: "§7Cavalo Sombrio",
      health: 500
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
    }
  }
  phases: [
    {
      threshold: 1.0,
      abilities: [
        {
          type: "teleport",
          config: {
            intervalTicks: 100,
            radius: 10
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
  difficulty: "FACIL",
  id: "minecraft:zombie",
  name: "§8Necromante Zumbi",
  health: 120,
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
            minions: [
              {
                id: "minecraft:skeleton",
                count: 2,
                health: 40,
                classe: "archer"
              }
            ],
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
            minions: [
              {
                id: "minecraft:zombie",
                count: 4,
                health: 50,
                classe: "berserker_minion"
              }
            ],
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
  difficulty: "FACIL",
  id: "minecraft:skeleton",
  name: "§bGuardião de Cristal",
  health: 200,
  attack: 7,
  armor: 10,
  armorToughness: 4,
  speed: 0.25,
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
        ]
      }
    },
    offHand: {
      id: "minecraft:tipped_arrow[minecraft:potion_contents='minecraft:strong_slowness']",
      count: 64
    }
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
        }
      ]
    },
    {
      threshold: 0.6,
      name: "Fase dos Cristais",
      onEnterMessage: "§bGuardião: 'Cristais, concedam-me seu poder!'",
      bossBarColor: "RED",
      abilities: [
        {
          type: "crystal_phase",
          config: {
            onEnter: true,
            crystalBlockType: "minecraft:end_crystal",
            crystalCount: 2,
            distanceFromBoss: 20,
            minionSpawnPerCrystal: MINIONS,
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
              }
            ]
          }
        }
      ]
    }
  ]
};

let BOSS_10: IMiniBoss = {
  difficulty: "FACIL",
  id: "minecraft:zombie",
  name: "§9Zumbi Tempestuoso",
  health: 130,
  attack: 7,
  armor: 3,
  armorToughness: 1,
  speed: 0.22,
  lootrName: "teste_lootr",
  spawnWeight: 1,
  classe: "storm_caller",
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
            radius: 12,
            projectileCount: 20,
            fallHeight: 30,
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
        }
      ]
    }
  ]
};

let BOSS_11: IMiniBoss = {
  id: "minecraft:skeleton",
  name: "§6Lorde Esquelético",
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

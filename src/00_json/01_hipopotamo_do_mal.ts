let HIPOPOTAMO_DO_MAL: IMiniBoss = {
  id: "irons_spellbooks:necromancer",
  name: "§5☠ Hipopótamo do Mal ☠",
  health: 2000,
  attack: 6,
  armor: 15,
  armorToughness: 10,
  speed: 0.35,
  lootrName: "hipopotamo_chest",
  spawnWeight: 3,

  equipment: {
    mainHand: {
      id: "minecraft:netherite_sword",
      enchantments: {
        guaranteed: {
          "minecraft:sharpness": 5,
          "minecraft:looting": 3,
          "minecraft:fire_aspect": 2
        }
      },
      nbt: {
        display: {
          Name: '{"text":"Ceifador de Almas","color":"dark_purple","bold":true}',
          Lore: ['{"text":"Forjado nas profundezas do abismo","color":"gray","italic":false}', '{"text":"Drena a vida dos vivos","color":"dark_red","italic":false}']
        }
      }
    },
    offHand: {
      id: "minecraft:totem_of_undying"
    },
    head: {
      id: "minecraft:netherite_helmet",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 4,
          "minecraft:unbreaking": 3,
          "minecraft:thorns": 3
        }
      }
    },
    chest: {
      id: "minecraft:netherite_chestplate",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 4,
          "minecraft:unbreaking": 3
        }
      }
    },
    legs: {
      id: "minecraft:netherite_leggings",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 4,
          "minecraft:unbreaking": 3
        }
      }
    },
    feet: {
      id: "minecraft:netherite_boots",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 4,
          "minecraft:unbreaking": 3,
          "minecraft:feather_falling": 4
        }
      }
    },
    dropChance: {
      mainHand: 0.15,
      offHand: 1.0, // Totem sempre dropa
      head: 0.05,
      chest: 0.05,
      legs: 0.05,
      feet: 0.05
    }
  },

  phases: [
    // FASE 1: 100% ~ 80% - Preparação
    {
      threshold: 1.0,
      name: "Despertar Sombrio",
      bossBarColor: "PURPLE",
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:wither_skull",
            intervalTicks: 60,
            count: 1,
            speed: 1.5
          }
        }
      ]
    },

    // FASE 2: 80% ~ 60% - Primeira Invocação
    {
      threshold: 0.8,
      name: "Ritual de Invocação",
      onEnterMessage: "§5§l☠ Hipopótamo do Mal invoca os mortos!",
      bossBarColor: "BLUE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:zombie",
                name: "§2Morto-Vivo Corrompido",
                count: 3,
                health: 60,
                equipment: {
                  mainHand: {
                    id: "minecraft:iron_sword",
                    enchantments: {
                      guaranteed: {
                        "minecraft:sharpness": 2
                      }
                    }
                  },
                  head: {
                    id: "minecraft:iron_helmet"
                  }
                },
                attributes: {
                  damage: 6,
                  armor: 8
                },
                potionEffects: [{ id: "minecraft:strength", duration: 999999, amplifier: 0 }]
              },
              {
                id: "minecraft:skeleton",
                name: "§7Arqueiro Espectral",
                count: 2,
                health: 40,
                equipment: {
                  mainHand: {
                    id: "minecraft:bow",
                    enchantments: {
                      guaranteed: {
                        "minecraft:power": 3
                      }
                    }
                  }
                }
              }
            ],
            onEnter: true,
            periodic: {
              intervalTicks: 400
            }
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:wither_skull",
            intervalTicks: 40,
            count: 2,
            spread: 0.2,
            speed: 2.0
          }
        }
      ]
    },

    // FASE 3: 60% ~ 40% - Regeneração das Sombras
    {
      threshold: 0.6,
      name: "Regeneração das Sombras",
      onEnterMessage: "§a§l+ As sombras restauram o Hipopótamo!",
      bossBarColor: "GREEN",
      bossBarOverlay: "NOTCHED_12",
      abilities: [
        {
          type: "heal",
          config: {
            percentage: 0.25,
            onEnter: true,
            periodic: {
              intervalTicks: 180,
              amount: 40
            }
          }
        },
        {
          type: "buff_attributes",
          config: {
            damage: 1.4,
            armor: 12,
            knockbackResistance: 0.6,
            potionEffects: [
              { id: "minecraft:resistance", amplifier: 1 },
              { id: "minecraft:regeneration", amplifier: 1 }
            ]
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 180,
            radius: 15,
            toLowHealthPlayer: true
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "cataclysm:the_prowler",
                name: "§4Espreitador das Sombras",
                count: 1,
                health: 120,
                attributes: {
                  damage: 10,
                  speed: 0.35,
                  armor: 10
                },
                potionEffects: [
                  { id: "minecraft:strength", duration: 999999, amplifier: 1 },
                  { id: "minecraft:speed", duration: 999999, amplifier: 1 }
                ]
              }
            ],
            periodic: {
              intervalTicks: 600
            }
          }
        }
      ]
    },

    // FASE 4: 40% ~ 20% - Tempestade Profana
    {
      threshold: 0.4,
      name: "Tempestade Profana",
      onEnterMessage: "§5§l⚡ TEMPESTADE PROFANA INVOCADA!",
      bossBarColor: "PURPLE",
      bossBarOverlay: "NOTCHED_12",
      abilities: [
        {
          type: "weather_change",
          config: {
            weather: "thunder",
            onEnter: true
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 10,
            damage: 15,
            intervalTicks: 100,
            particleEffect: "minecraft:soul_fire_flame",
            knockback: 2.0
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:wither_skull",
            intervalTicks: 25,
            count: 4,
            spread: 0.4,
            speed: 2.5
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:wither_skeleton",
                name: "§8Guerreiro do Abismo",
                count: 4,
                health: 70,
                equipment: {
                  mainHand: {
                    id: "minecraft:netherite_sword",
                    enchantments: {
                      guaranteed: {
                        "minecraft:sharpness": 3,
                        "minecraft:fire_aspect": 1
                      }
                    }
                  },
                  head: {
                    id: "minecraft:netherite_helmet"
                  }
                },
                attributes: {
                  damage: 8
                },
                potionEffects: [{ id: "minecraft:strength", duration: 999999, amplifier: 1 }]
              }
            ],
            periodic: {
              intervalTicks: 350
            }
          }
        }
      ]
    },

    // FASE 5: 20% ~ 0% - APOCALIPSE FINAL
    {
      threshold: 0.2,
      name: "Apocalipse Necromántico",
      onEnterMessage: "§4§l☠☠☠ APOCALIPSE FINAL! ☠☠☠",
      bossBarColor: "RED",
      bossBarOverlay: "NOTCHED_20",
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 2.5,
            speedMultiplier: 1.7,
            particleEffect: true
          }
        },
        {
          type: "buff_attributes",
          config: {
            armor: 20,
            knockbackResistance: 0.9,
            potionEffects: [
              { id: "minecraft:strength", amplifier: 4 },
              { id: "minecraft:resistance", amplifier: 3 },
              { id: "minecraft:speed", amplifier: 2 },
              { id: "minecraft:regeneration", amplifier: 2 }
            ]
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 15,
            damage: 20,
            intervalTicks: 60,
            particleEffect: "minecraft:soul_fire_flame",
            knockback: 3.5
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:wither_skull",
            intervalTicks: 10,
            count: 6,
            spread: 0.6,
            speed: 3.0
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 100,
            radius: 20,
            toLowHealthPlayer: true
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "cataclysm:the_prowler",
                name: "§4Espreitador Elite",
                count: 2,
                health: 150,
                attributes: {
                  damage: 12,
                  speed: 0.4,
                  armor: 15
                },
                potionEffects: [
                  { id: "minecraft:strength", duration: 999999, amplifier: 2 },
                  { id: "minecraft:speed", duration: 999999, amplifier: 1 },
                  { id: "minecraft:resistance", duration: 999999, amplifier: 1 }
                ]
              },
              {
                id: "minecraft:zombie_villager",
                name: "§2Zumbi Mutante",
                count: 3,
                health: 80,
                equipment: {
                  mainHand: {
                    id: "minecraft:diamond_sword",
                    enchantments: {
                      guaranteed: {
                        "minecraft:sharpness": 4
                      }
                    }
                  },
                  head: {
                    id: "minecraft:diamond_helmet",
                    enchantments: {
                      guaranteed: {
                        "minecraft:protection": 3
                      }
                    }
                  },
                  chest: {
                    id: "minecraft:diamond_chestplate",
                    enchantments: {
                      guaranteed: {
                        "minecraft:protection": 3
                      }
                    }
                  }
                },
                attributes: {
                  damage: 9,
                  armor: 12
                },
                potionEffects: [{ id: "minecraft:strength", duration: 999999, amplifier: 2 }]
              }
            ],
            periodic: {
              intervalTicks: 200
            }
          }
        },
        {
          type: "heal",
          config: {
            periodic: {
              intervalTicks: 150,
              amount: 60
            }
          }
        }
      ]
    }
  ]
};

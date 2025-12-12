// ===== NUNU - Boss de Gelo =====
let NUNU: IMiniBoss = {
  id: "twilightforest:yeti",
  name: "§b❄ Willump, full ap...❄",
  health: 1800,
  armor: 15,
  armorToughness: 6,
  speed: 0.4,
  lootrName: "nunu_chest",
  spawnWeight: 5,

  equipment: {
    mainHand: {
      id: "minecraft:diamond_axe",
      enchantments: {
        guaranteed: {
          "minecraft:sharpness": 5,
          "minecraft:knockback": 2
        }
      },
      nbt: {
        display: {
          Name: '{"text":"Machado Congelante","color":"aqua","bold":true}',
          Lore: ['{"text":"Congelado pelas montanhas eternas","color":"gray"}']
        }
      }
    },
    head: {
      id: "minecraft:diamond_helmet",
      enchantments: {
        guaranteed: {
          "minecraft:protection": 4,
          "minecraft:thorns": 2
        }
      }
    },
    dropChance: {
      mainHand: 0.12,
      head: 0.08
    }
  },

  phases: [
    // FASE 1: 100% ~ 75% - Normal
    {
      threshold: 1.0,
      name: "Gigante Adormecido",
      onEnterMessage: "§b§l❄ Willump[R]: AHHHHHHHHHHHHHHHHHHHH!",
      bossBarColor: "BLUE",
      abilities: []
    },

    // FASE 2: 75% ~ 50% - Tempestade de Gelo
    {
      threshold: 0.75,
      name: "Tempestade de Gelo",
      onEnterMessage: "§b§l❄ Nunu invoca uma nevasca!",
      bossBarColor: "PURPLE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "weather_change",
          config: {
            weather: "thunder",
            onEnter: true
          }
        },
        {
          type: "buff_attributes",
          config: {
            damage: 1.3,
            armor: 8,
            potionEffects: [
              { id: "minecraft:strength", amplifier: 0 },
              { id: "minecraft:resistance", amplifier: 0 }
            ]
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:snowball",
            intervalTicks: 30,
            count: 3,
            spread: 0.3,
            speed: 2.0
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "irons_spellbooks:cryomancer",
                name: "§bCriomante do Gelo",
                count: 2,
                health: 60,
                potionEffects: [{ id: "minecraft:resistance", duration: 999999, amplifier: 0 }]
              }
            ],
            onEnter: true,
            periodic: {
              intervalTicks: 500
            }
          }
        }
      ]
    },

    // FASE 3: 50% ~ 25% - Fúria Congelante
    {
      threshold: 0.5,
      name: "Fúria Congelante",
      onEnterMessage: "§f§l❄ NUNU CONGELA TUDO!",
      bossBarColor: "WHITE",
      bossBarOverlay: "NOTCHED_12",
      abilities: [
        {
          type: "heal",
          config: {
            percentage: 0.15,
            onEnter: true
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 10,
            damage: 12,
            intervalTicks: 120,
            particleEffect: "minecraft:snowflake",
            knockback: 2.0
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:snowball",
            intervalTicks: 15,
            count: 5,
            spread: 0.5,
            speed: 2.5
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 200,
            radius: 15
          }
        }
      ]
    },

    // FASE 4: 25% ~ 0% - Avalanche Final
    {
      threshold: 0.25,
      name: "Avalanche Apocalíptica",
      onEnterMessage: "§4§l☠ AVALANCHE FINAL INICIADA!",
      bossBarColor: "RED",
      bossBarOverlay: "NOTCHED_20",
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 2.2,
            speedMultiplier: 1.6,
            particleEffect: true
          }
        },
        {
          type: "buff_attributes",
          config: {
            armor: 15,
            knockbackResistance: 0.8,
            potionEffects: [
              { id: "minecraft:strength", amplifier: 3 },
              { id: "minecraft:resistance", amplifier: 2 },
              { id: "minecraft:speed", amplifier: 1 }
            ]
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 12,
            damage: 18,
            intervalTicks: 80,
            particleEffect: "minecraft:snowflake",
            knockback: 3.0
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:snowball",
            intervalTicks: 5,
            count: 8,
            spread: 0.7,
            speed: 3.0
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "minecraft:stray",
                name: "§fGuardião Congelado",
                count: 4,
                health: 50,
                equipment: {
                  mainHand: {
                    id: "minecraft:bow",
                    enchantments: {
                      guaranteed: {
                        "minecraft:power": 3,
                        "minecraft:punch": 2
                      }
                    }
                  }
                }
              }
            ],
            periodic: {
              intervalTicks: 250
            }
          }
        },
        {
          type: "heal",
          config: {
            periodic: {
              intervalTicks: 200,
              amount: 50
            }
          }
        }
      ]
    }
  ]
};

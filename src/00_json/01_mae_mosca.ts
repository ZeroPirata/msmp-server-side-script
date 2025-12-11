// ===== MÃE MOSCA - Boss de Enxame =====
const MAE_MOSCA: IMiniBoss = {
  id: "born_in_chaos_v1:bloody_gadfly",
  name: "§4🦟 Mãe das Moscas 🦟",
  health: 1200,
  armor: 10,
  armorToughness: 2,
  speed: 0.3,
  lootrName: "mae_mosca_chest",
  spawnWeight: 7,

  equipment: {
    mainHand: {
      id: "minecraft:netherite_sword",
      enchantments: {
        guaranteed: {
          "minecraft:sharpness": 4,
          "minecraft:sweeping_edge": 3
        }
      }
    },
    dropChance: {
      mainHand: 0.08
    }
  },

  phases: [
    // FASE 1: 100% ~ 70% - Ataque Básico
    {
      threshold: 1.0,
      name: "Despertar do Enxame",
      onEnterMessage: "§c§l bzzzz BZZZZZZZZZZZZZ bzzzz!!!",
      bossBarColor: "RED",
      abilities: []
    },

    // FASE 2: 70% ~ 40% - Invoca Moscas
    {
      threshold: 0.7,
      name: "Chamado das Moscas",
      onEnterMessage: "§c§l🦟 A Mãe das Moscas convoca seu enxame!",
      bossBarColor: "PURPLE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "born_in_chaos_v1:bloody_gadfly",
                name: "§cMosca Sangrenta",
                count: 4,
                health: 30,
                attributes: {
                  damage: 4,
                  speed: 0.35
                },
                potionEffects: [{ id: "minecraft:speed", duration: 999999, amplifier: 1 }]
              }
            ],
            onEnter: true,
            periodic: {
              intervalTicks: 300 // A cada 15 segundos
            }
          }
        },
        {
          type: "buff_attributes",
          config: {
            speed: 1.2,
            potionEffects: [{ id: "minecraft:speed", amplifier: 0 }]
          }
        }
      ]
    },

    // FASE 3: 40% ~ 0% - Fúria Total
    {
      threshold: 0.4,
      name: "Fúria Sanguinária",
      onEnterMessage: "§4§l☠ MÃE DAS MOSCAS ENRAIVECEU!",
      bossBarColor: "RED",
      bossBarOverlay: "NOTCHED_20",
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 1.8,
            speedMultiplier: 1.5,
            particleEffect: true
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 6,
            damage: 8,
            intervalTicks: 100,
            particleEffect: "minecraft:crimson_spore",
            knockback: 1.0
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [
              {
                id: "born_in_chaos_v1:bloody_gadfly",
                name: "§4Mosca Raivosa",
                count: 6,
                health: 40,
                attributes: {
                  damage: 6,
                  speed: 0.4
                },
                potionEffects: [
                  { id: "minecraft:speed", duration: 999999, amplifier: 2 },
                  { id: "minecraft:strength", duration: 999999, amplifier: 1 }
                ]
              }
            ],
            periodic: {
              intervalTicks: 200 // A cada 10 segundos
            }
          }
        },
        {
          type: "heal",
          config: {
            periodic: {
              intervalTicks: 250,
              amount: 30
            }
          }
        }
      ]
    }
  ]
};

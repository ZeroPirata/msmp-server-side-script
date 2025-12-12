let EQUIPMENT_PRESETS: { [key: string]: IEquipmentPreset } = {
  warrior: {
    name: "Guerreiro",
    description: "Boss corpo a corpo com armadura pesada",
    equipment: {
      mainHand: {
        id: "minecraft:netherite_sword",
        enchantments: {
          possible: [
            { id: "minecraft:sharpness", minLevel: 4, maxLevel: 5, chance: 1.0 },
            { id: "minecraft:fire_aspect", minLevel: 1, maxLevel: 2, chance: 0.6 },
            { id: "minecraft:knockback", minLevel: 1, maxLevel: 2, chance: 0.4 }
          ]
        }
      },
      head: {
        id: "minecraft:netherite_helmet",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 4,
            "minecraft:unbreaking": 3
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
        mainHand: 0.03,
        head: 0.05,
        chest: 0.05,
        legs: 0.05,
        feet: 0.05
      }
    }
  },

  archer: {
    name: "Arqueiro",
    description: "Boss de longa distância",
    equipment: {
      mainHand: {
        id: "minecraft:bow",
        enchantments: {
          possible: [
            { id: "minecraft:power", minLevel: 4, maxLevel: 5, chance: 1.0 },
            { id: "minecraft:punch", minLevel: 1, maxLevel: 2, chance: 0.5 },
            { id: "minecraft:flame", minLevel: 1, maxLevel: 1, chance: 0.7 }
          ],
          guaranteed: {
            "minecraft:infinity": 1,
            "minecraft:unbreaking": 3
          }
        }
      },
      offHand: {
        id: "minecraft:arrow",
        count: 64
      },
      head: {
        id: "minecraft:leather_helmet",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 2, maxLevel: 3, chance: 0.8 }]
        }
      },
      dropChance: {
        mainHand: 0.08,
        offHand: 0.0,
        head: 0.1
      }
    }
  },

  mage: {
    name: "Mago",
    description: "Boss com poderes mágicos",
    equipment: {
      mainHand: {
        id: "minecraft:blaze_rod", // Varinha mágica
        enchantments: {
          guaranteed: {
            "minecraft:fire_aspect": 2,
            "minecraft:knockback": 1
          }
        },
        nbt: {
          display: {
            Name: '{"text":"Varinha Arcana","color":"purple","bold":true}',
            Lore: ['{"text":"Imbuída com poder místico","color":"gray","italic":false}', '{"text":"Concede Força e Velocidade ao portador","color":"dark_purple","italic":false}']
          },
          AttributeModifiers: [
            {
              AttributeName: "generic.attack_damage",
              Name: "generic.attack_damage",
              Amount: 8,
              Operation: 0,
              UUID: [1, 2, 3, 4]
            }
          ]
        }
      },
      head: {
        id: "minecraft:golden_helmet",
        enchantments: {
          possible: [
            { id: "minecraft:protection", minLevel: 2, maxLevel: 4, chance: 0.6 },
            { id: "minecraft:thorns", minLevel: 1, maxLevel: 3, chance: 0.5 }
          ]
        }
      },
      chest: {
        id: "minecraft:leather_chestplate",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 3
          }
        },
        nbt: {
          display: {
            color: 8388863 // Cor roxa
          }
        }
      },
      dropChance: {
        mainHand: 0.15, // Maior chance de dropar itens únicos
        head: 0.1,
        chest: 0.1
      }
    }
  }
};

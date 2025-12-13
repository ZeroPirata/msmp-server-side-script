// ===== PRESETS DE MINIONS =====
let MINION_PRESETS: { [key: string]: IMinionConfig } = {
  // Minion guerreiro básico
  warrior_minion: {
    id: "minecraft:zombie",
    name: "§cGuardião Morto-Vivo",
    count: 2,
    health: 50,
    equipment: {
      mainHand: {
        id: "minecraft:iron_sword",
        enchantments: {
          possible: [{ id: "minecraft:sharpness", minLevel: 1, maxLevel: 3, chance: 0.5 }]
        }
      },
      head: {
        id: "minecraft:iron_helmet",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 1, maxLevel: 2, chance: 0.4 }]
        }
      },
      chest: {
        id: "minecraft:iron_chestplate"
      },
      dropChance: {
        mainHand: 0.1,
        head: 0.05,
        chest: 0.05
      }
    },
    attributes: {
      damage: 6,
      speed: 0.28
    },
    potionEffects: [
      { id: "minecraft:speed", duration: 999999, amplifier: 0 },
      { id: "minecraft:strength", duration: 999999, amplifier: 0 }
    ]
  },

  // Minion arqueiro
  archer_minion: {
    id: "minecraft:skeleton",
    name: "§eArqueiro Esquelético",
    count: 3,
    health: 30,
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
      head: {
        id: "minecraft:leather_helmet"
      },
      dropChance: {
        mainHand: 0.15,
        head: 0.05
      }
    },
    attributes: {
      damage: 4,
    }
  },

  // Minion tanque
  tank_minion: {
    id: "minecraft:zombie_villager",
    name: "§9Guardião Blindado",
    count: 1,
    health: 100,
    equipment: {
      mainHand: {
        id: "minecraft:iron_axe",
        enchantments: {
          guaranteed: {
            "minecraft:sharpness": 2
          }
        }
      },
      head: {
        id: "minecraft:diamond_helmet",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 3,
            "minecraft:unbreaking": 2
          }
        }
      },
      chest: {
        id: "minecraft:diamond_chestplate",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 3,
            "minecraft:unbreaking": 2
          }
        }
      },
      legs: {
        id: "minecraft:diamond_leggings",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 3
          }
        }
      },
      feet: {
        id: "minecraft:diamond_boots",
        enchantments: {
          guaranteed: {
            "minecraft:protection": 3
          }
        }
      },
      dropChance: {
        mainHand: 0.05,
        head: 0.02,
        chest: 0.02,
        legs: 0.02,
        feet: 0.02
      }
    },
    attributes: {
      damage: 8,
      armor: 15,
      knockbackResistance: 0.5
    },
    potionEffects: [
      { id: "minecraft:resistance", duration: 999999, amplifier: 1 },
      { id: "minecraft:slowness", duration: 999999, amplifier: 0 }
    ]
  },

  // Minion mágico
  mage_minion: {
    id: "minecraft:witch",
    name: "§5Bruxo Corrompido",
    count: 2,
    health: 40,
    equipment: {
      mainHand: {
        id: "minecraft:potion",
        nbt: {
          Potion: "minecraft:strong_harming"
        }
      },
      offHand: {
        id: "minecraft:potion",
        nbt: {
          Potion: "minecraft:strong_healing"
        }
      }
    },
    potionEffects: [
      { id: "minecraft:speed", duration: 999999, amplifier: 0 },
      { id: "minecraft:regeneration", duration: 999999, amplifier: 0 }
    ]
  },

  // Minion explosivo
  explosive_minion: {
    id: "minecraft:creeper",
    name: "§cCreeper Instável",
    count: 2,
    health: 20,
    attributes: {
      speed: 0.35
    },
    potionEffects: [{ id: "minecraft:speed", duration: 999999, amplifier: 1 }]
  }
};

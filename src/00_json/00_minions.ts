let ZOMBIES: { [key: string]: IMinionConfig } = {
  zombieBasico: {
    id: "minecraft:zombie",
    name: "Zumbi Recruta",
    count: 5,
    health: 50,
    classe: "warrior",
    attributes: {
      damage: 3,
      speed: 0.23,
      armor: 0
    }
  },

  zombieNormal: {
    id: "minecraft:zombie",
    name: "Zumbi Soldado",
    count: 4,
    health: 75,
    classe: "warrior",
    attributes: {
      damage: 5,
      speed: 0.25,
      armor: 5
    },
    equipment: {
      mainHand: {
        id: "minecraft:stone_sword",
        enchantments: {
          possible: [{ id: "minecraft:sharpness", minLevel: 1, maxLevel: 2, chance: 0.8 }]
        }
      },
      offHand: {
        id: "minecraft:shield"
      },
      head: {
        id: "minecraft:chainmail_helmet[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 1, maxLevel: 2, chance: 0.8 }]
        }
      },
      chest: {
        id: "minecraft:chainmail_chestplate[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 1, maxLevel: 2, chance: 0.8 }]
        }
      },
      legs: {
        id: "minecraft:chainmail_leggings[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 1, maxLevel: 2, chance: 0.8 }]
        }
      },
      feet: {
        id: "minecraft:chainmail_boots[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:redstone', pattern:'minecraft:silence'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 1, maxLevel: 2, chance: 0.8 }]
        }
      }
    }
  },

  zombieMedio: {
    id: "minecraft:zombie",
    name: "Zumbi Blindado",
    count: 4,
    health: 100,
    classe: "tank",
    attributes: {
      damage: 7,
      speed: 0.22,
      armor: 15,
      knockbackResistance: 0.2
    },
    equipment: {
      mainHand: {
        id: "minecraft:iron_sword",
        enchantments: {
          possible: [{ id: "minecraft:sharpness", minLevel: 2, maxLevel: 3, chance: 0.85 }]
        }
      },
      head: {
        id: "minecraft:iron_helmet[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:lapis', pattern:'minecraft:ward'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 2, maxLevel: 4, chance: 0.8 }]
        }
      },
      chest: {
        id: "minecraft:iron_chestplate[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:lapis', pattern:'minecraft:ward'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 2, maxLevel: 4, chance: 0.8 }]
        }
      },
      legs: {
        id: "minecraft:iron_leggings[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:lapis', pattern:'minecraft:ward'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 2, maxLevel: 4, chance: 0.8 }]
        }
      },
      feet: {
        id: "minecraft:iron_boots[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:lapis', pattern:'minecraft:ward'}]",
        enchantments: {
          possible: [{ id: "minecraft:protection", minLevel: 2, maxLevel: 4, chance: 0.8 }]
        }
      }
    }
  },

  zombieDificil: {
    id: "minecraft:zombie",
    name: "Zumbi Aniquilador",
    count: 3,
    health: 125,
    classe: "berserker_minion",
    attributes: {
      damage: 12,
      speed: 0.28,
      armor: 20,
      knockbackResistance: 0.5
    },
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
    }
  }
};

let SKELETON: { [key: string]: IMinionConfig } = {
  archerBasico: {
    id: "minecraft:skeleton",
    name: "Arqueiro Recruta",
    count: 3,
    health: 50,
    classe: "archer",
    attributes: {
      damage: 2,
      speed: 0.25,
      armor: 0
    },
    equipment: {
      mainHand: { id: "minecraft:bow" }
    }
  },

  archerNormal: {
    id: "minecraft:skeleton",
    name: "Arqueiro de Elite",
    count: 3,
    health: 75,
    classe: "archer",
    attributes: {
      damage: 4,
      speed: 0.27,
      armor: 5
    },
    equipment: {
      mainHand: {
        id: "minecraft:bow",
        enchantments: {
          guaranteed: {
            "minecraft:power": 2,
            "minecraft:unbreaking": 1,
            "minecraft:infinity": 1
          }
        }
      },
      head: { id: "minecraft:chainmail_helmet[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
      chest: { id: "minecraft:chainmail_chestplate[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
      legs: { id: "minecraft:chainmail_leggings[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern:'minecraft:sentry'}]" },
      feet: { id: "minecraft:chainmail_boots[tiered:tiered_modifier='tiered:standard_armors/common', trim={material:'minecraft:copper', pattern='minecraft:sentry'}]" }
    }
  },

  archerMedio: {
    id: "minecraft:skeleton",
    name: "Ranger Veterano",
    count: 4,
    health: 100,
    classe: "ranger",
    attributes: {
      damage: 6,
      speed: 0.3,
      armor: 15
    },
    equipment: {
      mainHand: {
        id: "minecraft:bow",
        enchantments: {
          guaranteed: {
            "minecraft:power": 3,
            "minecraft:unbreaking": 2,
            "minecraft:infinity": 1
          }
        }
      },
      offHand: {
        id: "minecraft:tipped_arrow[potion_contents={potion:'minecraft:slowness'}]",
        count: 64
      },
      head: { id: "minecraft:iron_helmet[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      chest: { id: "minecraft:iron_chestplate[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      legs: { id: "minecraft:iron_leggings[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" },
      feet: { id: "minecraft:iron_boots[tiered:tiered_modifier='tiered:armors/fortified', trim={material:'minecraft:iron', pattern:'minecraft:shaper'}]" }
    }
  },

  archerDificil: {
    id: "minecraft:skeleton",
    name: "Sniper Fantasma",
    count: 2,
    health: 125,
    classe: "sniper",
    attributes: {
      damage: 10,
      speed: 0.35,
      armor: 20,
      knockbackResistance: 0.3
    },
    potionEffects: [{ id: "minecraft:speed", duration: 99999, amplifier: 0 }],
    equipment: {
      mainHand: {
        id: "minecraft:bow",
        enchantments: {
          guaranteed: {
            "minecraft:power": 2,
            "minecraft:unbreaking": 1,
            "minecraft:infinity": 1,
            "minecraft:flame": 1
          }
        }
      },
      offHand: {
        id: "minecraft:tipped_arrow[potion_contents={potion:'minecraft:strong_slowness', custom_effects:[{id:'minecraft:instant_damage', amplifier:1}]}]",
        count: 64
      },
      head: { id: "minecraft:diamond_helmet[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
      chest: { id: "minecraft:diamond_chestplate[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
      legs: { id: "minecraft:diamond_leggings[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" },
      feet: { id: "minecraft:diamond_boots[tiered:tiered_modifier='tiered:armors/resilient', trim={material:'minecraft:emerald', pattern:'minecraft:silence'}]" }
    }
  }
};

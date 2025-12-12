let RANDOM_WARRIOR_EQUIPMENT: IEquipment = {
  mainHand: {
    id: "minecraft:netherite_sword",
    enchantments: {
      possible: [
        { id: "minecraft:sharpness", minLevel: 3, maxLevel: 5, chance: 0.8 },
        { id: "minecraft:fire_aspect", minLevel: 1, maxLevel: 2, chance: 0.5 },
        { id: "minecraft:looting", minLevel: 2, maxLevel: 3, chance: 0.3 },
        { id: "minecraft:sweeping_edge", minLevel: 2, maxLevel: 3, chance: 0.4 }
      ],
      guaranteed: {
        "minecraft:unbreaking": 3 // Sempre terá Unbreaking 3
      }
    }
  },
  head: {
    id: "minecraft:netherite_helmet",
    enchantments: {
      possible: [
        { id: "minecraft:protection", minLevel: 3, maxLevel: 4, chance: 0.7 },
        { id: "minecraft:respiration", minLevel: 2, maxLevel: 3, chance: 0.5 },
        { id: "minecraft:aqua_affinity", minLevel: 1, maxLevel: 1, chance: 0.3 }
      ],
      guaranteed: {
        "minecraft:unbreaking": 3
      }
    }
  }
};

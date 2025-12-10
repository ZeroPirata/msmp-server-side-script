const ZARGON: IMiniBoss = {
  id: "cataclysm:royal_draugr",
  name: "§c§l⚔ Zargon, o Podre §c§l⚔",
  health: 20,
  attack: 20,
  armor: -10,
  armorToughness: -5,
  speed: 0.3,
  spawnWeight: 10,
  lootrName: "zargon_chest",
  specialAbilities: ["regeneration", "speed_burst"],
  enrageThreshold: 0.3,
  phases: 2,
  lootMultiplier: 1.5,
  summonMinions: false,
  summonMinionsPerPhase: 3,
  summonMinionList: [
    {
      id: "minecraft:zombie",
      name: "§7Guerreiro Apodrecido",
      health: 40,
      attack: 8,
      armor: 5,
      armorToughness: 0,
      speed: 0.25,
      equipment: {
        mainHand: "minecraft:iron_sword",
        head: "minecraft:iron_helmet",
        chest: "minecraft:iron_chestplate",
        legs: "minecraft:iron_leggings",
        feet: "minecraft:iron_boots",
        dropChance: {
          mainHand: 0.1,
          head: 0.05,
          chest: 0.05,
          legs: 0.05,
          feet: 0.05
        }
      }
    },
    {
      id: "minecraft:skeleton",
      name: "§7Arqueiro das Sombras",
      health: 30,
      attack: 6,
      armor: 2,
      armorToughness: 0,
      speed: 0.28,
      equipment: {
        mainHand: "minecraft:bow",
        head: "minecraft:leather_helmet",
        dropChance: {
          mainHand: 0.2,
          head: 0.1
        }
      }
    },
    {
      id: "minecraft:zombie",
      name: "§7Tanque Putrefato",
      health: 60,
      attack: 5,
      armor: 10,
      armorToughness: 2,
      speed: 0.2,
      equipment: {
        mainHand: "minecraft:shield",
        offHand: "minecraft:stone_sword",
        head: "minecraft:diamond_helmet",
        chest: "minecraft:diamond_chestplate",
        legs: "minecraft:diamond_leggings",
        feet: "minecraft:diamond_boots",
        dropChance: {
          mainHand: 0.3,
          offHand: 0.2,
          head: 0.01,
          chest: 0.01,
          legs: 0.01,
          feet: 0.01
        }
      }
    }
  ],
  equipment: {
    mainHand: "cataclysm:athame"
  }
};

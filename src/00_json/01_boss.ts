let SIMPLE_BOSS: IMiniBoss = {
  id: "minecraft:zombie",
  name: "§eZumbi Forte",
  health: 500,
  armor: 10,
  attack: 8,
  armorToughness: 2,
  lootrName: "simple_chest",
  spawnWeight: 10,
  equipment: EQUIPMENT_PRESETS.warrior.equipment,
  phases: [
    {
      threshold: 1.0,
      name: "É so um zumbi bufado ao extremo...",
      onEnterMessage: "§c§l <SOM DE ZUMBI RAIVOSO>!",
      bossBarColor: "RED",
      abilities: []
    }
  ]
};

let ZARGON: IMiniBoss = {
  id: "cataclysm:royal_draugr",
  name: "⚔ Zargon, O Primeiro. ⚔",
  health: 5000,
  attack: 5,
  armor: 20,
  armorToughness: 5,
  speed: 0.05,
  lootrName: "zargon_chest",
  equipment: EQUIPMENT_PRESETS.warrior.equipment,
  phases: [
    {
      threshold: 1.0,
      name: "Despertar do Rei caido...",
      onEnterMessage: "§c§l Pastel... Pastel... Pastel...",
      bossBarColor: "RED",
      abilities: []
    }
  ]
};

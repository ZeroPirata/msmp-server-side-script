let TWO_PHASE_BOSS: IMiniBoss = {
  id: "minecraft:skeleton",
  name: "§6Arqueiro das Sombras",
  health: 800,
  lootrName: "archer_chest",
  spawnWeight: 8,
  attack: 6,
  armor: 8,
  armorToughness: 3,
  equipment: EQUIPMENT_PRESETS.archer.equipment,
  phases: [
    // ===== FASE 1: 100% ~ 50% =====
    {
      threshold: 1.0, // Começa em 100%
      name: "Fase Inicial",
      abilities: [
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 40, // Atira a cada 2 segundos
            count: 1,
            speed: 2.0
          }
        }
      ]
    },

    // ===== FASE 2: 50% ~ 0% =====
    {
      threshold: 0.5,
      name: "Fúria do Arqueiro",
      onEnterMessage: "§c§l⚠ O Arqueiro das Sombras entrou em fúria!",
      bossBarColor: "RED",
      abilities: [
        {
          type: "buff_attributes",
          config: {
            speed: 1.3, // 30% mais rápido
            potionEffects: [{ id: "minecraft:strength", amplifier: 1 }]
          }
        },
        {
          type: "shoot_projectiles",
          config: {
            projectileType: "minecraft:arrow",
            intervalTicks: 40,
            count: 1,
            speed: 2.0
          }
        }
      ]
    }
  ]
};

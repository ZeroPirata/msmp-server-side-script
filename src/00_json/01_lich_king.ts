const LICH_KING: IMiniBoss = {
  id: "minecraft:wither_skeleton",
  name: "☠ Boundaries ☠",
  health: 2000,
  armor: 20,
  lootrName: "lich_king_chest",
  spawnWeight: 3,
  equipment: EQUIPMENT_PRESETS.warrior.equipment,

  phases: [
    // ===== FASE 1: 100% ~ 75% - NORMAL =====
    {
      threshold: 1.0,
      name: "Despertar",
      bossBarColor: "PURPLE",
      abilities: [] // Apenas ataque básico
    },

    // ===== FASE 2: 75% ~ 50% - INVOCA MINIONS =====
    {
      threshold: 0.75,
      name: "Invocação",
      onEnterMessage: "§5§l☠ Tolos, conhecerão minha legião!",
      bossBarColor: "BLUE",
      bossBarOverlay: "NOTCHED_10",
      abilities: [
        {
          type: "summon_minions",
          config: {
            minions: [MINION_PRESETS.warrior_minion, MINION_PRESETS.archer_minion],
            onEnter: true, // Spawna ao entrar na fase
            periodic: {
              intervalTicks: 400 // Spawna a cada 20 segundos
            }
          }
        }
      ]
    },

    // ===== FASE 3: 50% ~ 25% - CURA + BUFF =====
    {
      threshold: 0.5,
      name: "Regeneração",
      onEnterMessage: "§c§l⚔ Ainda tentam me desafiar?!",
      bossBarColor: "GREEN",
      bossBarOverlay: "NOTCHED_12",
      abilities: [
        {
          type: "heal",
          config: {
            percentage: 0.2, // Cura 20% da vida ao entrar
            onEnter: true,
            periodic: {
              intervalTicks: 1200, // Cura a cada 10 segundos
              amount: 5
            }
          }
        },
        {
          type: "buff_attributes",
          config: {
            damage: 1.5,
            armor: 10,
            potionEffects: [
              { id: "minecraft:resistance", amplifier: 1 },
              { id: "minecraft:strength", amplifier: 2 }
            ]
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [MINION_PRESETS.tank_minion],
            periodic: {
              intervalTicks: 600
            }
          }
        }
      ]
    },

    // ===== FASE 4: 25% ~ 0% - FASE FINAL =====
    {
      threshold: 0.25,
      name: "Desespero Final",
      onEnterMessage: "§4§l☠ VOCÊS NÃO PODEM ME DERROTAR!",
      bossBarColor: "RED",
      bossBarOverlay: "NOTCHED_20",
      abilities: [
        {
          type: "enrage",
          config: {
            damageMultiplier: 2.0,
            speedMultiplier: 1.5,
            particleEffect: true
          }
        },
        {
          type: "aoe_damage",
          config: {
            radius: 8,
            damage: 10,
            intervalTicks: 200, // A cada 5 segundos
            particleEffect: "minecraft:soul_fire_flame",
            knockback: 2
          }
        },
        {
          type: "teleport",
          config: {
            intervalTicks: 200,
            radius: 15,
            toLowHealthPlayer: true
          }
        },
        {
          type: "summon_minions",
          config: {
            minions: [MINION_PRESETS.explosive_minion, MINION_PRESETS.explosive_minion],
            periodic: {
              intervalTicks: 300
            }
          }
        }
      ]
    }
  ]
};

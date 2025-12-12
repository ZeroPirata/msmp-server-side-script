let IRMA_DE_CRISTAL: IMiniBoss = {
  id: "born_in_chaos_v1:fallen_chaos_knight",
  name: "§5§l Guardião caido",
  lootrName: "crystal_guardian_loot",
  spawnWeight: 10,
  health: 500,
  attack: 15,
  armor: 20,
  armorToughness: 8,
  speed: 0.3,
  phases: [
    {
      threshold: 1.0,
      name: "Fase Normal",
      bossBarColor: "BLUE",
      abilities: []
    },
    {
      threshold: 0.6, // 60% de vida
      name: "§c§lFase dos Cristais",
      bossBarColor: "PURPLE",
      onEnterMessage: "§5§l⚡ O Guardião invocou cristais de poder!",
      abilities: [
        {
          type: "crystal_phase",
          config: {
            onEnter: true,
            crystalBlockType: "minecraft:end_crystal",
            crystalCount: 4,
            distanceFromBoss: 15,
            damageBuffPerSecond: 0.5, // 0.5 de dano por segundo
            maxDamageBuff: 10,
            respawnTime: 2600, // 30 segundos (600 ticks)
            particleEffect: "minecraft:witch",
            protectionRadius: 3, // Players tomam dano perto do cristal
            // minionSpawnPerCrystal: [MINION_PRESETS.warrior_minion, MINION_PRESETS.archer_minion, MINION_PRESETS.tank_minion, MINION_PRESETS.tank_minion, MINION_PRESETS.tank_minion]
          }
        } as ICrystalPhaseAbility,
        {
          type: "aoe_damage",
          config: {
            radius: 8,
            damage: 6,
            intervalTicks: 120,
            particleEffect: "minecraft:soul_fire_flame"
          }
        }
      ]
    }
  ]
};

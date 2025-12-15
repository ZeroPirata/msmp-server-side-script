interface ISummonMinions {
  enabled: boolean;
  triggers?: Array<{
    healthPercentage: number;
    minions: IMinionConfig[];
    maxSpawns?: number;
    cooldown?: number;
  }>;
  onDeath?: {
    minions: IMinionConfig[];
  };
  periodic?: {
    intervalTicks: number;
    minions: IMinionConfig[];
  };
}

interface IMinionConfig {
  id: string;
  name?: string;
  count?: number;
  health?: number;
  equipment?: IEquipment;
  classe:
    | "mage"
    | "summoner"
    | "necromancer_minion"
    | "break"
    | "battle_mage_minion"
    | "warrior"
    | "knight"
    | "berserker_minion"
    | "tank"
    | "guardian"
    | "archer"
    | "ranger"
    | "sniper"
    | "support"
    | "healer"
    | "cleric"
    | "assassin"
    | "rogue"
    | "bomber"
    | "exploder"
    | "shielder";
  attributes?: {
    damage?: number;
    speed?: number;
    armor?: number;
    knockbackResistance?: number;
  };
  potionEffects?: Array<{
    id: string;
    duration: number;
    amplifier: number;
  }>;
  dropChance?: number;
  abilities?: IMinionAbility[];
}

interface IMinionAbility {
  type: "cast_spell" | "shoot_projectile" | "aoe_attack";
  config: {
    // Para cast_spell
    spellId?: string;

    // Para shoot_projectile
    projectileType?: string;

    // Geral
    intervalTicks: number;
    range?: number;
    targetMode?: "nearest_enemy" | "random_enemy";
  };
}

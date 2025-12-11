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
}

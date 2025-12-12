type PhaseAbilityType =
  | "summon_minions"
  | "heal"
  | "buff_attributes"
  | "shoot_projectiles"
  | "aoe_damage"
  | "teleport"
  | "spawn_totems"
  | "weather_change"
  | "potion_effects"
  | "enrage"
  | "crystal_phase";

interface ICrystalConfig {
  crystalBlockType: string; // Ex: "minecraft:end_crystal", "minecraft:beacon"
  crystalCount: number; // Quantos cristais spawnar
  distanceFromBoss: number; // Distância em blocos do boss
  minionSpawnPerCrystal?: IMinionConfig[]; // Minions que spawnam em cada cristal
  damageBuffPerSecond: number; // Buff de dano por segundo ativo (max 10)
  maxDamageBuff: number; // Cap de dano (padrão: 10)
  respawnTime?: number; // Ticks para cristal respawnar (0 = não respawna)
  particleEffect?: string; // Efeito de partícula no cristal
  protectionRadius?: number; // Raio onde players tomam dano perto do cristal
}

interface IPhaseAbility {
  type: PhaseAbilityType;
  config?: any;
}

interface ICrystalPhaseAbility extends IPhaseAbility {
  type: "crystal_phase";
  config: ICrystalConfig;
}

interface ISummonMinionsAbility extends IPhaseAbility {
  type: "summon_minions";
  config: {
    minions: IMinionConfig[];
    onEnter?: boolean;
    periodic?: {
      intervalTicks: number;
    };
  };
}

interface IHealAbility extends IPhaseAbility {
  type: "heal";
  config: {
    amount?: number; // Quantidade fixa
    percentage?: number; // Ou porcentagem da vida máxima
    onEnter?: boolean; // Cura ao entrar na fase
    periodic?: {
      intervalTicks: number;
      amount: number;
    };
  };
}

interface IBuffAttributesAbility extends IPhaseAbility {
  type: "buff_attributes";
  config: {
    damage?: number; // Multiplica o dano (1.5 = 150%)
    speed?: number;
    armor?: number;
    knockbackResistance?: number;
    potionEffects?: Array<{
      id: string;
      amplifier: number;
    }>;
  };
}

interface IShootProjectilesAbility extends IPhaseAbility {
  type: "shoot_projectiles";
  config: {
    projectileType: string; // "minecraft:arrow", "minecraft:fireball", etc
    intervalTicks: number; // Frequência de tiro
    count?: number; // Quantos projéteis por vez
    spread?: number; // Dispersão (0 = direto, 1 = muito espalhado)
    speed?: number;
  };
}

interface IAoeDamageAbility extends IPhaseAbility {
  type: "aoe_damage";
  config: {
    radius: number;
    damage: number;
    intervalTicks: number;
    particleEffect?: string;
    knockback?: number;
  };
}

interface ITeleportAbility extends IPhaseAbility {
  type: "teleport";
  config: {
    intervalTicks: number;
    radius: number;
    toLowHealthPlayer?: boolean;
  };
}

interface IWeatherChangeAbility extends IPhaseAbility {
  type: "weather_change";
  config: {
    weather: "rain" | "thunder" | "clear";
    onEnter?: boolean;
  };
}

interface IEnrageAbility extends IPhaseAbility {
  type: "enrage";
  config: {
    damageMultiplier: number;
    speedMultiplier: number;
    particleEffect?: boolean;
  };
}

interface ICrystalData {
  pos: $BlockPos;
  activeTime: number; // Ticks que ficou ativo
  destroyed: boolean;
  respawnAt?: number; // Tick de respawn
}

interface IBossPhase {
  threshold: number; // Percentual de vida (0.75 = 75%, 0.5 = 50%, etc)
  name?: string; // Nome da fase (ex: "Fase de Invocação")
  abilities: IPhaseAbility[]; // Lista de habilidades ativas nesta fase
  onEnterMessage?: string; // Mensagem ao entrar na fase
  bossBarColor?: string; // Cor da boss bar nesta fase
  bossBarOverlay?: string; // Overlay da boss bar
}

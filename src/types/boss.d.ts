interface IMiniBoss extends IEnemy {
  lootrName: string; // Nome do baú lootr associado
  difficulty: BossDifficulty; // Dificuldade do boss
  spawnWeight: number; // Peso de spawn em relação a outros minibosses
  phases?: IBossPhase[]; // ← NOVO: Array de fases
  immuneTo?: string[]; // Imune a certos danos
  lootMultiplier?: number; // Boss premium dropa 2x mais
  scaling?: IPlayerScaling; // Escala com o número de jogadores
  bloodMoon?: boolean; // Se pode spawnar na Blood Moon
  classe:
    | "mage_summoner"
    | "battle_mage"
    | "necromancer"
    | "blood_mage"
    | "crystal_guardian"
    | "tank_brawler"
    | "berserker"
    | "fallen_hero"
    | "armored_juggernaut"
    | "assassin"
    | "archer_sniper"
    | "archer_assassin"
    | "marksman"
    | "elemental_fury"
    | "void_walker"
    | "storm_caller"
    | "plague_bearer";
}

interface IPlayerScaling {
  healthFactor?: number; // Ex: 1.0 (100% da vida base extra por jogador)
  attackFactor?: number; // Ex: 0.25 (25% do ataque base extra por jogador)
  armorFactor?: number; // 3. Fator de Armadura/Defesa (Opcional, se o boss for muito focado em defesa)
  dropMultiplierFactor?: number; // 4. Fator de Drops (Opcional: Aumentar a chance/quantidade total de drops)
}

type BossDifficulty = "FACIL" | "NORMAL" | "MEDIO" | "DIFICIL" | "RAID";

interface DifficultyWeight {
  difficulty: BossDifficulty;
  baseWeight: number;
  dayMultiplier: number;
}

interface ActiveBossData {
  uuid: string;
  config: IMiniBoss;
  bossBarId: string;
  spawnDay: number;
  position: { x: number; y: number; z: number };
}

interface PendingBossData {
  config: IMiniBoss;
  x: number;
  y: number;
  z: number;
  activationRange: number;
  spawnDay: number;
  isBloodMoonBoss?: boolean;
}

interface NightSpawnState {
  day: number;
  spawnedCount: number;
  attemptCount: number;
  spawnedDifficulties: { [key: string]: number };
  spawnedPositions: Array<{ x: number; z: number }>;
}

interface MountConfig {
  id: string;
  name?: string;
  health?: number;
  statusBase?: {
    attack?: number;
    armor?: number;
    armorToughness?: number;
    speed?: number;
  };
}

interface BloodMoonConfig {
  ENABLED: boolean;
  MIN_DAYS: number;
  MAX_DAYS: number;
  DURATION_TICKS: number;
  BOSS_SPAWN_DELAY: number;
  BOSS_CLASSE: string;
  ANNOUNCE_START: boolean;
  ANNOUNCE_END: boolean;
  SKY_COLOR: boolean;
}

interface BloodMoonState {
  nextBloodMoonDay: number;
  isActive: boolean;
  startTick: number;
  bossSpawned: boolean;
  bossUuid: string | null;
  bossKilled: boolean;
}

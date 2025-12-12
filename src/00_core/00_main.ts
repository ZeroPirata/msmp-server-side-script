console.log("[MSMP] Carregando core principais...");

let bossChunkPositions: { x: number; z: number }[] = [];
let bossActivationCheckTimer = 0;
let pendingBossSpawn: {
  config: IMiniBoss;
  x: number;
  y: number;
  z: number;
  activationRange: number;
} | null = null;

let VIDEO_TAG = "msmp_player_watched_video";
let VIDEO_URL = "https://www.youtube.com/watch?v=9E15RZINDFI";
let TAG_LAST_DAY = "msmp_last_boss_spawn_day";

let activeBossBar: $CustomBossEvent | null = null;

let CONFIG_KEY = "msmp_configs";
let DEFAULT_CONFIG = {
  DELAY_TICKS: 1 * 60 * 20,
  SPAWN_SAFE_RADIUS: 0,
  MIN_DISTANCE: 0,
  MAX_DISTANCE: 10,
  MIN_DAY: 1,
  CHANCE_PERCENT: 1.0
};

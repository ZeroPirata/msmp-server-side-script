console.log("[MSMP] Carregando core principais...");

// Server
let VIDEO_TAG = "msmp_player_watched_video";
let VIDEO_URL = "https://www.youtube.com/watch?v=9E15RZINDFI";

// Commands
let CONFIG_KEY = "msmp_configs";
let DEFAULT_CONFIG = {
  DELAY_TICKS: 1 * 60 * 20,
  SPAWN_SAFE_RADIUS: 0,
  MIN_DISTANCE: 0,
  MAX_DISTANCE: 10,
  MIN_DAY: 1,
  CHANCE_PERCENT: 0.7,
  MAX_BOSS_NIGHT: 5,
  MAX_SPAWN_ATTEMPTS: 10,
  MIN_BOSS_DISTANCE: 200
};

// boss management
let bossChunkPositions: { x: number; z: number }[] = [];
let bossActivationCheckTimer = 0;
let pendingBossSpawn: {
  config: IMiniBoss;
  x: number;
  y: number;
  z: number;
  activationRange: number;
} | null = null;

let activeBossBar: $CustomBossEvent | null = null;
let damageAccumulator: { [bossUUID: string]: { [playerUUID: string]: number } } = {};
let TAG_LAST_DAY = "msmp_last_boss_spawn_day";

// Minecraft Classes
let Entity = Java.loadClass("net.minecraft.world.entity.Entity");
let EntityType = Java.loadClass("net.minecraft.world.entity.EntityType");
let AABB = Java.loadClass("net.minecraft.world.phys.AABB");
let Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");
let BlockPos = Java.loadClass("net.minecraft.core.BlockPos");
let Block = Java.loadClass("net.minecraft.world.level.block.Block");
let CustomBossEvent = Java.loadClass("net.minecraft.server.bossevents.CustomBossEvent");
let BossBarColor = Java.loadClass("net.minecraft.world.BossEvent$BossBarColor");
let BossBarOverlay = Java.loadClass("net.minecraft.world.BossEvent$BossBarOverlay");
let ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation");
let EquipmentSlot = Java.loadClass("net.minecraft.world.entity.EquipmentSlot");
let NearestAttackableTargetGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.target.NearestAttackableTargetGoal");
let WaterAvoidingRandomStrollGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.WaterAvoidingRandomStrollGoal");
let LookAtPlayerGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.LookAtPlayerGoal");
let AvoidEntityGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.AvoidEntityGoal");
let MeleeAttackGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.MeleeAttackGoal");
let RangedBowAttackGoal = Java.loadClass("net.minecraft.world.entity.ai.goal.RangedBowAttackGoal");
let Player = Java.loadClass("net.minecraft.world.entity.player.Player");

// Ritual Constants
let RITUAL_HEIGHT = 4; // 4 blocos acima
let HEAL_PER_SECOND = 5; // 0.25 HP/tick × 20 = 5 HP/seg
let BEAM_UPDATE_TICKS = 5; // Faixes a cada 0.25 seg
let RITUAL_PARTICLE_TICKS = 10; // Partículas a cada 0.5 seg

//
let activeBosses = {};
let pendingBosses: Array<PendingBossData> = [];
let currentNightState: NightSpawnState | null = null;
let bossActivationCheckTimers = {};

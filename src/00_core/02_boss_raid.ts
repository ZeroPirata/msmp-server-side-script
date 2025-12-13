import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $Registry } from "net.minecraft.core.Registry";

let Entity = Java.loadClass("net.minecraft.world.entity.Entity");
let EntityType = Java.loadClass("net.minecraft.world.entity.EntityType");
let AABB = Java.loadClass("net.minecraft.world.phys.AABB");
let Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");
let BlockPos = Java.loadClass("net.minecraft.core.BlockPos");
let Block = Java.loadClass("net.minecraft.world.level.block.Block");

let RITUAL_HEIGHT = 4; // 4 blocos acima
let HEAL_PER_SECOND = 5; // 0.25 HP/tick × 20 = 5 HP/seg
let BEAM_UPDATE_TICKS = 5; // Faixes a cada 0.25 seg
let RITUAL_PARTICLE_TICKS = 10; // Partículas a cada 0.5 seg

function bossPhases(boss: $LivingEntity, config: IMiniBoss, level: $MinecraftServer): void {
  let currentTick = level.getTickCount();
  let currentHealth = boss.health;
  let maxHealth = boss.maxHealth;
  let healthPercentage = currentHealth / maxHealth;
  let percentDisplay = (healthPercentage * 100).toFixed(1);

  updateBossBarProgress(healthPercentage);

  let activePhaseIndex = -1;

  if (config.phases) {
    for (let i = config.phases.length - 1; i >= 0; i--) {
      if (healthPercentage <= config.phases[i].threshold) {
        activePhaseIndex = i;
        break;
      }
    }
  }
  if (activePhaseIndex === -1) {
    activePhaseIndex = 0;
  }

  let currentPhaseKey = boss.persistentData.getInt("currentPhase") || 0;

  if (currentPhaseKey !== activePhaseIndex) {
    if (activePhaseIndex > currentPhaseKey) {
      enterPhase(boss, config.phases[activePhaseIndex], activePhaseIndex);
      boss.persistentData.putInt("currentPhase", activePhaseIndex);
      boss.persistentData.putInt("lastPhaseChangeTick", currentTick);
    } else {
      activePhaseIndex = currentPhaseKey;
    }
  }
  let finalPhase = config.phases[activePhaseIndex];
  let nameBoss = "";

  if (finalPhase.name) {
    nameBoss = finalPhase.name;
  }

  updateBossBarName(`${config.name} ${nameBoss} - §7[${percentDisplay}%]`);
  updateBossBarColor(finalPhase.bossBarColor || "GREEN");
  updateBossBarOverlay(finalPhase.bossBarOverlay || "PROGRESS");
  executePhaseAbilities(boss, finalPhase || null, level);
}

function enterPhase(boss: $LivingEntity, phase: IBossPhase, phaseIndex: number): void {
  if (phaseIndex === undefined) return;

  let level = boss.level as $ServerLevel;
  let bossName = boss.customName?.getString() || "Boss";

  if (phase.onEnterMessage) {
    let nomeFase = "Nova Fase";
    if (phase.name) {
      nomeFase = phase.name;
    }

    level.runCommandSilent(`tellraw @a[distance=..64] "${phase.onEnterMessage}"`);
    level.runCommandSilent(`title @a times 10 40 10`);
    level.runCommandSilent(`title @a subtitle {"text":"${nomeFase}","color":"gold"}`);
    level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${boss.x} ${boss.y} ${boss.z} 2 1`);
  }
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 1 1 1 0 5 force @a`);
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${boss.x} ${boss.y} ${boss.z} 2 2 2 0.1 100 force @a`);

  phase.abilities.forEach((ability, index) => {
    if (ability.config?.onEnter) {
      executeAbility(boss, ability, level, true, phaseIndex);
    }
    boss.persistentData.putInt(`phase_${phaseIndex}_ability_${index}_lastTick`, level.getServer().getTickCount());
  });
}

function executePhaseAbilities(boss: $LivingEntity, phase: IBossPhase, server: $MinecraftServer): void {
  if (phase == null) return;
  let level = boss.level as $ServerLevel;
  let currentTick = server.getTickCount();
  let phaseIndex = boss.persistentData.getInt("currentPhase") || 0;

  phase.abilities.forEach((ability, abilityIndex) => {
    if (ability.type === "crystal_phase" && currentTick % 5 !== 0) {
      return;
    }
    executeAbility(boss, ability, level, false, phaseIndex, abilityIndex, currentTick);
  });
}

function executeAbility(boss: $LivingEntity, ability: IPhaseAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  switch (ability.type) {
    case "summon_minions":
      executeSummonMinions(boss, ability as ISummonMinionsAbility, level, isOnEnter, phaseIndex, abilityIndex, currentTick);
      break;

    case "heal":
      executeHeal(boss, ability as IHealAbility, level, isOnEnter, phaseIndex, abilityIndex, currentTick);
      break;

    case "buff_attributes":
      executeBuffAttributes(boss, ability as IBuffAttributesAbility, level, isOnEnter);
      break;

    case "shoot_projectiles":
      executeShootProjectiles(boss, ability as IShootProjectilesAbility, level, phaseIndex, abilityIndex, currentTick);
      break;

    case "aoe_damage":
      executeAoeDamage(boss, ability as IAoeDamageAbility, level, phaseIndex, abilityIndex, currentTick);
      break;

    case "teleport":
      executeTeleport(boss, ability as ITeleportAbility, level, phaseIndex, abilityIndex, currentTick);
      break;

    case "weather_change":
      executeWeatherChange(boss, ability as IWeatherChangeAbility, level, isOnEnter);
      break;

    case "enrage":
      executeEnrage(boss, ability as IEnrageAbility, level, isOnEnter);
      break;

    case "crystal_phase":
      executeCrystalPhase(boss, ability as ICrystalPhaseAbility, level, isOnEnter, phaseIndex);
      break;
    case "projectile_rain":
      executeProjectileRain(boss, ability as IProjectileRainAbility, level, phaseIndex, abilityIndex, currentTick);
      break;
  }
}

function executeSummonMinions(boss: $LivingEntity, ability: ISummonMinionsAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (isOnEnter && ability.config.onEnter) {
    ability.config.minions.forEach((minionConfig) => {
      spawnMinion(level, boss.blockPosition(), minionConfig);
    });
    return;
  }

  if (!isOnEnter && ability.config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    let lastTick = boss.persistentData.getInt(key) || 0;
    let interval = ability.config.periodic.intervalTicks;

    if (currentTick - lastTick >= interval) {
      ability.config.minions.forEach((minionConfig) => {
        spawnMinion(level, boss.blockPosition(), minionConfig);
      });
      boss.persistentData.putInt(key, currentTick);
      let bossName = boss.customName?.getString() || "Boss";
      level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚔ ${bossName} invocou reforços!"`);
    }
  }
}

function executeHeal(boss: $LivingEntity, ability: IHealAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (isOnEnter && ability.config.onEnter) {
    let healAmount = 0;

    if (ability.config.amount) {
      healAmount = ability.config.amount;
    } else if (ability.config.percentage) {
      healAmount = boss.maxHealth * ability.config.percentage;
    }
    boss.heal(healAmount);
    level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 2} ${boss.z} 1 1 1 0.1 20 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.player.levelup master @a ${boss.x} ${boss.y} ${boss.z} 1 1.5`);
    let bossName = boss.customName?.getString() || "Boss";
    level.runCommandSilent(`tellraw @a[distance=..64] "§a§l+ ${bossName} se curou em ${healAmount.toFixed(0)} HP!"`);
    return;
  }

  if (!isOnEnter && ability.config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    let lastTick = boss.persistentData.getInt(key) || 0;
    let interval = ability.config.periodic.intervalTicks;
    if (currentTick - lastTick >= interval) {
      let healAmount = ability.config.periodic.amount;
      boss.heal(healAmount);
      level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 1.5} ${boss.z} 0.5 0.5 0.5 0 5 force @a`);
      boss.persistentData.putInt(key, currentTick);
    }
  }
}

function executeBuffAttributes(boss: $LivingEntity, ability: IBuffAttributesAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter) return;
  let config = ability.config;
  if (config.damage) {
    let currentDamage = boss.getAttributeBaseValue("minecraft:generic.attack_damage");
    boss.setAttributeBaseValue("minecraft:generic.attack_damage", currentDamage * config.damage);
  }
  if (config.speed) {
    let currentSpeed = boss.getAttributeBaseValue("minecraft:generic.movement_speed");
    boss.setAttributeBaseValue("minecraft:generic.movement_speed", currentSpeed * config.speed);
  }
  if (config.armor) {
    let currentArmor = boss.getAttributeBaseValue("minecraft:generic.armor");
    boss.setAttributeBaseValue("minecraft:generic.armor", currentArmor + config.armor);
  }
  if (config.knockbackResistance) {
    boss.setAttributeBaseValue("minecraft:generic.knockback_resistance", config.knockbackResistance);
  }
  if (config.potionEffects) {
    config.potionEffects.forEach((effect) => {
      boss.potionEffects.add(effect.id, 999999, effect.amplifier, false, false);
    });
  }
  level.runCommandSilent(`particle minecraft:enchant ${boss.x} ${boss.y + 1} ${boss.z} 1 1 1 0.5 50 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.player.levelup master @a ${boss.x} ${boss.y} ${boss.z} 1 0.8`);
  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a[distance=..64] "§e§l⚡ ${bossName} ficou mais tomou BOMBA!"`);
}

function executeShootProjectiles(boss: $LivingEntity, ability: IShootProjectilesAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;
  if (currentTick - lastTick < interval) return;
  let nearestPlayer = null;
  let minDistance = 999999;
  let maxDistanceSqr = 32 * 32;

  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;
    let dist = boss.distanceToSqr(player);
    if (dist > maxDistanceSqr) return;
    if (dist < minDistance) {
      minDistance = dist;
      nearestPlayer = player;
    }
  });
  if (!nearestPlayer) return;
  let count = ability.config.count || 1;
  let spread = ability.config.spread || 0;
  for (let i = 0; i < count; i++) {
    let dx = nearestPlayer.x - boss.x;
    let dy = nearestPlayer.y + nearestPlayer.eyeHeight - boss.y - boss.eyeHeight;
    let dz = nearestPlayer.z - boss.z;
    if (spread > 0) {
      dx += (Math.random() - 0.5) * spread * 2;
      dy += (Math.random() - 0.5) * spread * 2;
      dz += (Math.random() - 0.5) * spread * 2;
    }
    let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    dx /= length;
    dy /= length;
    dz /= length;
    let projectile = level.createEntity(ability.config.projectileType);
    if (!projectile) continue;
    projectile.setPos(boss.x, boss.y + boss.eyeHeight, boss.z);
    let speed = ability.config.speed || 1.5;
    let velocityVector = new Vec3(dx * speed, dy * speed, dz * speed);
    projectile.deltaMovement = velocityVector;
    projectile.spawn();
  }
  boss.persistentData.putInt(key, currentTick);
  level.runCommandSilent(`playsound minecraft:entity.skeleton.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
}

function executeAoeDamage(boss: $LivingEntity, ability: IAoeDamageAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;
  if (currentTick - lastTick < interval) return;
  boss.persistentData.putInt(key, currentTick);
  let radius = ability.config.radius;
  let damage = ability.config.damage;
  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;
    let distXZ = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.z - boss.z, 2));
    if (distXZ > 32) return;
    let dist = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.y - boss.y, 2) + Math.pow(player.z - boss.z, 2));
    if (dist <= radius) {
      player.attack(damage);
      if (ability.config.knockback) {
        let dx = player.x - boss.x;
        let dz = player.z - boss.z;
        let length = Math.sqrt(dx * dx + dz * dz);
        if (length > 0) {
          let knockbackStrength = ability.config.knockback;
          let motionX = (dx / length) * knockbackStrength;
          let motionY = 0.4;
          let motionZ = (dz / length) * knockbackStrength;
          player.deltaMovement = new Vec3(motionX, motionY, motionZ);
        }
      }
    }
  });
  let particleEffect = ability.config.particleEffect || "minecraft:explosion";
  level.runCommandSilent(`particle ${particleEffect} ${boss.x} ${boss.y} ${boss.z} ${radius} 0.5 ${radius} 0 50 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.8`);
}

function executeTeleport(boss: $LivingEntity, ability: ITeleportAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;
  if (currentTick - lastTick < interval) return;
  let targetPlayer = null;
  if (ability.config.toLowHealthPlayer) {
    let lowestHealth = 24 * 24;
    level.players.forEach((player) => {
      if (player.isSpectator() || !player.isAlive()) return;
      let dist = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.z - boss.z, 2));
      if (dist > 32) return;
      if (player.health < lowestHealth) {
        lowestHealth = player.health;
        targetPlayer = player;
      }
    });
  } else {
    let angle = Math.random() * 2 * Math.PI;
    let distance = Math.random() * ability.config.radius;
    let newX = boss.x + distance * Math.cos(angle);
    let newZ = boss.z + distance * Math.sin(angle);
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
    boss.teleportTo(newX, boss.y, newZ);
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
    boss.persistentData.putInt(key, currentTick);
    return;
  }

  if (targetPlayer) {
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
    let offsetX = (Math.random() - 0.5) * 4;
    let offsetZ = (Math.random() - 0.5) * 4;
    boss.teleportTo(targetPlayer.x + offsetX, targetPlayer.y, targetPlayer.z + offsetZ);
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
    let bossName = boss.customName?.getString() || "Boss";
    targetPlayer.sendSystemMessage(Text.red(`§c§l⚠ ${bossName} teleportou para você!`));
  }

  boss.persistentData.putInt(key, currentTick);
}

function executeWeatherChange(boss: $LivingEntity, ability: IWeatherChangeAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter || !ability.config.onEnter) return;
  if (ability.config.weather === "rain") {
    level.runCommandSilent(`weather rain`);
  } else if (ability.config.weather === "thunder") {
    level.runCommandSilent(`weather thunder`);
  } else if (ability.config.weather === "clear") {
    level.runCommandSilent(`weather clear`);
  }

  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a[distance=..64] "§6§l⚡ ${bossName} alterou o clima!"`);
}

function executeEnrage(boss: $LivingEntity, ability: IEnrageAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter) return;
  let config = ability.config;
  if (config.damageMultiplier) {
    let currentDamage = boss.getAttributeBaseValue("minecraft:generic.attack_damage");
    boss.setAttributeBaseValue("minecraft:generic.attack_damage", currentDamage * config.damageMultiplier);
  }
  if (config.speedMultiplier) {
    let currentSpeed = boss.getAttributeBaseValue("minecraft:generic.movement_speed");
    boss.setAttributeBaseValue("minecraft:generic.movement_speed", currentSpeed * config.speedMultiplier);
  }
  if (config.particleEffect) {
    level.runCommandSilent(`particle minecraft:angry_villager ${boss.x} ${boss.y + 2} ${boss.z} 1 1 1 0 20 force @a`);
    level.runCommandSilent(`particle minecraft:lava ${boss.x} ${boss.y + 1} ${boss.z} 1 0.5 1 0 30 force @a`);
  }
  level.runCommandSilent(`playsound minecraft:entity.ravager.roar hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.7`);
  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a[distance=..64] "§4§l☠ ${bossName} Ficou PISTOLA!"`);
}

function executeCrystalPhase(boss: $LivingEntity, ability: ICrystalPhaseAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number): void {
  if (phaseIndex === undefined) return;
  if (isOnEnter) {
    spawnCrystals(boss, ability.config, level, phaseIndex);
    return;
  }
  updateCrystalSystem(boss, ability.config, level, phaseIndex);
}

function spawnCrystals(boss: $LivingEntity, config: ICrystalConfig, level: $ServerLevel, phaseIndex: number): void {
  let bossPos = boss.blockPosition();
  let crystalPositions: any[] = [];
  let angleStep = (2 * Math.PI) / config.crystalCount;
  for (let i = 0; i < config.crystalCount; i++) {
    let angle = angleStep * i;
    let offsetX = Math.cos(angle) * config.distanceFromBoss;
    let offsetZ = Math.sin(angle) * config.distanceFromBoss;
    let crystalX = Math.floor(bossPos.x + offsetX);
    let crystalZ = Math.floor(bossPos.z + offsetZ);
    let crystalY = bossPos.y;
    for (let y = bossPos.y - 5; y <= bossPos.y + 10; y++) {
      let checkPos = new BlockPos(crystalX, y, crystalZ);
      let blockBelow = level.getBlockState(checkPos);
      let blockAt = level.getBlockState(checkPos.above());
      if (!blockBelow.isAir() && blockAt.isAir()) {
        crystalY = y + 1;
        break;
      }
    }

    let finalSpawnY = crystalY + 1;
    level.runCommandSilent(`summon ${config.crystalBlockType} ${crystalX + 0.5} ${finalSpawnY} ${crystalZ + 0.5} {ShowBottom:0b,Invulnerable:0b}`);
    if (config.minionSpawnPerCrystal) {
      config.minionSpawnPerCrystal.forEach((minionConfig) => {
        spawnMinion(level, new BlockPos(crystalX, crystalY, crystalZ), minionConfig);
      });
    }
    if (config.particleEffect) {
      level.runCommandSilent(`particle ${config.particleEffect} ${crystalX + 0.5} ${finalSpawnY + 1} ${crystalZ + 0.5} 0.5 1 0.5 0.1 30 force @a`);
    }
    level.runCommandSilent(`particle minecraft:flash ${crystalX + 0.5} ${finalSpawnY} ${crystalZ + 0.5} 0 0 0 0 1 force @a`);

    crystalPositions.push({
      x: crystalX + 0.5,
      y: finalSpawnY,
      z: crystalZ + 0.5,
      spawnTick: level.server.getTickCount(),
      destroyed: false,
      respawnAt: -1,
      currentBuff: 0 // ✅ Inicializa o buff do cristal
    });
  }
  let centerX = bossPos.x + 0.5;
  let ritualHeight = config.ritualHeight || 4;
  let centerY = bossPos.y + ritualHeight;
  let centerZ = bossPos.z + 0.5;
  boss.teleportTo(centerX, centerY, centerZ);
  boss.persistentData.putBoolean(`phase_${phaseIndex}_inRitual`, true);
  boss.persistentData.putInt(`phase_${phaseIndex}_ritualStartTick`, level.server.getTickCount());
  boss.persistentData.putFloat(`phase_${phaseIndex}_ritualFixedX`, centerX);
  boss.persistentData.putFloat(`phase_${phaseIndex}_ritualFixedY`, centerY);
  boss.persistentData.putFloat(`phase_${phaseIndex}_ritualFixedZ`, centerZ);
  level.runCommandSilent(`execute as ${boss.uuid} run data merge entity @s {NoAI:1b,Invulnerable:1b}`);
  boss.deltaMovement = new Vec3(0, 0, 0);
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${centerX} ${centerY} ${centerZ} 0.5 2 0.5 0.1 100 force @a`);
  level.runCommandSilent(`particle minecraft:portal ${centerX} ${centerY} ${centerZ} 1 1 1 1 200 force @a`);
  boss.persistentData.putString(`phase_${phaseIndex}_crystals`, JSON.stringify(crystalPositions));
  boss.persistentData.putInt(`phase_${phaseIndex}_crystalDamage`, 0);
  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, false);
  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a[distance=..64] "§e§l⚠ Destrua os cristais antes que seja tarde demais!"`);
  level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.8`);
  level.runCommandSilent(`playsound minecraft:block.beacon.activate hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.6`);
}

function updateCrystalSystem(boss: $LivingEntity, config: ICrystalConfig, level: $ServerLevel, phaseIndex: number): void {
  let crystalDataRaw = boss.persistentData.getString(`phase_${phaseIndex}_crystals`);
  if (!crystalDataRaw) return;
  if (boss.persistentData.getBoolean(`phase_${phaseIndex}_crystalsCleared`)) {
    return;
  }
  let crystals: any[] = JSON.parse(crystalDataRaw);
  let totalDamageBuff = boss.persistentData.getInt(`phase_${phaseIndex}_crystalDamage`) || 0;
  let activeCrystals = 0;
  let allDestroyed = true;
  let currentTick = level.server.getTickCount();
  let IMMUNITY_TICKS = 15;
  let inRitual = boss.persistentData.getBoolean(`phase_${phaseIndex}_inRitual`);

  if (inRitual) {
    boss.invulnerable = true;
    boss.setInvulnerable(true);
    boss.deltaMovement = new Vec3(0, 0, 0);
    level.runCommandSilent(`execute as ${boss.uuid} run data merge entity @s {NoAI:1b,Invulnerable:1b}`);
    level.runCommandSilent(`effect give ${boss.uuid} minecraft:resistance 2 255 true`);
    let fixedX = boss.persistentData.getFloat(`phase_${phaseIndex}_ritualFixedX`);
    let fixedY = boss.persistentData.getFloat(`phase_${phaseIndex}_ritualFixedY`);
    let fixedZ = boss.persistentData.getFloat(`phase_${phaseIndex}_ritualFixedZ`);
    if (fixedX !== 0 && fixedY !== 0 && fixedZ !== 0) {
      if (Math.abs(boss.x - fixedX) > 0.1 || Math.abs(boss.y - fixedY) > 0.1 || Math.abs(boss.z - fixedZ) > 0.1) {
        boss.teleportTo(fixedX, fixedY, fixedZ);
      }
    }
    let ritualStartTick = boss.persistentData.getInt(`phase_${phaseIndex}_ritualStartTick`);
    let timeInRitual = currentTick - ritualStartTick;
    let maxRitualTime = config.maxRitualTime || 6000;
    if (timeInRitual >= maxRitualTime) {
      handleRitualTimeout(boss, level, phaseIndex, totalDamageBuff, crystals);
      return;
    }
    if (currentTick % 20 === 0) {
      boss.heal(5);
      level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 1} ${boss.z} 0.5 0.5 0.5 0 3 force @a`);
      level.runCommandSilent(`particle minecraft:witch ${boss.x} ${boss.y} ${boss.z} 0.3 1 0.3 0.05 5 force @a`);
      crystals.forEach((crystal: any) => {
        if (!crystal.destroyed) {
          level.runCommandSilent(`particle minecraft:enchant ${crystal.x} ${crystal.y + 2} ${crystal.z} 0.2 0.5 0.2 0.1 3 force @a`);
        }
      });
    }
  }

  crystals.forEach((crystal: any) => {
    if (!crystal.destroyed) {
      if (currentTick % 10 === 0 || !crystal.hasOwnProperty("cachedActive")) {
        let searchAABB = new AABB(crystal.x - 0.5, crystal.y - 0.5, crystal.z - 0.5, crystal.x + 0.5, crystal.y + 1.5, crystal.z + 0.5);
        let crystalEntities = level.getEntitiesWithin(searchAABB);
        let found = false;
        for (let entity of crystalEntities) {
          let entityType = entity.type.toString();
          if (entityType === "minecraft:end_crystal" || entityType === "end_crystal") {
            found = true;
            break;
          }
        }
        crystal.cachedActive = found;
      }
    }

    let isActive = crystal.cachedActive !== false;

    if (!crystal.destroyed && !isActive) {
      if (currentTick - crystal.spawnTick < IMMUNITY_TICKS) {
        activeCrystals++;
        allDestroyed = false;
        return;
      }
      crystal.destroyed = true;
      crystal.respawnAt = config.respawnTime ? currentTick + config.respawnTime : -1;
      level.runCommandSilent(`particle minecraft:explosion ${crystal.x} ${crystal.y} ${crystal.z} 1 1 1 0 10 force @a`);
      level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a[distance=..64] ${crystal.x} ${crystal.y} ${crystal.z} 1 1.2`);
      let destroyedCount = crystals.filter((c: any) => c.destroyed).length;
      level.runCommandSilent(`execute positioned ${crystal.x} ${crystal.y} ${crystal.z} run tellraw @a[distance=..64] "§a§l✓ Cristal destruído! (${destroyedCount}/${crystals.length})"`);
    }

    if (crystal.destroyed && crystal.respawnAt > 0 && currentTick >= crystal.respawnAt) {
      level.runCommandSilent(`summon ${config.crystalBlockType} ${crystal.x} ${crystal.y} ${crystal.z} {ShowBottom:0b,Invulnerable:0b}`);
      crystal.destroyed = false;
      crystal.spawnTick = currentTick;
      crystal.cachedActive = true;
      level.runCommandSilent(`particle minecraft:flash ${crystal.x} ${crystal.y} ${crystal.z} 0 0 0 0 1 force @a`);
      level.runCommandSilent(`playsound minecraft:block.beacon.activate hostile @a[distance=..64] ${crystal.x} ${crystal.y} ${crystal.z} 1 1`);
      level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚠ Um cristal renasceu!"`);
    }

    if (!crystal.destroyed && isActive) {
      let ticksAlive = currentTick - crystal.spawnTick;
      activeCrystals++;
      allDestroyed = false;

      if (inRitual) {
        if (currentTick % 10 === 0) {
          let steps = 10;
          for (let step = 0; step <= steps; step++) {
            let t = step / steps;
            let x = boss.x + (crystal.x - boss.x) * t;
            let y = boss.y + (crystal.y - boss.y) * t;
            let z = boss.z + (crystal.z - boss.z) * t;
            level.runCommandSilent(`particle minecraft:end_rod ${x} ${y} ${z} 0 0 0 0 1 force @a`);
          }
        }
      }

      if (ticksAlive % 20 === 0) {
        let buffThisCrystal = Math.floor((ticksAlive + 20) / 20) * config.damageBuffPerSecond;
        buffThisCrystal = Math.min(buffThisCrystal, config.maxDamageBuff);
        crystal.currentBuff = buffThisCrystal;
      }

      if (ticksAlive % 40 === 0 && config.particleEffect) {
        level.runCommandSilent(`particle ${config.particleEffect} ${crystal.x} ${crystal.y + 1} ${crystal.z} 0.3 0.5 0.3 0.05 5 force @a`);
      }

      if (config.protectionRadius && ticksAlive % 20 === 0) {
        let radiusSqr = config.protectionRadius * config.protectionRadius;
        level.players.forEach((player) => {
          if (player.isSpectator() || !player.isAlive()) return;
          let distSqr = Math.pow(player.x - crystal.x, 2) + Math.pow(player.y - crystal.y, 2) + Math.pow(player.z - crystal.z, 2);
          if (distSqr <= radiusSqr) {
            player.attack(2);
            level.runCommandSilent(`particle minecraft:damage_indicator ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0 3 force @a`);
          }
        });
      }
    }
  });

  totalDamageBuff = 0;
  crystals.forEach((crystal: any) => {
    if (!crystal.destroyed && crystal.currentBuff) {
      totalDamageBuff += crystal.currentBuff;
    }
  });

  totalDamageBuff = Math.min(totalDamageBuff, config.maxDamageBuff * config.crystalCount);
  boss.persistentData.putInt(`phase_${phaseIndex}_crystalDamage`, totalDamageBuff);
  boss.persistentData.putString(`phase_${phaseIndex}_crystals`, JSON.stringify(crystals));

  let baseDamageKey = `phase_${phaseIndex}_baseDamage`;
  if (!boss.persistentData.contains(baseDamageKey)) {
    boss.persistentData.putFloat(baseDamageKey, boss.getAttributeBaseValue("minecraft:generic.attack_damage"));
  }

  let baseDamage = boss.persistentData.getFloat(baseDamageKey);
  boss.setAttributeBaseValue("minecraft:generic.attack_damage", baseDamage + totalDamageBuff);

  if (allDestroyed) {
    handleAllCrystalsDestroyed(boss, level, phaseIndex, totalDamageBuff);
  }

  if (activeCrystals > 0 && currentTick % 100 === 0) {
    level.runCommandSilent(
      `execute positioned ${boss.x} ${boss.y} ${boss.z} run title @a[distance=..64] actionbar {"text":"⚡ Cristais Ativos: ${activeCrystals} | Dano Extra: +${totalDamageBuff.toFixed(
        1
      )}","color":"red","bold":true}`
    );
  }
}

function handleRitualTimeout(boss: $LivingEntity, level: $ServerLevel, phaseIndex: number, totalDamageBuff: number, crystals: any[]): void {
  let bossName = boss.customName?.getString() || "Boss";
  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, true);
  boss.persistentData.putBoolean(`phase_${phaseIndex}_inRitual`, false);
  level.runCommandSilent(`execute as ${boss.uuid} run data merge entity @s {NoAI:0b,Invulnerable:0b}`);
  level.runCommandSilent(`effect clear ${boss.uuid} minecraft:resistance`);
  boss.invulnerable = false;
  boss.setInvulnerable(false);
  let currentPos = boss.blockPosition();
  let groundY = currentPos.y;
  for (let y = currentPos.y; y >= currentPos.y - 10; y--) {
    let checkPos = new BlockPos(currentPos.x, y, currentPos.z);
    let blockAt = level.getBlockState(checkPos);
    if (!blockAt.isAir()) {
      groundY = y + 1;
      break;
    }
  }
  boss.teleportTo(boss.x, groundY, boss.z);
  crystals.forEach((crystal: any) => {
    if (!crystal.destroyed) {
      level.runCommandSilent(`execute positioned ${crystal.x} ${crystal.y} ${crystal.z} run kill @e[type=minecraft:end_crystal,distance=..2]`);
    }
  });
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 3 2 3 0 15 force @a[distance=..64]`);
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${boss.x} ${boss.y} ${boss.z} 2 2 2 0.2 100 force @a[distance=..64]`);
  level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.6`);
  level.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.8`);
  level.runCommandSilent(`tellraw @a[distance=..64] "§4§l⚠ RITUAL COMPLETADO!"`);
  level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚔ ${bossName} absorveu todo o poder dos cristais! (+${totalDamageBuff.toFixed(1)} dano)"`);
  level.runCommandSilent(`title @a times 10 60 10`);
  level.runCommandSilent(`title @a title {"text":"RITUAL COMPLETADO","color":"dark_red","bold":true}`);
  level.runCommandSilent(`title @a subtitle {"text":"Boss está ULTRA PODEROSO!","color":"red"}`);
}

function handleAllCrystalsDestroyed(boss: $LivingEntity, level: $ServerLevel, phaseIndex: number, damageAccumulated: number): void {
  if (boss.persistentData.getBoolean(`phase_${phaseIndex}_crystalsCleared`)) return;
  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, true);
  let bossName = boss.customName?.getString() || "Boss";
  boss.persistentData.putBoolean(`phase_${phaseIndex}_inRitual`, false);
  level.runCommandSilent(`execute as ${boss.uuid} run data merge entity @s {NoAI:0b,Invulnerable:0b}`);
  level.runCommandSilent(`effect clear ${boss.uuid} minecraft:resistance`);
  boss.invulnerable = false;
  boss.setInvulnerable(false);
  let currentPos = boss.blockPosition();
  let groundY = currentPos.y;
  for (let y = currentPos.y; y >= currentPos.y - 10; y--) {
    let checkPos = new BlockPos(currentPos.x, y, currentPos.z);
    let blockAt = level.getBlockState(checkPos);
    if (!blockAt.isAir()) {
      groundY = y + 1;
      break;
    }
  }
  boss.teleportTo(boss.x, groundY, boss.z);
  level.runCommandSilent(`particle minecraft:explosion ${boss.x} ${groundY} ${boss.z} 2 0.5 2 0 20 force @a[distance=..64]`);
  level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a[distance=..64] ${boss.x} ${groundY} ${boss.z} 1 0.8`);
  let baseDamageKey = `phase_${phaseIndex}_baseDamage`;
  let originalBaseDamage = boss.persistentData.getFloat(baseDamageKey) || 1.0;
  boss.setAttributeBaseValue("minecraft:generic.attack_damage", originalBaseDamage);
  if (damageAccumulated > 0) {
    let damageToApply = damageAccumulated * 5;
    boss.attack(damageToApply);
    level.runCommandSilent(`tellraw @a[distance=..64] "§a§l✓ Todos os cristais foram destruídos!"`);
    level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚔ ${bossName} recebeu ${damageToApply.toFixed(0)} de dano pelos cristais ativos!"`);
  } else {
    level.runCommandSilent(`tellraw @a[distance=..64] "§a§l✓ Cristais destruídos rapidamente! Boss não recebeu buff!"`);
  }
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 2 2 2 0 10 force @a[distance=..64]`);
  level.runCommandSilent(`playsound minecraft:entity.wither.break_block hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.5`);
}

function executeProjectileRain(boss: $LivingEntity, ability: IProjectileRainAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let warningKey = `phase_${phaseIndex}_ability_${abilityIndex}_warning`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;
  let warningDataRaw = boss.persistentData.getString(warningKey);
  let config = ability.config;
  let warningTime = config.warningTime || 0;
  if (warningDataRaw) {
    let timeSinceWarning = currentTick - lastTick;
    if (timeSinceWarning >= warningTime) {
      cleanupOldProjectiles(level, boss, config.projectileType);
      let targets = JSON.parse(warningDataRaw);
      targets.forEach((target: any) => {
        spawnProjectileRain(level, config, target.x, target.y, target.z);
      });
      boss.persistentData.remove(warningKey);
      level.runCommandSilent(`playsound minecraft:entity.arrow.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 2 1`);
    }
    return;
  }
  if (currentTick - lastTick < interval) return;
  boss.persistentData.putInt(key, currentTick);
  let targets = getProjectileRainTargets(boss, level, config);
  if (warningTime > 0) {
    boss.persistentData.putString(warningKey, JSON.stringify(targets));
    let particleType = config.warningParticle || "minecraft:flame";
    targets.forEach((target) => {
      level.runCommandSilent(`particle ${particleType} ${target.x} ${target.y + 0.5} ${target.z} 0.3 0 0.3 0 5 force @a`);
    });
    level.runCommandSilent(`playsound minecraft:block.note_block.bell hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.5`);
  } else {
    cleanupOldProjectiles(level, boss, config.projectileType);
    targets.forEach((target) => {
      spawnProjectileRain(level, config, target.x, target.y, target.z);
    });
    level.runCommandSilent(`playsound minecraft:entity.arrow.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 2 1`);
  }
}

function getProjectileRainTargets(boss: $LivingEntity, level: $ServerLevel, config: IProjectileRainAbility["config"]): Array<{ x: number; y: number; z: number }> {
  let targets: Array<{ x: number; y: number; z: number }> = [];
  let pattern = config.spreadPattern || "random";

  switch (config.targetMode) {
    case "players":
      level.players.forEach((player) => {
        if (player.isSpectator() || !player.isAlive()) return;

        let dist = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.z - boss.z, 2));
        if (dist > 32) return;

        for (let i = 0; i < config.projectileCount; i++) {
          let angle = Math.random() * 2 * Math.PI;
          let distance = Math.sqrt(Math.random()) * config.radius;
          let offsetX = Math.cos(angle) * distance;
          let offsetZ = Math.sin(angle) * distance;
          targets.push({
            x: player.x + offsetX,
            y: player.y,
            z: player.z + offsetZ
          });
        }
      });
      break;

    case "boss":
      if (pattern === "circle") {
        let rings = Math.ceil(config.projectileCount / 8);
        for (let ring = 0; ring < rings; ring++) {
          let ringRadius = (config.radius / rings) * (ring + 1);
          let pointsInRing = Math.max(8, ring * 8);
          let angleStep = (2 * Math.PI) / pointsInRing;
          for (let i = 0; i < pointsInRing && targets.length < config.projectileCount; i++) {
            let angle = angleStep * i;
            let x = boss.x + Math.cos(angle) * ringRadius;
            let z = boss.z + Math.sin(angle) * ringRadius;
            targets.push({ x: x, y: boss.y, z: z });
          }
        }
      } else if (pattern === "grid") {
        let gridSize = Math.ceil(Math.sqrt(config.projectileCount));
        let spacing = (config.radius * 2) / gridSize;
        let startX = boss.x - config.radius;
        let startZ = boss.z - config.radius;
        for (let i = 0; i < gridSize; i++) {
          for (let j = 0; j < gridSize; j++) {
            if (targets.length >= config.projectileCount) break;
            targets.push({
              x: startX + i * spacing,
              y: boss.y,
              z: startZ + j * spacing
            });
          }
        }
      } else {
        for (let i = 0; i < config.projectileCount; i++) {
          let angle = Math.random() * 2 * Math.PI;
          let distance = Math.random() * config.radius;
          let x = boss.x + Math.cos(angle) * distance;
          let z = boss.z + Math.sin(angle) * distance;
          targets.push({ x: x, y: boss.y, z: z });
        }
      }
      break;

    case "random":
    default:
      for (let i = 0; i < config.projectileCount; i++) {
        let angle = Math.random() * 2 * Math.PI;
        let distance = Math.random() * config.radius;
        let x = boss.x + Math.cos(angle) * distance;
        let z = boss.z + Math.sin(angle) * distance;
        targets.push({ x: x, y: boss.y, z: z });
      }
      break;
  }

  return targets;
}

function spawnProjectileRain(level: $ServerLevel, config: IProjectileRainAbility["config"], x: number, y: number, z: number): void {
  let fallHeight = config.fallHeight || 20;
  let spawnY = y + fallHeight;
  let groundY = y;
  for (let checkY = y; checkY >= y - 10; checkY--) {
    let checkPos = new BlockPos(Math.floor(x), checkY, Math.floor(z));
    let blockState = level.getBlockState(checkPos);
    if (!blockState.isAir()) {
      groundY = checkY + 1;
      break;
    }
  }
  let projectile = level.createEntity(config.projectileType);
  if (!projectile) {
    console.warn(`[PROJECTILE RAIN] Falha ao criar projétil: ${config.projectileType}`);
    return;
  }
  projectile.setPos(x, spawnY, z);
  projectile.deltaMovement = new Vec3(0, -1.5, 0);
  if (config.damage && projectile.nbt) {
    projectile.nbt.putDouble("damage", config.damage);
  }
  projectile.persistentData.putBoolean("kubejs_rain_projectile", true);
  projectile.persistentData.putInt("kubejs_rain_spawnTick", level.server.getTickCount());
  projectile.spawn();
}

function cleanupOldProjectiles(level: $ServerLevel, boss: $LivingEntity, projectileType: string): void {
  let currentTick = level.server.getTickCount();
  let maxAge = 100;
  let searchRadius = 50;

  let searchAABB = new AABB(boss.x - searchRadius, boss.y - 20, boss.z - searchRadius, boss.x + searchRadius, boss.y + 50, boss.z + searchRadius);

  let entities = level.getEntitiesWithin(searchAABB);
  let cleaned = 0;

  entities.forEach((entity) => {
    let entityType = entity.type.toString();
    if (!entityType.includes(projectileType.split(":")[1])) return;
    if (!entity.persistentData.getBoolean("kubejs_rain_projectile")) return;
    let spawnTick = entity.persistentData.getInt("kubejs_rain_spawnTick") || 0;
    let age = currentTick - spawnTick;
    if (age >= maxAge) {
      entity.kill();
      cleaned++;
    }
  });

  if (cleaned > 0) {
    console.log(`[PROJECTILE RAIN] Limpou ${cleaned} projéteis antigos`);
  }
}

function updateProjectileRainWarnings(boss: $LivingEntity, phase: IBossPhase, level: $ServerLevel, phaseIndex: number, currentTick: number): void {
  phase.abilities.forEach((ability, abilityIndex) => {
    if (ability.type !== "projectile_rain") return;

    let rainAbility = ability as IProjectileRainAbility;
    if (!rainAbility.config.warningTime) return;

    let warningKey = `phase_${phaseIndex}_ability_${abilityIndex}_warning`;
    let warningDataRaw = boss.persistentData.getString(warningKey);

    if (!warningDataRaw) return;

    let targets = JSON.parse(warningDataRaw);
    let lastTick = boss.persistentData.getInt(`phase_${phaseIndex}_ability_${abilityIndex}_lastTick`);
    let elapsed = currentTick - lastTick;
    let warningTime = rainAbility.config.warningTime;

    if (elapsed % 5 === 0 && elapsed < warningTime) {
      let particleType = rainAbility.config.warningParticle || "minecraft:flame";
      targets.forEach((target: any) => {
        level.runCommandSilent(`particle ${particleType} ${target.x} ${target.y} ${target.z} 0.3 0 0.3 0 3 force @a`);
      });
    }

    if (elapsed >= warningTime) {
      targets.forEach((target: any) => {
        spawnProjectileRain(level, rainAbility.config, target.x, target.y, target.z);
      });
      boss.persistentData.remove(warningKey);
      level.runCommandSilent(`playsound minecraft:entity.arrow.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 2 1`);
    }
  });
}

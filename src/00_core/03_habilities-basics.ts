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

  let isBloodMod = ability.config.projectileType.includes("irons_spellbooks:");
  console.log(`[MSMP] Atirando projétil do tipo ${ability.config.projectileType} em ${nearestPlayer.getName().getString()}`);
  if (isBloodMod) {
    level.runCommandSilent(`execute as ${boss.stringUuid} at @s run tp @s ~ ~ ~ facing entity ${nearestPlayer.stringUuid} eyes`);
    level.runCommandSilent(`cast ${boss.stringUuid} blood_slash`);
    boss.persistentData.putInt(key, currentTick);
    return;
  }

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

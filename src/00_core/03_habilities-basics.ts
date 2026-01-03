import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Player } from "net.minecraft.world.entity.player.Player";

function executeSummonMinions(boss: $LivingEntity, ability: ISummonMinionsAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  let config = ability.config;
  let minions = config.minions;

  if (isOnEnter && config.onEnter) {
    for (let i = 0; i < minions.length; i++) {
      spawnMinion(level, boss.blockPosition(), minions[i]);
    }
    return;
  }

  if (!isOnEnter && config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let data = boss.persistentData;
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    let lastTick = data.getInt(key) || 0;

    if (currentTick - lastTick >= config.periodic.intervalTicks) {
      for (let i = 0; i < minions.length; i++) {
        spawnMinion(level, boss.blockPosition(), minions[i]);
      }
      data.putInt(key, currentTick);

      let bossName = boss.customName ? boss.customName.getString() : "Boss";
      let message = Text.of(`§c§l⚔ ${bossName} invocou reforços!`);

      level.players.forEach((player) => {
        if (player.distanceToSqr(boss) <= 4096) {
          player.tell(message);
        }
      });
    }
  }
}

function executeHeal(boss: $LivingEntity, ability: IHealAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  const config = ability.config;
  let healAmount = 0;
  let shouldHeal = false;
  let data = boss.persistentData;

  if (isOnEnter && config.onEnter) {
    healAmount = config.amount || boss.maxHealth * (config.percentage || 0);
    shouldHeal = true;
  } else if (!isOnEnter && config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    if (currentTick - data.getInt(key) >= config.periodic.intervalTicks) {
      healAmount = config.periodic.amount;
      data.putInt(key, currentTick);
      shouldHeal = true;
    }
  }

  if (shouldHeal && healAmount > 0) {
    boss.heal(healAmount);

    level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 1.5} ${boss.z} 0.5 0.5 0.5 0 5 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.player.levelup master @a ${boss.x} ${boss.y} ${boss.z} 1 0.8`);

    if (isOnEnter) {
      let bossName = boss.customName ? boss.customName.getString() : "Boss";
      let msg = Text.of(`§a§l+ ${bossName} se curou em ${healAmount.toFixed(0)} HP!`);
      level.players.forEach((p) => {
        if (p.distanceToSqr(boss) <= 4096) p.tell(msg);
      });
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

  let data = boss.persistentData;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = data.getInt(key) || 0;

  if (currentTick - lastTick < ability.config.intervalTicks) return;

  let nearestPlayer = level.getNearestPlayer(boss, 32);
  if (!nearestPlayer || !nearestPlayer.isAlive()) return;

  let count = ability.config.count || 1;
  let spread = (ability.config.spread || 0) * 0.1;
  let speed = ability.config.speed || 1.5;

  for (let i = 0; i < count; i++) {
    let projectile = level.createEntity(ability.config.projectileType);
    if (!projectile) continue;

    projectile.setPos(boss.x, boss.y + boss.eyeHeight, boss.z);

    let dx = nearestPlayer.x - boss.x;
    let dy = nearestPlayer.y + nearestPlayer.eyeHeight * 0.8 - (boss.y + boss.eyeHeight);
    let dz = nearestPlayer.z - boss.z;

    let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (distance > 0) {
      dx /= distance;
      dy /= distance;
      dz /= distance;
    }

    if (spread > 0) {
      dx += (Math.random() - 0.5) * spread;
      dy += (Math.random() - 0.5) * spread;
      dz += (Math.random() - 0.5) * spread;
    }

    projectile.setMotion(dx * speed, dy * speed, dz * speed);
    if (projectile.getType().includes("fireball")) {
      projectile.mergeNbt({
        xPower: dx * 0.1,
        yPower: dy * 0.1,
        zPower: dz * 0.1
      });
    }

    projectile.yaw = Math.atan2(dz, dx) * (180 / Math.PI) - 90;
    projectile.pitch = -(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI));
    projectile.spawn();
  }

  data.putInt(key, currentTick);
  level.runCommandSilent(`playsound minecraft:entity.skeleton.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
}

function executeAoeDamage(boss: $LivingEntity, ability: IAoeDamageAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  if (currentTick - boss.persistentData.getInt(key) < ability.config.intervalTicks) return;
  boss.persistentData.putInt(key, currentTick);

  let radius = ability.config.radius;
  let radiusSqr = radius * radius;
  let damage = ability.config.damage;

  // Filtra apenas jogadores no raio (Muito mais rápido que iterar todos do mundo)
  level.getPlayers().forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;

    if (boss.distanceToSqr(player) <= radiusSqr) {
      player.attack(damage);

      if (ability.config.knockback) {
        let knockback = ability.config.knockback;
        let dx = player.x - boss.x;
        let dz = player.z - boss.z;
        let res = Math.sqrt(dx * dx + dz * dz);
        if (res > 0) {
          player.addDeltaMovement(new Vec3((dx / res) * knockback, 0.4, (dz / res) * knockback));
          player.hurtMarked = true;
        }
      }
    }
  });

  let particleEffect = ability.config.particleEffect || "explosion_emitter";
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

function executeCastSpell(boss: $LivingEntity, ability: ICastSpellAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;
  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;
  if (currentTick - lastTick < interval) return;
  let config = ability.config;
  let range = config.range || 30;
  let castCount = config.castCount || 1;
  let targets: $Player[] = [];

  switch (config.targetMode) {
    case "nearest_player":
      let nearestPlayer = null;
      let minDistance = range * range;
      level.players.forEach((player) => {
        if (player.isSpectator() || !player.isAlive()) return;
        let distSqr = boss.distanceToSqr(player);
        if (distSqr < minDistance) {
          if (config.requiresLineOfSight && !boss.hasLineOfSight(player)) return;
          minDistance = distSqr;
          nearestPlayer = player;
        }
      });

      if (nearestPlayer) targets.push(nearestPlayer);
      break;

    case "all_players":
      level.players.forEach((player) => {
        if (player.isSpectator() || !player.isAlive()) return;
        let dist = Math.sqrt(boss.distanceToSqr(player));
        if (dist <= range) {
          if (!config.requiresLineOfSight || boss.hasLineOfSight(player)) {
            targets.push(player);
          }
        }
      });
      break;

    case "random_nearby":
      let nearbyPlayers: $Player[] = [];
      level.players.forEach((player) => {
        if (player.isSpectator() || !player.isAlive()) return;
        let dist = Math.sqrt(boss.distanceToSqr(player));
        if (dist <= range) {
          if (!config.requiresLineOfSight || boss.hasLineOfSight(player)) {
            nearbyPlayers.push(player);
          }
        }
      });
      if (nearbyPlayers.length > 0) {
        let randomIndex = Math.floor(Math.random() * nearbyPlayers.length);
        targets.push(nearbyPlayers[randomIndex]);
      }
      break;

    case "self":
      targets = [];
      break;
  }

  for (let i = 0; i < castCount; i++) {
    if (config.targetMode === "self") {
      level.runCommandSilent(`execute as ${boss.stringUuid} at @s run cast ${boss.stringUuid} ${config.spellId}`);
    } else if (targets.length > 0) {
      targets.forEach((target: $Player) => {
        level.runCommandSilent(`execute as ${boss.stringUuid} at @s facing entity ${target.stringUuid} eyes run cast ${boss.stringUuid} ${config.spellId}`);
      });
    } else {
      level.runCommandSilent(`execute as ${boss.stringUuid} at @s run cast ${boss.stringUuid} ${config.spellId}`);
    }
  }

  boss.persistentData.putInt(key, currentTick);
  if (config.soundEffectPath) {
    level.runCommandSilent(`playsound ${config.soundEffectPath} hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
  }
}

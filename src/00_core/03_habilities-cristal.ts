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

    let barrierY = finalSpawnY - 1;
    for (let y = 0; y < 4; y++) {
      let currentY = barrierY + y;
      // Parede Norte (Z-2)
      level.runCommandSilent(`fill ${crystalX - 2} ${currentY} ${crystalZ - 2} ${crystalX + 2} ${currentY} ${crystalZ - 2} minecraft:iron_bars`);
      // Parede Sul (Z+2)
      level.runCommandSilent(`fill ${crystalX - 2} ${currentY} ${crystalZ + 2} ${crystalX + 2} ${currentY} ${crystalZ + 2} minecraft:iron_bars`);
      // Parede Oeste (X-2)
      level.runCommandSilent(`fill ${crystalX - 2} ${currentY} ${crystalZ - 1} ${crystalX - 2} ${currentY} ${crystalZ + 1} minecraft:iron_bars`);
      // Parede Leste (X+2)
      level.runCommandSilent(`fill ${crystalX + 2} ${currentY} ${crystalZ - 1} ${crystalX + 2} ${currentY} ${crystalZ + 1} minecraft:iron_bars`);
    }
    level.runCommandSilent(`fill ${crystalX - 2} ${barrierY + 3} ${crystalZ - 2} ${crystalX + 2} ${barrierY + 3} ${crystalZ + 2} minecraft:iron_bars`);

    crystalPositions.push({
      x: crystalX + 0.5,
      y: finalSpawnY,
      z: crystalZ + 0.5,
      blockX: crystalX,
      blockZ: crystalZ,
      barrierY: barrierY,
      spawnTick: level.server.getTickCount(),
      destroyed: false,
      respawnAt: -1,
      currentBuff: 0
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

      if (crystal.blockX !== undefined && crystal.blockZ !== undefined && crystal.barrierY !== undefined) {
        let bx = crystal.blockX;
        let bz = crystal.blockZ;
        let by = crystal.barrierY;
        level.runCommandSilent(`fill ${bx - 2} ${by} ${bz - 2} ${bx + 2} ${by + 3} ${bz + 2} minecraft:air replace minecraft:iron_bars`);
      }

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

      // Recriar barreira quando cristal respawna (cubo 5x5x4 completo)
      if (crystal.blockX !== undefined && crystal.blockZ !== undefined && crystal.barrierY !== undefined) {
        let bx = crystal.blockX;
        let bz = crystal.blockZ;
        let by = crystal.barrierY;
        for (let y = 0; y < 4; y++) {
          let currentY = by + y;
          level.runCommandSilent(`fill ${bx - 2} ${currentY} ${bz - 2} ${bx + 2} ${currentY} ${bz - 2} minecraft:iron_bars`);
          level.runCommandSilent(`fill ${bx - 2} ${currentY} ${bz + 2} ${bx + 2} ${currentY} ${bz + 2} minecraft:iron_bars`);
          level.runCommandSilent(`fill ${bx - 2} ${currentY} ${bz - 1} ${bx - 2} ${currentY} ${bz + 1} minecraft:iron_bars`);
          level.runCommandSilent(`fill ${bx + 2} ${currentY} ${bz - 1} ${bx + 2} ${currentY} ${bz + 1} minecraft:iron_bars`);
        }
        // Fechar o topo
        level.runCommandSilent(`fill ${bx - 2} ${by + 3} ${bz - 2} ${bx + 2} ${by + 3} ${bz + 2} minecraft:iron_bars`);
      }

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

      // Calcular progresso baseado no tempo TOTAL do ritual, não do cristal individual
      let ritualStartTick = boss.persistentData.getInt(`phase_${phaseIndex}_ritualStartTick`);
      let timeInRitual = currentTick - ritualStartTick;
      let maxTime = config.maxRitualTime || 3600;
      let timeProgress = timeInRitual / maxTime;

      let accelerationMultiplier = 1.0;
      let maxBuffMultiplier = 1.0;

      if (timeProgress < 0.25) {
        accelerationMultiplier = 0.5;
        maxBuffMultiplier = 1.0;
      } else if (timeProgress < 0.5) {
        accelerationMultiplier = 1.0;
        maxBuffMultiplier = 1.25;
      } else if (timeProgress < 0.75) {
        accelerationMultiplier = 1.5;
        maxBuffMultiplier = 1.5;
      } else {
        accelerationMultiplier = 2.0;
        maxBuffMultiplier = 2.0;
      }

      let secondsAlive = Math.floor(ticksAlive / 20);
      let buffThisCrystal = secondsAlive * config.damageBuffPerSecond * accelerationMultiplier;
      let maxAllowed = config.maxDamageBuff * maxBuffMultiplier;
      buffThisCrystal = Math.min(buffThisCrystal, maxAllowed);
      crystal.currentBuff = buffThisCrystal;

      // Salvar o multiplicador atual para usar no cálculo total
      boss.persistentData.putFloat(`phase_${phaseIndex}_currentMaxBuffMultiplier`, maxBuffMultiplier);

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
    if (crystal.currentBuff) {
      if (!crystal.destroyed) {
        totalDamageBuff += crystal.currentBuff;
      } else {
        totalDamageBuff += crystal.currentBuff * 0.25;
      }
    }
  });
  let currentMaxBuffMultiplier = boss.persistentData.getFloat(`phase_${phaseIndex}_currentMaxBuffMultiplier`) || 1.0;
  let maxTotalBuff = config.maxDamageBuff * config.crystalCount * currentMaxBuffMultiplier;
  totalDamageBuff = Math.min(totalDamageBuff, maxTotalBuff);
  boss.persistentData.putInt(`phase_${phaseIndex}_crystalDamage`, totalDamageBuff);
  boss.persistentData.putString(`phase_${phaseIndex}_crystals`, JSON.stringify(crystals));
  let baseDamageKey = `phase_${phaseIndex}_baseDamage`;
  let baseSpeedKey = `phase_${phaseIndex}_baseSpeed`;
  let baseArmorKey = `phase_${phaseIndex}_baseArmor`;
  if (!boss.persistentData.contains(baseDamageKey)) {
    boss.persistentData.putFloat(baseDamageKey, boss.getAttributeBaseValue("minecraft:generic.attack_damage"));
    boss.persistentData.putFloat(baseSpeedKey, boss.getAttributeBaseValue("minecraft:generic.movement_speed"));
    boss.persistentData.putFloat(baseArmorKey, boss.getAttributeBaseValue("minecraft:generic.armor"));
  }
  let baseDamage = boss.persistentData.getFloat(baseDamageKey);
  let baseSpeed = boss.persistentData.getFloat(baseSpeedKey);
  let baseArmor = boss.persistentData.getFloat(baseArmorKey);
  boss.setAttributeBaseValue("minecraft:generic.attack_damage", baseDamage + totalDamageBuff);
  let speedMultiplier = 1 + Math.min(totalDamageBuff * 0.005, 0.5);
  boss.setAttributeBaseValue("minecraft:generic.movement_speed", baseSpeed * speedMultiplier);
  let armorBonus = totalDamageBuff * 0.1;
  boss.setAttributeBaseValue("minecraft:generic.armor", baseArmor + armorBonus);
  if (allDestroyed) {
    handleAllCrystalsDestroyed(boss, level, phaseIndex, totalDamageBuff);
  }
  if (activeCrystals > 0 && currentTick % 100 === 0) {
    let speedBonus = ((speedMultiplier - 1) * 100).toFixed(0);
    let armorBonus = (totalDamageBuff * 0.1).toFixed(1);
    level.runCommandSilent(
      `execute positioned ${boss.x} ${boss.y} ${boss.z} run title @a[distance=..64] actionbar {"text":"⚡ Cristais: ${activeCrystals} | Dano: +${totalDamageBuff.toFixed(
        1
      )} | Speed: +${speedBonus}% | Armor: +${armorBonus}","color":"red","bold":true}`
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

  // Remover cristais e barreiras
  crystals.forEach((crystal: any) => {
    if (!crystal.destroyed) {
      level.runCommandSilent(`execute positioned ${crystal.x} ${crystal.y} ${crystal.z} run kill @e[type=minecraft:end_crystal,distance=..2]`);
    }
    // Remover barreiras (5x5x4)
    if (crystal.blockX !== undefined && crystal.blockZ !== undefined && crystal.barrierY !== undefined) {
      let bx = crystal.blockX;
      let bz = crystal.blockZ;
      let by = crystal.barrierY;
      level.runCommandSilent(`fill ${bx - 2} ${by} ${bz - 2} ${bx + 2} ${by + 3} ${bz + 2} minecraft:air replace minecraft:iron_bars`);
    }
  });
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 3 2 3 0 15 force @a[distance=..64]`);
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${boss.x} ${boss.y} ${boss.z} 2 2 2 0.2 100 force @a[distance=..64]`);
  level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.6`);
  level.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.8`);
  level.runCommandSilent(`tellraw @a[distance=..64] "§4§l⚠ RITUAL COMPLETADO!"`);
  level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚔ ${bossName} absorveu todo o poder dos cristais! (+${totalDamageBuff.toFixed(1)} dano)"`);
  // Títulos apenas para players num raio de 64 blocos
  level.runCommandSilent(`execute positioned ${boss.x} ${boss.y} ${boss.z} run title @a[distance=..64] times 10 60 10`);
  level.runCommandSilent(`execute positioned ${boss.x} ${boss.y} ${boss.z} run title @a[distance=..64] title {"text":"RITUAL COMPLETADO","color":"dark_red","bold":true}`);
  level.runCommandSilent(`execute positioned ${boss.x} ${boss.y} ${boss.z} run title @a[distance=..64] subtitle {"text":"Boss está ULTRA PODEROSO!","color":"red"}`);
}

function handleAllCrystalsDestroyed(boss: $LivingEntity, level: $ServerLevel, phaseIndex: number, damageAccumulated: number): void {
  if (boss.persistentData.getBoolean(`phase_${phaseIndex}_crystalsCleared`)) return;
  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, true);

  let crystalDataRaw = boss.persistentData.getString(`phase_${phaseIndex}_crystals`);
  if (crystalDataRaw) {
    let crystals = JSON.parse(crystalDataRaw);
    crystals.forEach((crystal: any) => {
      if (crystal.blockX !== undefined && crystal.blockZ !== undefined && crystal.barrierY !== undefined) {
        let bx = crystal.blockX;
        let bz = crystal.blockZ;
        let by = crystal.barrierY;
        level.runCommandSilent(`fill ${bx - 2} ${by} ${bz - 2} ${bx + 2} ${by + 3} ${bz + 2} minecraft:air replace minecraft:iron_bars`);
      }
    });
  }

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
  let baseSpeedKey = `phase_${phaseIndex}_baseSpeed`;
  let baseArmorKey = `phase_${phaseIndex}_baseArmor`;

  let originalBaseDamage = boss.persistentData.getFloat(baseDamageKey) || 1.0;
  let originalBaseSpeed = boss.persistentData.getFloat(baseSpeedKey) || 0.25;
  let originalBaseArmor = boss.persistentData.getFloat(baseArmorKey) || 0.0;

  boss.setAttributeBaseValue("minecraft:generic.attack_damage", originalBaseDamage);
  boss.setAttributeBaseValue("minecraft:generic.movement_speed", originalBaseSpeed);
  boss.setAttributeBaseValue("minecraft:generic.armor", originalBaseArmor);
  if (damageAccumulated > 0) {
    boss.attack(damageAccumulated);
    level.runCommandSilent(`tellraw @a[distance=..64] "§a§l✓ Todos os cristais foram destruídos!"`);
    level.runCommandSilent(`tellraw @a[distance=..64] "§c§l⚔ ${bossName} recebeu ${damageAccumulated.toFixed(1)} de dano pelos cristais ativos!"`);
  } else {
    level.runCommandSilent(`tellraw @a[distance=..64] "§a§l✓ Cristais destruídos rapidamente! Boss não recebeu buff!"`);
  }
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 2 2 2 0 10 force @a[distance=..64]`);
  level.runCommandSilent(`playsound minecraft:entity.wither.break_block hostile @a[distance=..64] ${boss.x} ${boss.y} ${boss.z} 2 0.5`);
}

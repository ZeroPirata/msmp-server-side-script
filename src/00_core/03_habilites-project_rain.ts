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

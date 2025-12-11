import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

const Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");

function bossPhases(boss: $LivingEntity, config: IMiniBoss, level: $MinecraftServer): void {
  let currentHealth = boss.health;
  let maxHealth = boss.maxHealth;
  let healthPercentage = currentHealth / maxHealth;
  let percentDisplay = (healthPercentage * 100).toFixed(1);

  updateBossBarProgress(healthPercentage);

  // Determina qual fase ativa
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
    enterPhase(boss, config.phases[activePhaseIndex], activePhaseIndex);
    boss.persistentData.putInt("currentPhase", activePhaseIndex);
  }
  updateBossBarName(`${config.name} ${config.phases[activePhaseIndex].name || ""} - §7[${percentDisplay}%]`);
  updateBossBarColor(config.phases[activePhaseIndex].bossBarColor || "GREEN");
  updateBossBarOverlay(config.phases[activePhaseIndex].bossBarOverlay || "PROGRESS");
  executePhaseAbilities(boss, config.phases[activePhaseIndex] || null, level);
}

function enterPhase(boss: $LivingEntity, phase: IBossPhase, phaseIndex: number): void {
  if (phaseIndex === undefined) return;

  let level = boss.level as $ServerLevel;
  let bossName = boss.customName?.getString() || "Boss";

  // Mensagem ao entrar
  if (phase.onEnterMessage) {
    level.runCommandSilent(`tellraw @a "${phase.onEnterMessage}"`);
    level.runCommandSilent(`title @a times 10 40 10`);
    level.runCommandSilent(`title @a subtitle {"text":"${phase.name || "Nova Fase"}","color":"gold"}`);
    level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${boss.x} ${boss.y} ${boss.z} 2 1`);
  }

  // Efeitos visuais
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 1 1 1 0 5 force @a`);
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${boss.x} ${boss.y} ${boss.z} 2 2 2 0.1 100 force @a`);

  // Executa habilidades "onEnter"
  phase.abilities.forEach((ability, index) => {
    if (ability.config?.onEnter) {
      executeAbility(boss, ability, level, true);
    }

    // Inicializa contadores para habilidades periódicas
    boss.persistentData.putInt(`phase_${phaseIndex}_ability_${index}_lastTick`, level.getServer().getTickCount());
  });
}

function executePhaseAbilities(boss: $LivingEntity, phase: IBossPhase, server: $MinecraftServer): void {
  if (phase == null) return;
  let level = boss.level as $ServerLevel;
  let currentTick = server.getTickCount();
  let phaseIndex = boss.persistentData.getInt("currentPhase") || 0;

  phase.abilities.forEach((ability, abilityIndex) => {
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
  }
}

function executeSummonMinions(boss: $LivingEntity, ability: ISummonMinionsAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  // OnEnter
  if (isOnEnter && ability.config.onEnter) {
    console.log(`[ABILITY] Summon Minions (onEnter)`);
    ability.config.minions.forEach((minionConfig) => {
      spawnMinion(level, boss.blockPosition(), minionConfig);
    });
    return;
  }

  // Periodic
  if (!isOnEnter && ability.config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    let lastTick = boss.persistentData.getInt(key) || 0;
    let interval = ability.config.periodic.intervalTicks;

    if (currentTick - lastTick >= interval) {
      console.log(`[ABILITY] Summon Minions (periodic)`);
      ability.config.minions.forEach((minionConfig) => {
        spawnMinion(level, boss.blockPosition(), minionConfig);
      });
      boss.persistentData.putInt(key, currentTick);

      let bossName = boss.customName?.getString() || "Boss";
      level.runCommandSilent(`tellraw @a "§c§l⚔ ${bossName} invocou reforços!"`);
    }
  }
}

function executeHeal(boss: $LivingEntity, ability: IHealAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  // OnEnter
  if (isOnEnter && ability.config.onEnter) {
    let healAmount = 0;

    if (ability.config.amount) {
      healAmount = ability.config.amount;
    } else if (ability.config.percentage) {
      healAmount = boss.maxHealth * ability.config.percentage;
    }

    boss.heal(healAmount);

    console.log(`[ABILITY] Heal (onEnter): +${healAmount.toFixed(1)} HP`);

    level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 2} ${boss.z} 1 1 1 0.1 20 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.player.levelup master @a ${boss.x} ${boss.y} ${boss.z} 1 1.5`);

    let bossName = boss.customName?.getString() || "Boss";
    level.runCommandSilent(`tellraw @a "§a§l+ ${bossName} se curou em ${healAmount.toFixed(0)} HP!"`);
    return;
  }

  // Periodic
  if (!isOnEnter && ability.config.periodic && phaseIndex !== undefined && abilityIndex !== undefined && currentTick !== undefined) {
    let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
    let lastTick = boss.persistentData.getInt(key) || 0;
    let interval = ability.config.periodic.intervalTicks;

    if (currentTick - lastTick >= interval) {
      let healAmount = ability.config.periodic.amount;
      boss.heal(healAmount);

      console.log(`[ABILITY] Heal (periodic): +${healAmount} HP`);

      level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 1.5} ${boss.z} 0.5 0.5 0.5 0 5 force @a`);
      boss.persistentData.putInt(key, currentTick);
    }
  }
}

function executeBuffAttributes(boss: $LivingEntity, ability: IBuffAttributesAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter) return; // Só executa ao entrar na fase

  console.log(`[ABILITY] Buff Attributes`);

  let config = ability.config;

  // Multiplica atributos
  if (config.damage) {
    let currentDamage = boss.getAttributeBaseValue("minecraft:generic.attack_damage");
    boss.setAttributeBaseValue("minecraft:generic.attack_damage", currentDamage * config.damage);
    console.log(`[ABILITY] Dano: ${currentDamage} → ${currentDamage * config.damage}`);
  }

  if (config.speed) {
    let currentSpeed = boss.getAttributeBaseValue("minecraft:generic.movement_speed");
    boss.setAttributeBaseValue("minecraft:generic.movement_speed", currentSpeed * config.speed);
    console.log(`[ABILITY] Velocidade: ${currentSpeed} → ${currentSpeed * config.speed}`);
  }

  if (config.armor) {
    let currentArmor = boss.getAttributeBaseValue("minecraft:generic.armor");
    boss.setAttributeBaseValue("minecraft:generic.armor", currentArmor + config.armor);
    console.log(`[ABILITY] Armadura: ${currentArmor} → ${currentArmor + config.armor}`);
  }

  if (config.knockbackResistance) {
    boss.setAttributeBaseValue("minecraft:generic.knockback_resistance", config.knockbackResistance);
  }

  // Aplica efeitos de poção
  if (config.potionEffects) {
    config.potionEffects.forEach((effect) => {
      boss.potionEffects.add(effect.id, 999999, effect.amplifier, false, false);
      console.log(`[ABILITY] Efeito: ${effect.id} ${effect.amplifier + 1}`);
    });
  }

  // Efeitos visuais
  level.runCommandSilent(`particle minecraft:enchant ${boss.x} ${boss.y + 1} ${boss.z} 1 1 1 0.5 50 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.player.levelup master @a ${boss.x} ${boss.y} ${boss.z} 1 0.8`);

  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a "§e§l⚡ ${bossName} ficou mais forte!"`);
}

function executeShootProjectiles(boss: $LivingEntity, ability: IShootProjectilesAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;

  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;

  if (currentTick - lastTick < interval) return;

  // Encontra o jogador mais próximo
  let nearestPlayer = null;
  let minDistance = 999999;

  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;
    let dist = boss.distanceToSqr(player);
    if (dist < minDistance) {
      minDistance = dist;
      nearestPlayer = player;
    }
  });

  if (!nearestPlayer) return;

  let count = ability.config.count || 1;
  let spread = ability.config.spread || 0;

  for (let i = 0; i < count; i++) {
    // Calcula direção com spread
    let dx = nearestPlayer.x - boss.x;
    let dy = nearestPlayer.y + nearestPlayer.eyeHeight - boss.y - boss.eyeHeight;
    let dz = nearestPlayer.z - boss.z;

    // Adiciona spread (aleatoriedade)
    if (spread > 0) {
      dx += (Math.random() - 0.5) * spread * 2;
      dy += (Math.random() - 0.5) * spread * 2;
      dz += (Math.random() - 0.5) * spread * 2;
    }

    // Normaliza
    let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    dx /= length;
    dy /= length;
    dz /= length;

    // Cria o projétil
    let projectile = level.createEntity(ability.config.projectileType);
    if (!projectile) continue;

    projectile.setPos(boss.x, boss.y + boss.eyeHeight, boss.z);

    // Define velocidade
    let speed = ability.config.speed || 1.5;
    let velocityVector = new Vec3(dx * speed, dy * speed, dz * speed);
    projectile.deltaMovement = velocityVector; // <--- Linha Corrigida

    projectile.spawn();
  }

  boss.persistentData.putInt(key, currentTick);

  // Som de ataque
  level.runCommandSilent(`playsound minecraft:entity.skeleton.shoot hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);
}

function executeAoeDamage(boss: $LivingEntity, ability: IAoeDamageAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;

  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;

  if (currentTick - lastTick < interval) return;

  let radius = ability.config.radius;
  let damage = ability.config.damage;

  // Aplica dano a todos os jogadores próximos
  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;

    let dist = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.y - boss.y, 2) + Math.pow(player.z - boss.z, 2));

    if (dist <= radius) {
      player.attack(damage);

      // Knockback
      if (ability.config.knockback) {
        let dx = player.x - boss.x;
        let dz = player.z - boss.z;
        let length = Math.sqrt(dx * dx + dz * dz);
        if (length > 0) {
          player.setDeltaMovement((dx / length) * ability.config.knockback, 0.4, (dz / length) * ability.config.knockback);
        }
      }
    }
  });

  // Efeitos visuais
  let particleEffect = ability.config.particleEffect || "minecraft:explosion";
  level.runCommandSilent(`particle ${particleEffect} ${boss.x} ${boss.y} ${boss.z} ${radius} 0.5 ${radius} 0 50 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.8`);

  boss.persistentData.putInt(key, currentTick);
}

function executeTeleport(boss: $LivingEntity, ability: ITeleportAbility, level: $ServerLevel, phaseIndex?: number, abilityIndex?: number, currentTick?: number): void {
  if (phaseIndex === undefined || abilityIndex === undefined || currentTick === undefined) return;

  let key = `phase_${phaseIndex}_ability_${abilityIndex}_lastTick`;
  let lastTick = boss.persistentData.getInt(key) || 0;
  let interval = ability.config.intervalTicks;

  if (currentTick - lastTick < interval) return;

  let targetPlayer = null;

  if (ability.config.toLowHealthPlayer) {
    // Teleporta para o player com menos vida
    let lowestHealth = 999999;
    level.players.forEach((player) => {
      if (player.isSpectator() || !player.isAlive()) return;
      if (player.health < lowestHealth) {
        lowestHealth = player.health;
        targetPlayer = player;
      }
    });
  } else {
    // Teleporta aleatoriamente dentro do raio
    let angle = Math.random() * 2 * Math.PI;
    let distance = Math.random() * ability.config.radius;
    let newX = boss.x + distance * Math.cos(angle);
    let newZ = boss.z + distance * Math.sin(angle);

    // Efeito de partículas na posição antiga
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);

    boss.teleportTo(newX, boss.y, newZ);

    // Efeito de partículas na posição nova
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);

    boss.persistentData.putInt(key, currentTick);
    return;
  }

  if (targetPlayer) {
    // Efeito na posição antiga
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);

    // Teleporta perto do player
    let offsetX = (Math.random() - 0.5) * 4;
    let offsetZ = (Math.random() - 0.5) * 4;
    boss.teleportTo(targetPlayer.x + offsetX, targetPlayer.y, targetPlayer.z + offsetZ);

    // Efeito na posição nova
    level.runCommandSilent(`particle minecraft:portal ${boss.x} ${boss.y + 1} ${boss.z} 0.5 1 0.5 1 50 force @a`);
    level.runCommandSilent(`playsound minecraft:entity.enderman.teleport hostile @a ${boss.x} ${boss.y} ${boss.z} 1 1`);

    let bossName = boss.customName?.getString() || "Boss";
    targetPlayer.sendSystemMessage(Text.red(`§c§l⚠ ${bossName} teleportou para você!`));
  }

  boss.persistentData.putInt(key, currentTick);
}

function executeWeatherChange(boss: $LivingEntity, ability: IWeatherChangeAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter || !ability.config.onEnter) return;

  console.log(`[ABILITY] Weather Change: ${ability.config.weather}`);

  if (ability.config.weather === "rain") {
    level.runCommandSilent(`weather rain`);
  } else if (ability.config.weather === "thunder") {
    level.runCommandSilent(`weather thunder`);
  } else if (ability.config.weather === "clear") {
    level.runCommandSilent(`weather clear`);
  }

  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a "§6§l⚡ ${bossName} alterou o clima!"`);
}

function executeEnrage(boss: $LivingEntity, ability: IEnrageAbility, level: $ServerLevel, isOnEnter: boolean): void {
  if (!isOnEnter) return;

  console.log(`[ABILITY] Enrage`);

  let config = ability.config;

  // Multiplica dano
  if (config.damageMultiplier) {
    let currentDamage = boss.getAttributeBaseValue("minecraft:generic.attack_damage");
    boss.setAttributeBaseValue("minecraft:generic.attack_damage", currentDamage * config.damageMultiplier);
  }

  // Multiplica velocidade
  if (config.speedMultiplier) {
    let currentSpeed = boss.getAttributeBaseValue("minecraft:generic.movement_speed");
    boss.setAttributeBaseValue("minecraft:generic.movement_speed", currentSpeed * config.speedMultiplier);
  }

  // Efeitos visuais
  if (config.particleEffect) {
    level.runCommandSilent(`particle minecraft:angry_villager ${boss.x} ${boss.y + 2} ${boss.z} 1 1 1 0 20 force @a`);
    level.runCommandSilent(`particle minecraft:lava ${boss.x} ${boss.y + 1} ${boss.z} 1 0.5 1 0 30 force @a`);
  }

  level.runCommandSilent(`playsound minecraft:entity.ravager.roar hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.7`);

  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a "§4§l☠ ${bossName} ENRAIVECEU!"`);
}

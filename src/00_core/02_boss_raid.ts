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

  // Determina qual fase ativa baseada no HP
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

  // 🛑 BLOCO DE CÓDIGO MODIFICADO PARA A SOLUÇÃO "APENAS PROGREDIR"
  if (currentPhaseKey !== activePhaseIndex) {
    // Transição para uma FASE POSTERIOR (Progresso: 2 -> 3)
    if (activePhaseIndex > currentPhaseKey) {
      enterPhase(boss, config.phases[activePhaseIndex], activePhaseIndex);
      boss.persistentData.putInt("currentPhase", activePhaseIndex);

      // Esta linha pode ser mantida, embora não seja mais usada para o bloqueio de regressão.
      boss.persistentData.putInt("lastPhaseChangeTick", currentTick);
    } else {
      // Bloqueia a regressão. Se o HP sugere uma fase anterior (regressão, ex: 3 -> 2),
      // o boss é mantido na fase atual que ele já está (currentPhaseKey).
      activePhaseIndex = currentPhaseKey;
    }
  }

  // Se a fase foi alterada (ou bloqueada), garante que a barra de boss use a fase correta
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
      executeAbility(boss, ability, level, true, phaseIndex);
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

    case "crystal_phase":
      executeCrystalPhase(boss, ability as ICrystalPhaseAbility, level, isOnEnter, phaseIndex);
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

  // Verifica se o intervalo de tempo passou (120 ticks, ou 6 segundos)
  if (currentTick - lastTick < interval) return;

  // 🛑 CORREÇÃO DE TIMING:
  // Atualiza o lastTick IMEDIATAMENTE antes de executar a habilidade.
  // Isso garante que se a função for chamada novamente no mesmo tick,
  // a verificação acima (`currentTick - lastTick < interval`) falhará,
  // prevenindo os múltiplos hits.
  boss.persistentData.putInt(key, currentTick);

  let radius = ability.config.radius;
  let damage = ability.config.damage;

  // Aplica dano a todos os jogadores próximos
  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;

    let dist = Math.sqrt(Math.pow(player.x - boss.x, 2) + Math.pow(player.y - boss.y, 2) + Math.pow(player.z - boss.z, 2));

    if (dist <= radius) {
      player.attack(damage);

      // Knockback (CORRIGIDO para usar Vec3)
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

  // Efeitos visuais (mantendo minecraft:explosion)
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

function executeCrystalPhase(boss: $LivingEntity, ability: ICrystalPhaseAbility, level: $ServerLevel, isOnEnter: boolean, phaseIndex?: number): void {
  if (phaseIndex === undefined) return;

  if (isOnEnter) {
    spawnCrystals(boss, ability.config, level, phaseIndex);
    return;
  }

  updateCrystalSystem(boss, ability.config, level, phaseIndex);
}

function spawnCrystals(boss: $LivingEntity, config: ICrystalConfig, level: $ServerLevel, phaseIndex: number): void {
  console.log(`[CRYSTAL PHASE] Iniciando sistema de cristais - Fase ${phaseIndex}`);

  let bossPos = boss.blockPosition();
  let crystalPositions: any[] = [];
  let angleStep = (2 * Math.PI) / config.crystalCount;

  for (let i = 0; i < config.crystalCount; i++) {
    // ✅ MUDOU: let ao invés de let
    let angle = angleStep * i;
    let offsetX = Math.cos(angle) * config.distanceFromBoss;
    let offsetZ = Math.sin(angle) * config.distanceFromBoss;

    let crystalX = Math.floor(bossPos.x + offsetX);
    let crystalZ = Math.floor(bossPos.z + offsetZ);

    // Busca chão válido
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

    // Spawna o End Crystal
    level.runCommandSilent(`summon ${config.crystalBlockType} ${crystalX + 0.5} ${finalSpawnY} ${crystalZ + 0.5} {ShowBottom:0b,Invulnerable:0b}`);

    console.log(`[CRYSTAL] Entidade spawnada em X:${crystalX} Y:${finalSpawnY} Z:${crystalZ}`);

    // Spawna minions
    if (config.minionSpawnPerCrystal) {
      config.minionSpawnPerCrystal.forEach((minionConfig) => {
        spawnMinion(level, new BlockPos(crystalX, crystalY, crystalZ), minionConfig);
      });
    }

    // Efeitos visuais
    if (config.particleEffect) {
      level.runCommandSilent(`particle ${config.particleEffect} ${crystalX + 0.5} ${finalSpawnY + 1} ${crystalZ + 0.5} 0.5 1 0.5 0.1 30 force @a`);
    }
    level.runCommandSilent(`particle minecraft:flash ${crystalX + 0.5} ${finalSpawnY} ${crystalZ + 0.5} 0 0 0 0 1 force @a`);

    // Salva dados do cristal
    crystalPositions.push({
      x: crystalX + 0.5,
      y: finalSpawnY,
      z: crystalZ + 0.5,
      spawnTick: level.server.getTickCount(),
      destroyed: false,
      respawnAt: -1
    });
  }

  // ✨ RITUAL: Teleporta boss para o centro e 4 blocos acima
  let centerX = bossPos.x;
  let centerY = bossPos.y + 4;
  let centerZ = bossPos.z;

  boss.teleportTo(centerX, centerY, centerZ);

  // Marca que o boss está em ritual
  boss.persistentData.putBoolean(`phase_${phaseIndex}_inRitual`, true);
  boss.persistentData.putInt(`phase_${phaseIndex}_ritualStartTick`, level.server.getTickCount());

  // ✅ CORREÇÃO: Boss fica invulnerável durante o ritual
  boss.invulnerable = true;
  console.log(`[CRYSTAL] Boss ficou INVULNERÁVEL (ritual iniciado)`);

  // Efeitos visuais do ritual
  level.runCommandSilent(`particle minecraft:soul_fire_flame ${centerX} ${centerY} ${centerZ} 0.5 2 0.5 0.1 100 force @a`);
  level.runCommandSilent(`particle minecraft:portal ${centerX} ${centerY} ${centerZ} 1 1 1 1 200 force @a`);

  // Salva no boss
  boss.persistentData.putString(`phase_${phaseIndex}_crystals`, JSON.stringify(crystalPositions));
  boss.persistentData.putInt(`phase_${phaseIndex}_crystalDamage`, 0);
  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, false);

  // Anúncios
  let bossName = boss.customName?.getString() || "Boss";
  level.runCommandSilent(`tellraw @a "§c§l⚔ ${bossName} invocou ${config.crystalCount} cristais de poder!"`);
  level.runCommandSilent(`tellraw @a "§5§l✦ ${bossName} iniciou um ritual sombrio!"`);
  level.runCommandSilent(`tellraw @a "§e§l⚠ Destrua os cristais antes que seja tarde demais!"`);
  level.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.8`);
  level.runCommandSilent(`playsound minecraft:block.beacon.activate hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.6`);
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
  let IMMUNITY_TICKS = 15; // 0.75 segundos de imunidade

  // ✨ RITUAL: Verifica se o boss está em ritual
  let inRitual = boss.persistentData.getBoolean(`phase_${phaseIndex}_inRitual`);

  if (inRitual) {
    // ✅ CORREÇÃO: Força invulnerabilidade a cada tick
    boss.invulnerable = true;

    // Regeneração fixa: 0.25 HP por segundo (5 HP a cada 20 ticks)
    if (currentTick % 20 === 0) {
      boss.heal(5);

      // Efeito visual de cura
      level.runCommandSilent(`particle minecraft:heart ${boss.x} ${boss.y + 1} ${boss.z} 0.5 0.5 0.5 0 3 force @a`);
    }

    // Mantém o boss flutuando (aplica levitation)
    boss.potionEffects.add("minecraft:levitation", 25, 0, false, false);

    // Efeito visual de ritual constante (a cada 10 ticks = 0.5 seg)
    if (currentTick % 10 === 0) {
      level.runCommandSilent(`particle minecraft:witch ${boss.x} ${boss.y} ${boss.z} 0.3 1 0.3 0.05 5 force @a`);
    }
  }

  crystals.forEach((crystal: any) => {
    // Cria AABB ao redor da posição do cristal
    let searchAABB = new AABB(crystal.x - 0.5, crystal.y - 0.5, crystal.z - 0.5, crystal.x + 0.5, crystal.y + 1.5, crystal.z + 0.5);

    // Busca entidades End Crystal na área
    let crystalEntities = level.getEntitiesWithin(searchAABB);

    // ✅ CORREÇÃO: Usa .type.toString() ao invés de .class
    let isActive = false;
    for (let entity of crystalEntities) {
      let entityType = entity.type.toString();
      if (entityType === "minecraft:end_crystal" || entityType === "end_crystal") {
        isActive = true;
        break;
      }
    }

    // ===== DESTRUIÇÃO =====
    if (!crystal.destroyed && !isActive) {
      // Guarda de imunidade
      if (currentTick - crystal.spawnTick < IMMUNITY_TICKS) {
        console.warn(`[CRYSTAL] Cristal em (${crystal.x}, ${crystal.y}, ${crystal.z}) ainda em imunidade. Ignorando quebra.`);
        activeCrystals++;
        allDestroyed = false;
        return;
      }

      crystal.destroyed = true;
      crystal.respawnAt = config.respawnTime ? currentTick + config.respawnTime : -1;

      level.runCommandSilent(`particle minecraft:explosion ${crystal.x} ${crystal.y} ${crystal.z} 1 1 1 0 10 force @a`);
      level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a ${crystal.x} ${crystal.y} ${crystal.z} 1 1.2`);

      let destroyedCount = crystals.filter((c: any) => c.destroyed).length;
      level.runCommandSilent(`tellraw @a "§a§l✓ Cristal destruído! (${destroyedCount}/${crystals.length})"`);
    }

    // ===== RESPAWN =====
    if (crystal.destroyed && crystal.respawnAt > 0 && currentTick >= crystal.respawnAt) {
      level.runCommandSilent(`summon ${config.crystalBlockType} ${crystal.x} ${crystal.y} ${crystal.z} {ShowBottom:0b,Invulnerable:0b}`);

      crystal.destroyed = false;
      crystal.spawnTick = currentTick;

      level.runCommandSilent(`particle minecraft:flash ${crystal.x} ${crystal.y} ${crystal.z} 0 0 0 0 1 force @a`);
      level.runCommandSilent(`playsound minecraft:block.beacon.activate hostile @a ${crystal.x} ${crystal.y} ${crystal.z} 1 1`);
      level.runCommandSilent(`tellraw @a "§c§l⚠ Um cristal renasceu!"`);
    }

    // ===== CRISTAL ATIVO =====
    if (!crystal.destroyed && isActive) {
      let ticksAlive = currentTick - crystal.spawnTick;
      activeCrystals++;
      allDestroyed = false;

      // ✨ FAIXES DE LUZ: Boss → Cristal (a cada 5 ticks = 0.25 seg)
      if (inRitual && ticksAlive % 5 === 0) {
        // Cria linha de partículas entre boss e cristal
        let steps = 20; // Quantos pontos na linha
        for (let step = 0; step <= steps; step++) {
          let t = step / steps; // 0.0 a 1.0
          let x = boss.x + (crystal.x - boss.x) * t;
          let y = boss.y + (crystal.y - boss.y) * t;
          let z = boss.z + (crystal.z - boss.z) * t;

          level.runCommandSilent(`particle minecraft:end_rod ${x} ${y} ${z} 0 0 0 0 1 force @a`);
        }
      }

      // Adiciona dano a cada segundo (20 ticks)
      if (ticksAlive % 20 === 0 && ticksAlive > 0) {
        let oldDamage = totalDamageBuff;
        totalDamageBuff = Math.min(totalDamageBuff + config.damageBuffPerSecond, config.maxDamageBuff);

        if (totalDamageBuff > oldDamage) {
          console.log(`[CRYSTAL] Boss ganhou +${config.damageBuffPerSecond} dano (Total: ${totalDamageBuff})`);
        }
      }

      // Efeito visual periódico (a cada 2 segundos)
      if (ticksAlive % 40 === 0 && config.particleEffect) {
        level.runCommandSilent(`particle ${config.particleEffect} ${crystal.x} ${crystal.y + 1} ${crystal.z} 0.3 0.5 0.3 0.05 5 force @a`);
      }

      // Dano em área (zona de proteção)
      if (config.protectionRadius) {
        level.players.forEach((player) => {
          if (player.isSpectator() || !player.isAlive()) return;

          let dist = Math.sqrt(Math.pow(player.x - crystal.x, 2) + Math.pow(player.y - crystal.y, 2) + Math.pow(player.z - crystal.z, 2));

          if (dist <= config.protectionRadius && ticksAlive % 20 === 0) {
            player.attack(2); // 1 coração por segundo
            level.runCommandSilent(`particle minecraft:damage_indicator ${player.x} ${player.y + 1} ${player.z} 0.3 0.3 0.3 0 3 force @a`);
          }
        });
      }
    }
  });

  // ===== ATUALIZA DADOS =====
  boss.persistentData.putInt(`phase_${phaseIndex}_crystalDamage`, totalDamageBuff);
  boss.persistentData.putString(`phase_${phaseIndex}_crystals`, JSON.stringify(crystals));

  // Aplica buff de dano ao boss
  let baseDamageKey = `phase_${phaseIndex}_baseDamage`;
  if (!boss.persistentData.contains(baseDamageKey)) {
    boss.persistentData.putFloat(baseDamageKey, boss.getAttributeBaseValue("minecraft:generic.attack_damage"));
  }

  let baseDamage = boss.persistentData.getFloat(baseDamageKey);
  boss.setAttributeBaseValue("minecraft:generic.attack_damage", baseDamage + totalDamageBuff);

  // ===== VERIFICA SE TODOS FORAM DESTRUÍDOS =====
  if (allDestroyed) {
    handleAllCrystalsDestroyed(boss, level, phaseIndex, totalDamageBuff);
  }

  // ===== AVISO PERIÓDICO =====
  if (activeCrystals > 0 && currentTick % 100 === 0) {
    level.runCommandSilent(`title @a actionbar {"text":"⚡ Cristais Ativos: ${activeCrystals} | Dano Extra: +${totalDamageBuff.toFixed(1)}","color":"red","bold":true}`);
  }
}

function handleAllCrystalsDestroyed(boss: $LivingEntity, level: $ServerLevel, phaseIndex: number, damageAccumulated: number): void {
  if (boss.persistentData.getBoolean(`phase_${phaseIndex}_crystalsCleared`)) return;

  boss.persistentData.putBoolean(`phase_${phaseIndex}_crystalsCleared`, true);

  let bossName = boss.customName?.getString() || "Boss";

  // ✨ FIM DO RITUAL: Boss desce ao chão
  boss.persistentData.putBoolean(`phase_${phaseIndex}_inRitual`, false);

  // ✅ CORREÇÃO: Remove invulnerabilidade IMEDIATAMENTE
  boss.invulnerable = false;
  console.log(`[CRYSTAL] Boss ficou VULNERÁVEL (ritual terminado)`);

  // Remove levitation
  boss.potionEffects.remove("minecraft:levitation");

  // Teleporta de volta ao chão (encontra Y válido)
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

  // Efeito visual de impacto
  level.runCommandSilent(`particle minecraft:explosion ${boss.x} ${groundY} ${boss.z} 2 0.5 2 0 20 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.generic.explode hostile @a ${boss.x} ${groundY} ${boss.z} 1 0.8`);

  // Restaura dano base do boss
  let baseDamageKey = `phase_${phaseIndex}_baseDamage`;
  let originalBaseDamage = boss.persistentData.getFloat(baseDamageKey) || 1.0;
  boss.setAttributeBaseValue("minecraft:generic.attack_damage", originalBaseDamage);

  // Aplica dano punitivo
  if (damageAccumulated > 0) {
    let damageToApply = damageAccumulated * 5;
    boss.attack(damageToApply);

    level.runCommandSilent(`tellraw @a "§a§l✓ Todos os cristais foram destruídos!"`);
    level.runCommandSilent(`tellraw @a "§c§l⚔ ${bossName} recebeu ${damageToApply.toFixed(0)} de dano pelos cristais ativos!"`);
  } else {
    level.runCommandSilent(`tellraw @a "§a§l✓ Cristais destruídos rapidamente! Boss não recebeu buff!"`);
  }

  // Efeitos visuais finais
  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 2 2 2 0 10 force @a`);
  level.runCommandSilent(`playsound minecraft:entity.wither.break_block hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.5`);
}

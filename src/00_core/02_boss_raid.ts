import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $Registry } from "net.minecraft.core.Registry";



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

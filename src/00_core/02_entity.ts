import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

function basicStatusEnemys(mob: $LivingEntity, e: IEnemy): void {
  mob.getAttribute("minecraft:generic.max_health")?.setBaseValue(e.health || 20);
  mob.health = e.health;
  mob.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack || 2);
  mob.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor || 0);
  mob.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness || 0);
  mob.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed || 0.25);
}

function executeMinionAbility(minion: $LivingEntity, ability: IMinionAbility, level: $ServerLevel, currentTick: number): void {
  let config = ability.config;
  let range = config.range || 20;

  let nearestPlayer = level.getNearestPlayer(minion.x, minion.y, minion.z, range, false);
  if (!nearestPlayer || !nearestPlayer.isAlive() || nearestPlayer.isSpectator()) return;

  switch (ability.type) {
    case "cast_spell":
      if (config.spellId) {
        let minionUUID = minion.uuid.toString();
        let targetUUID = nearestPlayer.uuid.toString();

        // Se o mod de spells aceitar cast <at> <target>, use assim:
        level.runCommandSilent(`execute as ${minionUUID} at @s facing entity ${targetUUID} eyes run cast ${config.spellId}`);
      }
      break;

    case "shoot_projectile":
      if (config.projectileType) {
        let projectile = level.createEntity(config.projectileType);
        if (!projectile) break;

        projectile.setPos(minion.x, minion.y + minion.eyeHeight, minion.z);

        let dx = nearestPlayer.x - minion.x;
        let dy = nearestPlayer.y + nearestPlayer.eyeHeight * 0.8 - (minion.y + minion.eyeHeight);
        let dz = nearestPlayer.z - minion.z;

        let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance > 0) {
          let speed = 1.5;
          // Use setMotion do KubeJS que aceita 3 números diretamente, evitando erro de Vec3
          projectile.setMotion((dx / distance) * speed, (dy / distance) * speed, (dz / distance) * speed);

          // CORREÇÃO DA ROTAÇÃO: Use as propriedades diretas do KubeJS
          projectile.yaw = Math.atan2(dz, dx) * (180 / Math.PI) - 90;
          projectile.pitch = -(Math.atan2(dy, Math.sqrt(dx * dx + dz * dz)) * (180 / Math.PI));
        }
        projectile.spawn();
      }
      break;
    case "aoe_attack":
      level.spawnParticles("minecraft:explosion", true, minion.x, minion.y, minion.z, 10, 2, 0.5, 2, 0);
      let aoeRangeSqr = range * range;
      let damage = config.damage || 6;
      level.players.forEach((player) => {
        if (player.isAlive() && !player.isSpectator() && minion.distanceToSqr(player) <= aoeRangeSqr) {
          player.attack(damage);
        }
      });
      break;
  }
}

import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de entidade...");

function basicStatusEnemys(mob: $LivingEntity, e: IEnemy): void {
  mob.getAttribute("minecraft:generic.max_health")?.setBaseValue(e.health || 20);
  mob.health = e.health;
  mob.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack || 2);
  mob.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor || 0);
  mob.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness || 0);
  mob.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed || 0.25);
}

function executeMinionAbility(minion: $LivingEntity, ability: IMinionAbility, level: $ServerLevel, currentTick: number): void {
  let range = ability.config.range || 20;
  let nearestPlayer = null;
  let minDistance = range * range;
  level.players.forEach((player) => {
    if (player.isSpectator() || !player.isAlive()) return;
    let distSqr = minion.distanceToSqr(player);
    if (distSqr < minDistance) {
      minDistance = distSqr;
      nearestPlayer = player;
    }
  });
  if (!nearestPlayer) return;
  switch (ability.type) {
    case "cast_spell":
      if (ability.config.spellId) {
        level.runCommandSilent(`execute as ${minion.stringUuid} at @s run tp @s ~ ~ ~ facing entity ${nearestPlayer.stringUuid} eyes`);
        level.runCommandSilent(`cast ${minion.stringUuid} ${ability.config.spellId}`);
        console.log(`[MINION] ${minion.customName?.getString() || "Minion"} castou ${ability.config.spellId}`);
      }
      break;
    case "shoot_projectile":
      if (ability.config.projectileType) {
        let dx = nearestPlayer.x - minion.x;
        let dy = nearestPlayer.y + nearestPlayer.eyeHeight - minion.y - minion.eyeHeight;
        let dz = nearestPlayer.z - minion.z;
        let length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        let dirX = dx / length;
        let dirY = dy / length;
        let dirZ = dz / length;
        let projectile = level.createEntity(ability.config.projectileType);
        if (projectile) {
          projectile.setPos(minion.x, minion.y + minion.eyeHeight, minion.z);
          let Vec3 = Java.loadClass("net.minecraft.world.phys.Vec3");
          projectile.deltaMovement = new Vec3(dirX * 1.5, dirY * 1.5, dirZ * 1.5);
          projectile.spawn();
        }
      }
      break;
    case "aoe_attack":
      level.runCommandSilent(`particle minecraft:explosion ${minion.x} ${minion.y} ${minion.z} 2 0.5 2 0 10 force @a`);
      level.players.forEach((player) => {
        let dist = Math.sqrt(minion.distanceToSqr(player));
        if (dist <= (ability.config.range || 5)) {
          player.attack(6);
        }
      });
      break;
  }
}

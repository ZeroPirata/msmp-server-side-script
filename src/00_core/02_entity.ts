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

import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de entidade...");

function basicStatusEnemys(mob: $LivingEntity, e: IEnemy): void {
  console.log(`[MSMP] Configurando status básico para inimigo: ${e.name}`);
  mob.getAttribute("minecraft:generic.max_health")?.setBaseValue(e.health || 20);
  mob.health = e.health;
  mob.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack || 2);
  mob.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor || 0);
  mob.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness || 0);
  mob.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed || 0.25);
}

function equipEntity(entity: $LivingEntity, equipment: IEquipment): void {
  let uuid = entity.stringUuid;
  if (!equipment) return;

  // Mão principal (espada, arco, etc)
  if (equipment.mainHand) {
    entity.server.runCommandSilent(`item replace entity ${uuid} weapon.mainhand with ${equipment.mainHand}`);
  }

  // Mão secundária (escudo, tocha, etc)
  if (equipment.offHand) {
    entity.server.runCommandSilent(`item replace entity ${uuid} weapon.offhand with ${equipment.offHand}`);
  }

  // Capacete
  if (equipment.head) {
    entity.server.runCommandSilent(`item replace entity ${uuid} armor.head with ${equipment.head}`);
  }

  // Peitoral
  if (equipment.chest) {
    entity.server.runCommandSilent(`item replace entity ${uuid} armor.chest with ${equipment.chest}`);
  }

  // Calças
  if (equipment.legs) {
    entity.server.runCommandSilent(`item replace entity ${uuid} armor.legs with ${equipment.legs}`);
  }

  // Botas
  if (equipment.feet) {
    entity.server.runCommandSilent(`item replace entity ${uuid} armor.feet with ${equipment.feet}`);
  }

  // Configurar chances de drop (usar NBT)
  if (equipment.dropChance) {
    let handItems = [];
    let armorItems = [];

    // MainHand
    if (equipment.mainHand) {
      handItems.push(equipment.dropChance.mainHand ?? 0.085);
    } else {
      handItems.push(0.085);
    }

    // OffHand
    if (equipment.offHand) {
      handItems.push(equipment.dropChance.offHand ?? 0.085);
    } else {
      handItems.push(0.085);
    }

    // Armor (feet, legs, chest, head)
    armorItems.push(equipment.dropChance.feet ?? 0.085);
    armorItems.push(equipment.dropChance.legs ?? 0.085);
    armorItems.push(equipment.dropChance.chest ?? 0.085);
    armorItems.push(equipment.dropChance.head ?? 0.085);

    // Aplicar as chances
    entity.server.runCommandSilent(
      `data merge entity ${uuid} {HandDropChances:[${handItems[0]}f,${handItems[1]}f],ArmorDropChances:[${armorItems[0]}f,${armorItems[1]}f,${armorItems[2]}f,${armorItems[3]}f]}`
    );
  }
}

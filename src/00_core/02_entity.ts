import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de entidade...");

function basicStatusEnemys(mob: $LivingEntity, e: IEnemy): void {
  mob.getAttribute("minecraft:generic.max_health")?.setBaseValue(e.health);
  mob.health = e.health;
  mob.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack);
  mob.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor);
  mob.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness);
  mob.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed);
}

function equipEntity(entity: $LivingEntity, equipment: IEquipment): void {
  let uuid = entity.stringUuid;

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

function envokeMinions(level: $Level): void {
  let server = level.getServer();
  let { boss, config } = getBossActive(server);

  if (!boss || !boss.isAlive()) return;
  if (!config.summonMinions) return;

  let summonMinionsPerPhase = config.summonMinionsPerPhase;
  if (!summonMinionsPerPhase || summonMinionsPerPhase <= 0) summonMinionsPerPhase = 1;

  let minionList = config.summonMinionList;
  if (!minionList || minionList.length === 0) return;

  let dimensionBoss = server.getLevel(level.getDimension());
  for (let i = 0; i < summonMinionsPerPhase; i++) {
    let randomIndex = randomBetween(0, minionList.length - 1);
    let mob = minionList[randomIndex];
    let customName = mob.name.replace(/'/g, "\\'").replace(/"/g, '\\"');

    let radiusSpawnMinions = 2 + i * 3;
    let angleSpawnMinions = (Math.PI * 2 * i) / summonMinionsPerPhase + Math.random() * 0.5;

    let offsetX = boss.x + Math.cos(angleSpawnMinions) * radiusSpawnMinions;
    let offsetZ = boss.z + Math.sin(angleSpawnMinions) * radiusSpawnMinions;
    let safePos = getSafeSpawnPos(dimensionBoss, Math.floor(offsetX), Math.floor(offsetZ));

    let x = typeof safePos.x === "function" ? safePos.getX() : safePos.x;
    let y = typeof safePos.y === "function" ? safePos.getY() : safePos.y;
    let z = typeof safePos.z === "function" ? safePos.getZ() : safePos.z;

    server.runCommandSilent(`summon ${mob.id} ${x + 0.5} ${y + 0.5} ${z + 0.5} {CustomName:'{"text":"${customName}"}',CustomNameVisible:1b}`);

    let startTime = Date.now();
    while (Date.now() - startTime < 50) {}

    let entitiesAfter = server.getEntitiesWithin(AABB.of(x - 2, y - 2, z - 2, x + 3, y + 4, z + 3));
    let minionEntity: $LivingEntity | null = null;

    for (let j = entitiesAfter.size() - 1; j >= 0; j--) {
      let entity = entitiesAfter.get(j);
      let living = asLiving(entity);
      if (!living) continue;

      let entityType = entity.type.toString();
      let entityName = living.customName?.getString() || new Date().getTime().toString();

      if (living && entityName === mob.name && entityType === mob.id) {
        minionEntity = living;
        break;
      }
    }
    if (!minionEntity) continue;
    basicStatusEnemys(minionEntity, mob);

    if (!mob.equipment) return;
    equipEntity(minionEntity, mob.equipment);
  }
}

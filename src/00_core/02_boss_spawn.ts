import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";

function spawnBossAtPositionMulti(server: $ServerLevel, pendingBoss: PendingBossData): void {
  let config = pendingBoss.config;
  let x = pendingBoss.x;
  let y = pendingBoss.y;
  let z = pendingBoss.z;
  let spawnDay = pendingBoss.spawnDay;
  let isBloodMoon = pendingBoss.isBloodMoonBoss || false;
  let chunkX = Math.floor(x / 16);
  let chunkZ = Math.floor(z / 16);

  if (!server.getChunk(chunkX, chunkZ)) {
    console.log(`[MULTI-BOSS] ERRO: Chunk não carregado em ${chunkX}, ${chunkZ}`);
    return;
  }

  server.getServer().scheduleInTicks(5, () => {
    if (config.mount?.name) {
      spawnMountedBoss(server, config, x, y, z, spawnDay, chunkX, chunkZ, isBloodMoon);
    } else {
      spawnStandardBoss(server, config, x, y, z, spawnDay, chunkX, chunkZ, isBloodMoon);
    }
  });
}

function spawnMountedBoss(server: $ServerLevel, config: IMiniBoss, x: number, y: number, z: number, spawnDay: number, chunkX: number, chunkZ: number, isBloodMoon: boolean): void {
  isBloodMoon = isBloodMoon || false;
  let mount = createMountEntity(server, config.mount, x, y, z);
  if (!mount) return;

  let boss = server.createEntity(config.id as any);
  if (!boss) {
    console.log(`[MULTI-BOSS] Falha ao criar boss para montaria: ${config.id}`);
    return;
  }

  setupBaseEntity(boss, config, x, y, z);
  let living = asLiving(boss);
  if (!living) return;
  basicStatusEnemys(living, config);

  mount.spawn();
  living.spawn();

  living.startRiding(mount, true);
  server.getServer().scheduleInTicks(2, () => {
    if (living.isAlive() && living.isAddedToLevel()) {
      setupBossPersistentData(living, config, chunkX, chunkZ);
      setupMountPersistentData(mount, living.uuid.toString());
      applyBossEffects(living, config);
      finalizeSpawn(server, x, y, z, chunkX, chunkZ);
      registerActiveBoss(living, config, spawnDay, server.getServer());

      // Marcar como Blood Moon boss se aplicável
      if (isBloodMoon) {
        living.persistentData.putBoolean("kubejs_blood_moon_boss", true);
        if (currentBloodMoonState) {
          currentBloodMoonState.bossUuid = living.uuid.toString();
          saveBloodMoonState(server.getServer(), currentBloodMoonState);
        }
        console.log(`[MSMP Blood Moon] Boss montado ativado! UUID: ${living.uuid.toString()}`);
      }
    }
  });
}

function spawnStandardBoss(server: $ServerLevel, config: IMiniBoss, x: number, y: number, z: number, spawnDay: number, chunkX: number, chunkZ: number, isBloodMoon: boolean): void {
  isBloodMoon = isBloodMoon || false;
  let boss = server.createEntity(config.id as any);
  if (!boss) {
    console.log(`[MULTI-BOSS] Falha ao criar boss: ${config.id}`);
    return;
  }

  setupBaseEntity(boss, config, x, y, z);
  let living = asLiving(boss);
  if (!living) {
    console.log(`[MULTI-BOSS] Erro ao converter para LivingEntity`);
    return;
  }

  server.server.runCommandSilent(`team add msmp_allies`);
  server.server.runCommandSilent(`team join msmp_allies ${living.uuid}`);
  server.server.runCommandSilent(`team modify msmp_allies friendlyFire false`);

  basicStatusEnemys(living, config);
  boss.spawn();

  server.getServer().scheduleInTicks(1, () => {
    if (living.isAlive() && living.isAddedToLevel()) {
      setupBossPersistentData(living, config, chunkX, chunkZ);
      applyBossEffects(living, config);
      finalizeSpawn(server, x, y, z, chunkX, chunkZ);
      registerActiveBoss(living, config, spawnDay, server.getServer());

      if (isBloodMoon) {
        living.persistentData.putBoolean("kubejs_blood_moon_boss", true);
        if (currentBloodMoonState) {
          currentBloodMoonState.bossUuid = living.uuid.toString();
          saveBloodMoonState(server.getServer(), currentBloodMoonState);
        }
        console.log(`[MSMP Blood Moon] Boss ativado! UUID: ${living.uuid.toString()}`);
      }
    }
  });
}

function createMountEntity(server: $ServerLevel, mountConfig: MountConfig, x: number, y: number, z: number): $Entity | null {
  let mount = server.createEntity(mountConfig.id as any);
  if (!mount) {
    console.log(`[MULTI-BOSS] Falha ao criar mount: ${mountConfig.id}`);
    return null;
  }

  let mountLiving = asLiving(mount);
  mountLiving.setHealth(mountConfig.health);
  if (mountLiving && mountConfig.statusBase) {
    let e = mountConfig.statusBase;
    mountLiving.getAttribute("minecraft:generic.max_health")?.setBaseValue(mountConfig.health || 20);
    mountLiving.health = mountConfig.health;
    mountLiving.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack || 2);
    mountLiving.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor || 0);
    mountLiving.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness || 0);
    mountLiving.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed || 0.25);
  }

  mount.nbt.putByte("PersistenceRequired", 1);
  mount.nbt.putInt("DespawnDelay", -1);
  mount.nbt.putBoolean("NoAI", true);
  mount.setPos(x + 0.5, y, z + 0.5);

  if (mountConfig.name) {
    mount.setCustomName(mountConfig.name);
    mount.setCustomNameVisible(false);
  }

  return mount;
}

function buildBossNBT(config: IMiniBoss): any {
  return {
    id: config.id,
    CustomName: `{"text":"${config.name}"}`,
    CustomNameVisible: true,
    DeathLootTable: "minecraft:empty",
    PersistenceRequired: 1,
    ImmuneToSunlight: 1,
    NoAI: true,
    Attributes: [
      { Name: "minecraft:generic.max_health", Base: config.health },
      { Name: "minecraft:generic.attack_damage", Base: config.attack },
      { Name: "minecraft:generic.armor", Base: config.armor || 0 },
      { Name: "minecraft:generic.armor_toughness", Base: config.armorToughness || 0 },
      { Name: "minecraft:generic.movement_speed", Base: config.speed || 0.25 }
    ],
    Health: config.health
  };
}

function setupBaseEntity(entity: $Entity, config: IMiniBoss, x: number, y: number, z: number): void {
  entity.nbt.putString("DeathLootTable", "minecraft:empty");
  entity.nbt.putByte("PersistenceRequired", 1);
  entity.nbt.putInt("DespawnDelay", -1);
  entity.nbt.putBoolean("NoAI", true);
  entity.setPos(x + 0.5, y, z + 0.5);
  entity.setCustomName(config.name);
  entity.setCustomNameVisible(true);
}

function setupBossPersistentData(boss: $LivingEntity, config: IMiniBoss, chunkX: number, chunkZ: number): void {
  boss.persistentData.putBoolean("kubejs_customDrops", true);
  boss.persistentData.putString("kubejs_damageTracker", JSON.stringify({}));
  boss.persistentData.putBoolean("kubejs_bossActivated", false);
  boss.persistentData.putDouble("kubejs_activationRange", 24.0);
  boss.persistentData.putInt("kubejs_bossChunkX", chunkX);
  boss.persistentData.putInt("kubejs_bossChunkZ", chunkZ);
  boss.persistentData.putBoolean("kubejs_personalized_boss", true);
  boss.persistentData.putString("boss_type", config.classe);
}

function setupMountPersistentData(mount: $Entity, bossUUID: string): void {
  mount.persistentData.putBoolean("kubejs_boss_mount", true);
  mount.persistentData.putString("kubejs_boss_passenger_uuid", bossUUID);
}

function applyBossEffects(boss: $LivingEntity, config: IMiniBoss): void {
  applyEquipmentToBoss(boss, config.equipment);
  if (config.specialAbilities) {
    applyBossPotions(boss, config.specialAbilities);
  }
}

function finalizeSpawn(server: $ServerLevel, x: number, y: number, z: number, chunkX: number, chunkZ: number): void {
  let minecraftServer = server.getServer();
  minecraftServer.runCommandSilent(`forceload add ${chunkX * 16} ${chunkZ * 16}`);
  minecraftServer.runCommandSilent(`particle minecraft:explosion_emitter ${x} ${y + 1} ${z} 1 1 1 0.5 10 force`);
  minecraftServer.runCommandSilent(`particle minecraft:soul_fire_flame ${x} ${y} ${z} 2 2 2 0.1 100 force`);
  minecraftServer.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${x} ${y} ${z} 3 0.8`);
  // console.log(`[MSMP] Boss finalizado na chunk ${chunkX}, ${chunkZ}`);
}

function spawnBossAtPositionMulti(server: $ServerLevel, pendingBoss: PendingBossData): void {
  let config = pendingBoss.config;
  let x = pendingBoss.x;
  let y = pendingBoss.y;
  let z = pendingBoss.z;
  let spawnDay = pendingBoss.spawnDay;
  let chunkX = Math.floor(x / 16);
  let chunkZ = Math.floor(z / 16);

  if (!server.getChunk(chunkX, chunkZ)) {
    console.log(`[MULTI-BOSS] ERRO: Chunk não carregado em ${chunkX}, ${chunkZ}`);
    return;
  }

  server.getServer().scheduleInTicks(5, () => {
    if (config.mount) {
      spawnMountedBoss(server, config, x, y, z, spawnDay, chunkX, chunkZ);
    } else {
      spawnStandardBoss(server, config, x, y, z, spawnDay, chunkX, chunkZ);
    }
  });
}

function spawnMountedBoss(server: $ServerLevel, config: IMiniBoss, x: number, y: number, z: number, spawnDay: number, chunkX: number, chunkZ: number): void {
  // 1. Criar o cavalo (mount)
  let mount = createMountEntity(server, config.mount, x, y, z);
  if (!mount) return;

  // 2. Criar o boss como uma entidade viva separada
  let boss = server.createEntity(config.id as any);
  if (!boss) {
    console.log(`[MULTI-BOSS] Falha ao criar boss para montaria: ${config.id}`);
    return;
  }

  // 3. Configurar o boss (posicionamento e atributos)
  setupBaseEntity(boss, config, x, y, z);
  let living = asLiving(boss);
  if (!living) return;
  basicStatusEnemys(living, config);

  // 4. Spawnar ambos no mundo
  mount.spawn();
  living.spawn();

  // 5. Forçar a montaria (A mágica acontece aqui)
  // true = forçar mesmo que o assento esteja ocupado
  living.startRiding(mount, true);

  // 6. Finalizar setup no próximo tick para garantir que o UUID existe
  server.getServer().scheduleInTicks(2, () => {
    if (living.isAlive() && living.isAddedToLevel()) {
      setupBossPersistentData(living, config, chunkX, chunkZ);
      setupMountPersistentData(mount, living.uuid.toString());
      applyBossEffects(living, config);
      finalizeSpawn(server, x, y, z, chunkX, chunkZ);
      registerActiveBoss(living, config, spawnDay, server.getServer());

      console.log(`[MULTI-BOSS] Boss ${config.name} montado com SUCESSO. Boss: ${living.uuid} em cima de ${mount.uuid}`);
    }
  });
}

function spawnStandardBoss(server: $ServerLevel, config: IMiniBoss, x: number, y: number, z: number, spawnDay: number, chunkX: number, chunkZ: number): void {
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

  basicStatusEnemys(living, config);
  boss.spawn();

  server.getServer().scheduleInTicks(1, () => {
    if (living.isAlive() && living.isAddedToLevel()) {
      setupBossPersistentData(living, config, chunkX, chunkZ);
      applyBossEffects(living, config);
      finalizeSpawn(server, x, y, z, chunkX, chunkZ);
      registerActiveBoss(living, config, spawnDay, server.getServer());

      console.log(`[MULTI-BOSS] Boss ${config.name} spawnado com UUID: ${living.uuid}`);
    }
  });
}

function createMountEntity(server: $ServerLevel, mountConfig: MountConfig, x: number, y: number, z: number): $Entity | null {
  let mount = server.createEntity(mountConfig.id as any);
  if (!mount) {
    console.log(`[MULTI-BOSS] Falha ao criar mount: ${mountConfig.id}`);
    return null;
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
  server.setChunkForced(chunkX, chunkZ, true);
  server.runCommandSilent(`particle minecraft:explosion_emitter ${x} ${y + 1} ${z} 1 1 1 0.5 10 force`);
  server.runCommandSilent(`particle minecraft:soul_fire_flame ${x} ${y} ${z} 2 2 2 0.1 100 force`);
  server.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${x} ${y} ${z} 3 0.8`);
}

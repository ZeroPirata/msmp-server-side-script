function prepareBossSpawnMulti(server: $ServerLevel, bossConfig: IMiniBoss, x: number, y: number, z: number, spawnDay: number): void {
  let spawnPos = new BlockPos(x, y, z);
  forceLoadBossChunk(server, spawnPos);

  let pendingBoss: PendingBossData = {
    config: bossConfig,
    x: x,
    y: y,
    z: z,
    activationRange: 64.0,
    spawnDay: spawnDay
  };

  pendingBosses.push(pendingBoss);

  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
  server.runCommandSilent(`tellraw @a "§c§l💥 ALERTA DE INVASÃO IMINENTE! 💥"`);
  server.runCommandSilent(`tellraw @a "§6LOCALIZAÇÃO: X:§a${Math.floor(x)}§6 | Y:§a${Math.floor(y)}§6 | Z:§a${Math.floor(z)}"`);
  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
}

function checkPendingBosses(server: $ServerLevel): void {
  let toRemove: number[] = [];

  for (let index = 0; index < pendingBosses.length; index++) {
    let pendingBoss = pendingBosses[index];
    let config = pendingBoss.config;
    let x = pendingBoss.x;
    let y = pendingBoss.y;
    let z = pendingBoss.z;
    let activationRange = pendingBoss.activationRange;

    let nearbyPlayers = server.players.filter((player) => {
      if (player.isSpectator() || !player.isAlive()) return false;
      let playerPos = player.position();
      let distance = Math.sqrt(Math.pow(playerPos.x - x, 2) + Math.pow(playerPos.y - y, 2) + Math.pow(playerPos.z - z, 2));

      return distance <= activationRange;
    });

    if (nearbyPlayers.length > 0) {
      spawnBossAtPositionMulti(server, pendingBoss);
      toRemove.push(index);
    }
  }

  for (let i = toRemove.length - 1; i >= 0; i--) {
    pendingBosses.splice(toRemove[i], 1);
  }
}

function spawnBossAtPositionMulti(server: $ServerLevel, pendingBoss: PendingBossData): void {
  let config = pendingBoss.config;
  let x = pendingBoss.x;
  let y = pendingBoss.y;
  let z = pendingBoss.z;
  let spawnDay = pendingBoss.spawnDay;
  let chunkX = Math.floor(x / 16);
  let chunkZ = Math.floor(z / 16);

  let chunk = server.getChunk(chunkX, chunkZ);
  if (!chunk) {
    console.log(`[MULTI-BOSS] ERRO: Chunk não carregado em ${chunkX}, ${chunkZ}`);
    return;
  }

  let mineServer = server.getServer();

  mineServer.scheduleInTicks(5, () => {
    let boss = server.createEntity(config.id as any);
    if (!boss) {
      console.log(`[MULTI-BOSS] Falha ao criar boss: '${config.id}'`);
      removeBossChunkForceLoadMulti(server, chunkX, chunkZ);
      return;
    }

    boss.nbt.putString("DeathLootTable", "minecraft:empty");
    boss.nbt.putByte("PersistenceRequired", 1);
    boss.nbt.putInt("DespawnDelay", -1);
    boss.nbt.putBoolean("CanPickUpLoot", false);
    boss.nbt.putBoolean("NoAI", true);
    boss.nbt.putBoolean("CustomPersistenceRequired", true);

    boss.setPos(x + 0.5, y, z + 0.5);
    boss.setCustomName(config.name);
    boss.setCustomNameVisible(true);

    let living = asLiving(boss);
    if (!living) {
      console.log(`[MULTI-BOSS] Erro ao criar boss: ${config.id}`);
      removeBossChunkForceLoadMulti(server, chunkX, chunkZ);
      return;
    }

    basicStatusEnemys(living, config);
    living.health = config.health;
    living.maxHealth = config.health;

    if (config.specialAbilities) {
      applyBossPotions(living, config.specialAbilities);
    }

    living.nbt.merge({ DeathLootTable: "minecraft:empty" });

    living.persistentData.putBoolean("kubejs_customDrops", true);
    living.persistentData.putString("kubejs_damageTracker", JSON.stringify({}));
    living.persistentData.putBoolean("kubejs_bossActivated", false);
    living.persistentData.putDouble("kubejs_activationRange", 24.0);
    living.persistentData.putInt("kubejs_bossChunkX", chunkX);
    living.persistentData.putInt("kubejs_bossChunkZ", chunkZ);
    living.persistentData.putBoolean("kubejs_personalized_boss", true);
    living.persistentData.putString("boss_type", config.classe);

    boss.spawn();

    mineServer.scheduleInTicks(1, () => {
      if (living && living.isAlive() && living.isAddedToLevel()) {
        applyEquipmentToBoss(living, config.equipment);
        server.setChunkForced(chunkX, chunkZ, true);
        server.runCommandSilent(`particle minecraft:explosion_emitter ${x} ${y + 1} ${z} 1 1 1 0.5 10 force`);
        server.runCommandSilent(`particle minecraft:soul_fire_flame ${x} ${y} ${z} 2 2 2 0.1 100 force`);
        server.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${x} ${y} ${z} 3 0.8`);
        registerActiveBoss(living, config, spawnDay, mineServer);
      } else {
        console.log(`[MULTI-BOSS] ERRO: Boss ${config.name} não foi adicionado ao mundo corretamente!`);
        removeBossChunkForceLoadMulti(server, chunkX, chunkZ);
      }
    });
  });
}

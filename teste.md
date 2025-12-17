Olá, eu estou usando KubeJS para criar um sistema de bosses customizados em um servidor de Minecraft usando typescript.
O que eu quero fazer agora é uma coisa que está me deixando meio paranoico, onde é mudar o modo que o boss é feito, não quero mais ter 1 boss por noite, eu quero ter uma quantidade X que vai ser definida dentro do meu json de configuração.
Esse JSON de configuração é esse aqui:

```typescript
let DEFAULT_CONFIG = {
  DELAY_TICKS: 1 * 60 * 20,
  SPAWN_SAFE_RADIUS: 0,
  MIN_DISTANCE: 0,
  MAX_DISTANCE: 10,
  MIN_DAY: 1,
  CHANCE_PERCENT: 1.0
};
```

Onde ele é carregado automaticamente quando o servidor inicia. a função que faz o gerenciamento dos itens dele é este aqui, onde ele vai me retornar a chave que eu tenho para usar dentro do proprio minecraft um `/msmpConfig MAX_BOSS_NIGHT`, porém essa parte já está configurada, você só tem que saber que você vai utilizar essa função para pegar o `MAX_BOSS_NIGHT` e fazer condicionais.

```typescript
function getMsmpConfig(server: $MinecraftServer): any {
  let data = server.persistentData.getString(CONFIG_KEY);

  if (!data) {
    server.persistentData.putString(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }

  try {
    return Object.assign({}, DEFAULT_CONFIG, JSON.parse(data));
  } catch (e) {
    console.error(`[MSMP Config] Erro ao carregar configuração: ${e}`);
    return DEFAULT_CONFIG;
  }
}
```

As regras que eu tenho que ter é praticamente isso aqui:

1. Não vai existir mais do que `MAX_BOSS_NIGHT` por noite.
2. Caso ninguem mate o boss daquela noite, ele ficará até ser ativado e derrotado
3. Caso 1 boss seja derrotado, ficará algo entre 4/5 onde se for na mesma noite e tiver ultrapassado o `NUMERO MAXIMO DE TENTATIVAS PARA GERAR BOSS` que é outra configuração global, ele não vai fazer nada, a não ser que ele tenha possibilidade ainda de invocar o boss.
4. Caso o numero maximo seja atingido de tentativas de invocação, a noite para e só vai tentar na proxima, resetando os valores de tentativa para 0 (essa é uma variavel dentro do meu main.ts que é `let tentativaPorDia = 0`). onde na proxima notie ele vai fazer o incremento até chegar na variavel de limite
5. O boss só vai spawanr quando o player chegar perto do `desafio` caso ele não chegue perto, ele só vai armazenar o boss dentro de uma lista onde vai fazer a invocação quando o player chegar perto.
6. Os bosses vão ter nivel de dificuldade, onde por exemplo existe 5 categorias sendo elas `Facil, Normal, Médio, Dificil, Raid` onde cada um tem a sua chance de nascer pelo dia (levando em conta que é 5 boss, mas a chance de uma noite só de RAID tem que ser impossivel, tem que balancar deixando quanto mais dificil menos chance).
7. O boss não pode spawanr perto do outro, eles tem que nascer pelo menos uma distancia de 200 até 250 blocos.

Para te ajudar aqui está algumas partes que vão ter que ser adaptados, pois hoje só é spawnado 1 boss por noite.

Evento Principal:

```typescript
ServerEvents.tick((e) => {
  let level = e.server;
  let msmpConfig = getMsmpConfig(level);
  if (msmpConfig === null) return;
  let { boss, config }: { boss: $LivingEntity; config: IMiniBoss } = getBossActive(level);
  if (boss && boss.isAlive() && boss.isAddedToLevel()) {
    bossPhases(boss, config, level);
    bossActivationCheckTimer++;
    if (bossActivationCheckTimer >= 20) {
      bossActivationCheckTimer = 0;
      checkBossActivation(level, boss);
    }
    return;
  }
  if (boss && !boss.isAlive()) {
    removeBossChunkForceLoad(level.overworld());
    pendingBossSpawn = null;
  }
  if (pendingBossSpawn !== null) {
    checkPendingBossActivation(level.overworld(), pendingBossSpawn);
    return;
  }
  let overworld = level.overworld();
  let isNight = overworld.isNight();
  if (!isNight) return;
  let lastBossSpawnDay = level.persistentData.getInt(TAG_LAST_DAY);
  let day = Math.floor(overworld.getDayTime() / 24000);
  if (day < msmpConfig.MIN_DAY) return;
  if (lastBossSpawnDay === day) return;
  let roll = randomBetween(1, 100);
  if (roll > msmpConfig.CHANCE_PERCENT) return;
  lastBossSpawnDay = day;
  level.persistentData.putInt(TAG_LAST_DAY, day);
  let bossConfig = getRandomBoss();
  let pos = generateRandomPositionBoss(overworld);
  prepareBossSpawn(overworld, bossConfig, pos.getX(), pos.getY(), pos.getZ());
});
```

Função que é responsval por ficar fazendo o gerenciamento do boss para ativação quando o player chegar perto dele:

```typescript
function checkBossActivation(server: $MinecraftServer, boss: $LivingEntity) {
  if (boss.persistentData.getBoolean("kubejs_bossActivated")) return;

  let activationRange = boss.persistentData.getDouble("kubejs_activationRange") || 32.0;
  let bossPos = boss.position();

  let level = boss.level as $ServerLevel;
  let nearbyPlayers = level.players.filter((player) => {
    if (player.isSpectator() || !player.isAlive()) return false;
    let playerPos = player.position();
    let distance = Math.sqrt(Math.pow(playerPos.x - bossPos.x, 2) + Math.pow(playerPos.y - bossPos.y, 2) + Math.pow(playerPos.z - bossPos.z, 2));
    return distance <= activationRange;
  });

  if (nearbyPlayers.length > 0) {
    activateBoss(boss, nearbyPlayers[0], level);
  }
}

function activateBoss(boss: $LivingEntity, player: $ServerPlayer, level: $ServerLevel) {
  boss.nbt.putBoolean("NoAI", false);
  boss.persistentData.putBoolean("kubejs_bossActivated", true);

  let bossName = boss.customName?.getString() || "Boss";

  level.runCommandSilent(`particle minecraft:explosion_emitter ${boss.x} ${boss.y + 1} ${boss.z} 0 0 0 1 5 force`);
  level.runCommandSilent(`particle minecraft:flame ${boss.x} ${boss.y} ${boss.z} 1 1 1 0.1 50 force`);
  level.runCommandSilent(`playsound minecraft:entity.ender_dragon.growl hostile @a ${boss.x} ${boss.y} ${boss.z} 2 0.8`);

  boss.potionEffects.add("minecraft:strength", 200, 1, false, false);
  boss.potionEffects.add("minecraft:speed", 200, 0, false, false);
}

function removeBossChunkForceLoad(level: $ServerLevel) {
  if (bossChunkPositions.length === 0) return;
  bossChunkPositions.forEach((chunk) => {
    level.setChunkForced(chunk.x, chunk.z, false);
  });
  bossChunkPositions = [];
}
```

Função que verifica se há algum valor o objeto de boss pendente:

```typescript
function checkPendingBossActivation(server: $ServerLevel, pendingBoss: typeof pendingBossSpawn): void {
  if (!pendingBoss) return;

  let { config, x, y, z, activationRange } = pendingBoss;

  let nearbyPlayers = server.players.filter((player) => {
    if (player.isSpectator() || !player.isAlive()) return false;

    let playerPos = player.position();
    let distance = Math.sqrt(Math.pow(playerPos.x - x, 2) + Math.pow(playerPos.y - y, 2) + Math.pow(playerPos.z - z, 2));

    return distance <= activationRange;
  });

  if (nearbyPlayers.length > 0) {
    let player = nearbyPlayers[0];
    spawnBossAtPosition(server, config, x, y, z);
    pendingBossSpawn = null;
  }
}
```

Essa função é a mais importante se você parar para pensar, pois ela faz a criação do boss em si:

```typescript
function spawnBossAtPosition(server: $ServerLevel, bossConfig: IMiniBoss, x: number, y: number, z: number): void {
  let chunkX = Math.floor(x / 16);
  let chunkZ = Math.floor(z / 16);

  let chunk = server.getChunk(chunkX, chunkZ);
  if (!chunk) {
    console.log(`[MSMP] ERRO: Chunk não está carregado em ${chunkX}, ${chunkZ}`);
    return;
  }

  let mineServer = server.getServer();

  mineServer.scheduleInTicks(5, () => {
    let boss = server.createEntity(bossConfig.id as any);
    if (!boss) {
      console.log(`[MSMP] Falha ao criar boss: tipo inválido '${bossConfig.id}'`);
      removeBossChunkForceLoad(server);
      pendingBossSpawn = null;
      return;
    }

    boss.nbt.putString("DeathLootTable", "minecraft:empty");
    boss.nbt.putByte("PersistenceRequired", 1);
    boss.nbt.putInt("DespawnDelay", -1);
    boss.nbt.putBoolean("CanPickUpLoot", false);
    boss.nbt.putBoolean("NoAI", true);
    boss.nbt.putBoolean("CustomPersistenceRequired", true);

    boss.setPos(x + 0.5, y, z + 0.5);
    boss.setCustomName(bossConfig.name);
    boss.setCustomNameVisible(true);

    let living = asLiving(boss);
    if (!living) {
      console.log(`[MSMP] Erro ao criar o boss: ${bossConfig.id}`);
      removeBossChunkForceLoad(server);
      pendingBossSpawn = null;
      return;
    }

    basicStatusEnemys(living, bossConfig);

    living.health = bossConfig.health;
    living.maxHealth = bossConfig.health;

    if (bossConfig.specialAbilities) {
      applyBossPotions(living, bossConfig.specialAbilities);
    }

    living.nbt.merge({ DeathLootTable: "minecraft:empty" });

    living.persistentData.putBoolean("kubejs_customDrops", true);
    living.persistentData.putString("kubejs_damageTracker", JSON.stringify({}));
    living.persistentData.putBoolean("kubejs_bossActivated", false);
    living.persistentData.putDouble("kubejs_activationRange", 24.0);
    living.persistentData.putInt("kubejs_bossChunkX", chunkX);
    living.persistentData.putInt("kubejs_bossChunkZ", chunkZ);
    living.persistentData.putBoolean("kubejs_personalized_boss", true);
    living.persistentData.putString("boss_type", bossConfig.classe);
    applyBossPotions(living, bossConfig.specialAbilities);
    boss.spawn();
    applyEquipmentToBoss(living, bossConfig.equipment);
    server.setChunkForced(chunkX, chunkZ, true);

    server.runCommandSilent(`particle minecraft:explosion_emitter ${x} ${y + 1} ${z} 1 1 1 0.5 10 force`);
    server.runCommandSilent(`particle minecraft:soul_fire_flame ${x} ${y} ${z} 2 2 2 0.1 100 force`);
    server.runCommandSilent(`playsound minecraft:entity.wither.spawn hostile @a ${x} ${y} ${z} 3 0.8`);

    let mineServer = server.getServer();
    createBossBar(mineServer, `${bossConfig.name} - Aguardando...`, "PURPLE", "PROGRESS");
    setBossActive(living, bossConfig);
  });
}

function basicStatusEnemys(mob: $LivingEntity, e: IEnemy): void {
  mob.getAttribute("minecraft:generic.max_health")?.setBaseValue(e.health || 20);
  mob.health = e.health;
  mob.getAttribute("minecraft:generic.attack_damage")?.setBaseValue(e.attack || 2);
  mob.getAttribute("minecraft:generic.armor")?.setBaseValue(e.armor || 0);
  mob.getAttribute("minecraft:generic.armor_toughness")?.setBaseValue(e.armorToughness || 0);
  mob.getAttribute("minecraft:generic.movement_speed")?.setBaseValue(e.speed || 0.25);
}

function setBossActive(boss: $LivingEntity, config: IMiniBoss): void {
  let server = boss.level.server;
  server.persistentData.putString("kubejs_active_boss_uuid", boss.uuid.toString());
  server.persistentData.putString("kubejs_active_boss_config", JSON.stringify(config));
}
```

Essa função garante a aleatoriedade do boss, vamos ter que mudar ela para deixar o nivel de improtancia e também verificar se por exemplo, já foi criado 1 Raid, então não é mais pra criar um boss de raid, pois na noite ele atingiu o maximo de bosses daquela dificuldade

```typescript
function getRandomBoss(): IMiniBoss {
  let totalWeight = MINIBOSSES.reduce((sum, boss) => sum + boss.spawnWeight, 0);
  let random = Math.random() * totalWeight;
  for (let boss of MINIBOSSES) {
    random -= boss.spawnWeight;
    if (random <= 0) {
      return boss;
    }
  }
  return MINIBOSSES[0];
}
```

Essa função é a que prepara o boss e adiciona ao objeto:

```typescript
function prepareBossSpawn(server: $ServerLevel, bossConfig: IMiniBoss, x: number, y: number, z: number): void {
  if (server.persistentData.getBoolean("kubejs_bossActivated")) return;

  let spawnPos = new BlockPos(x, y, z);
  forceLoadBossChunk(server, spawnPos);

  pendingBossSpawn = {
    config: bossConfig,
    x: x,
    y: y,
    z: z,
    activationRange: 64.0
  };

  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
  server.runCommandSilent(`tellraw @a "§c§l💥 ALERTA DE INVASÃO IMINENTE! 💥"`);
  server.runCommandSilent(`tellraw @a "§6LOCALIZAÇÃO: X:§a${Math.floor(x)}§6 | Y:§a${Math.floor(y)}§6 | Z:§a${Math.floor(z)}"`);
  server.runCommandSilent(`tellraw @a "§6§l§m--------------------------------"`);
}
```

Função para pegar o boss ativo:

```typescript
function getBossActive(server: $MinecraftServer): { boss: $LivingEntity | null; config: IMiniBoss | null } {
  let uuid = server.persistentData.getString("kubejs_active_boss_uuid");
  let configJson = server.persistentData.getString("kubejs_active_boss_config");

  if (!uuid || !configJson) return { boss: null, config: null };

  let foundBoss: $LivingEntity | null = null;
  server.overworld().entities.forEach((entity) => {
    if (entity.uuid.toString() === uuid) {
      foundBoss = entity as $LivingEntity;
    }
  });

  return {
    boss: foundBoss,
    config: JSON.parse(configJson)
  };
}
```

Função para ativar as habilidade do boss e gerenciar a vida dela, onde aqui vai ser um pouco mais complexo, pois teremos que mudar completametne como funciona a barra de vida do boss, já que hoje eu só faço um `msmp:boss_bar`, como terá vários boss juntos teremos que pensar em como faremos a criação dessa boss bar, levando em conta se usamos o uuid do boss, não pdoera conter caracters do tipo `-` pois não é aceito.

```typescript
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
  let nameBoss = "";

  updateBossBarName(`${config.name} - §7[${percentDisplay}%]`);
  if (!config.phases) return;
  let finalPhase = config.phases[activePhaseIndex];
  updateBossBarColor(finalPhase.bossBarColor || "GREEN");
  updateBossBarOverlay(finalPhase.bossBarOverlay || "PROGRESS");
  executePhaseAbilities(boss, finalPhase || null, level);
}
```

funções da barra de vida do boss que tera que ser adaptado também.

```typescript
function createBossBar(server: $MinecraftServer, bossName: string, color, overlay: string) {
  let bossBarId;
  try {
    bossBarId = new ResourceLocation("msmp", "boss_bar");
  } catch (e) {
    console.log("[BOSS BAR] Tentando método alternativo...");
    bossBarId = ResourceLocation.of("msmp:boss_bar");
  }
  color = color || "RED";
  overlay = overlay || "PROGRESS";
  if (activeBossBar) {
    removeBossBar(server);
  }
  let barColor = BossBarColor[color] || BossBarColor.RED;
  let barOverlay = BossBarOverlay[overlay] || BossBarOverlay.PROGRESS;
  let bossBar = server.customBossEvents.create(
    bossBarId, // ID único
    Text.of(bossName)
  );
  bossBar.setColor(barColor);
  bossBar.setOverlay(barOverlay);
  bossBar.setDarkenScreen(false);
  bossBar.setPlayBossMusic(true);
  bossBar.setCreateWorldFog(false);
  activeBossBar = bossBar;
  return bossBar;
}

function updateBossBarName(newName: string): void {
  if (!activeBossBar) return;
  activeBossBar.name = Text.of(newName);
}

function updateBossBarColor(color: string): void {
  if (!activeBossBar) return;
  let barColor = BossBarColor[color] || BossBarColor.RED;
  activeBossBar.setColor(barColor);
}

function updateBossBarOverlay(overlay: string): void {
  if (!activeBossBar) return;
  let barOverlay = BossBarOverlay[overlay] || BossBarOverlay.PROGRESS;
  activeBossBar.setOverlay(barOverlay);
}

function updateBossBarProgress(progress: number): void {
  if (!activeBossBar) return;
  activeBossBar.setProgress(progress);
}

function removeBossBar(server: $MinecraftServer): void {
  if (!activeBossBar) return;
  activeBossBar.removeAllPlayers();
  server.customBossEvents.remove(activeBossBar);
  activeBossBar = null;
  console.log(`[BOSS BAR] Removida`);
}

function removePlayerFromBossBar(player: $ServerPlayer): void {
  if (!activeBossBar) return;
  activeBossBar.removePlayer(player);
}
```

Além disso, ainda tem a parte de gerenciamento de usuarios e morte do boss e quando ele recebe algum ataque que terá que ser adaptado também, como por exemplo a morte do boss:

```typescript
EntityEvents.afterHurt((event) => {
  let e = event.entity;
  let pd = e.persistentData;

  if (!pd.contains("kubejs_customDrops")) return;
  let source = event.source.actual;

  if (!source || !source.isPlayer()) return;
  let player = source;
  let damage = event.damage;

  let bossUUID = e.uuid.toString();
  let playerUUID = player.uuid.toString();

  if (!damageAccumulator.has(bossUUID)) {
    damageAccumulator.set(bossUUID, new Map());
  }

  let bossTracker = damageAccumulator.get(bossUUID);
  let currentDamage = bossTracker.get(playerUUID) || 0;
  bossTracker.set(playerUUID, currentDamage + damage);
});

EntityEvents.death((event) => {
  let entity = event.entity;
  let level = entity.level;
  let server = event.server;
  let pd = entity.persistentData;

  if (!pd.contains("kubejs_customDrops")) return;

  let msmpConfig = getMsmpConfig(server);
  if (msmpConfig === null) {
    console.log(`[BOSS DEATH] ERRO: msmpConfig é null!`);
    return;
  }

  let { boss, config } = getBossActive(server);
  if (!boss || !config) {
    console.log(`[BOSS DEATH] ERRO: Boss ou config não encontrado!`);
    return;
  }

  let bossUUID = entity.uuid.toString();
  let source = event.source.actual;
  if (source && source.isPlayer()) {
    let playerUUID = source.uuid.toString();
    let maxHealth = entity.maxHealth;
    if (!damageAccumulator.has(bossUUID)) {
      damageAccumulator.set(bossUUID, new Map());
    }
    let bossTracker = damageAccumulator.get(bossUUID);
    let currentTotal = 0;
    bossTracker.forEach((dmg) => (currentTotal += dmg));
    let missingDamage = maxHealth - currentTotal;
    if (missingDamage > 0) {
      let currentDamage = bossTracker.get(playerUUID) || 0;
      bossTracker.set(playerUUID, currentDamage + missingDamage);
      console.log(`[BOSS DEATH] Adicionando ${missingDamage} de dano final para ${source.username}`);
    }
  }

  if (damageAccumulator.has(bossUUID)) {
    let tracker = damageAccumulator.get(bossUUID);
    let existingTracker = pd.getString("kubejs_damageTracker");
    let fullTracker: DamageTracker = existingTracker ? JSON.parse(existingTracker) : {};

    tracker.forEach((damage, playerUUID) => {
      if (!fullTracker[playerUUID]) {
        let player = server.getPlayerList().getPlayer(playerUUID);
        fullTracker[playerUUID] = {
          playerName: player?.username || "Desconhecido",
          damage: 0
        };
      }
      fullTracker[playerUUID].damage += damage;
    });

    pd.putString("kubejs_damageTracker", JSON.stringify(fullTracker));
    damageAccumulator.delete(bossUUID);
  }

  if (pd.contains("kubejs_damageTracker")) {
    let trackerString = pd.getString("kubejs_damageTracker");
    let tracker = JSON.parse(trackerString);
    let uuids = Object.keys(tracker);

    if (uuids.length > 0) {
      let totalDamage = uuids.reduce((sum, u) => sum + tracker[u].damage, 0);
      let bossPos = entity.blockPosition();
      let totalOnlinePlayers = level.players.filter((p) => p && p.isAlive() && !p.isSpectator()).length;
      let playersToScale = Math.max(0, totalOnlinePlayers - 1);
      let dropMultiplier = 1.0 + playersToScale * (config.scaling?.dropMultiplierFactor ?? 0.15);

      let ranking = uuids.map((uuid) => {
        let data = tracker[uuid];
        return {
          uuid: uuid,
          playerName: data.playerName,
          damage: data.damage
        };
      });

      ranking.sort((a, b) => b.damage - a.damage);

      let winnerMessages: string[] = [];
      winnerMessages.push("§a=======================================");
      winnerMessages.push("§cBOSS DERROTADO! PARTICIPANTES DA RAID");
      winnerMessages.push("§a=======================================");

      let activePlayers: string[] = [];

      server.scheduleInTicks(5, () => {
        ranking.forEach((data, index) => {
          let rank = index + 1;
          let damagePercent = data.damage / totalDamage;
          let rankDisplay = rankingPlayersRaid(rank);
          let damageP = (damagePercent * 100).toFixed(1);
          winnerMessages.push(`${rankDisplay} §r- §b${data.playerName} §7(Dano: ${damageP}%)`);

          let lootTableSuffix = demageLootCalculate(damagePercent);
          let lootTable = `kubejs:${config.lootrName}_${lootTableSuffix}`;
          let offsetX = index * 2;
          let chestPos = new BlockPos(bossPos.x + offsetX, bossPos.y + 1, bossPos.z);
          let setblockCommand = `setblock ${chestPos.x} ${chestPos.y} ${chestPos.z} lootr:lootr_chest{LootTable:"${lootTable}",CustomName:'{"text":"§6${data.playerName}"}'} replace`;
          server.runCommandSilent(setblockCommand);

          let chestKey = getChestKey(chestPos);
          let key = getPlayerChestKey(chestKey, data.uuid);
          let save: PlayerChestData = {
            lootTable: lootTable,
            damagePercent: damagePercent,
            used: false,
            dropMultiplier: dropMultiplier
          };
          server.persistentData.putString(key, JSON.stringify(save));
          saveChestKey(data.uuid, { pos: chestPos, ticks: 0 }, server);
          activePlayers.push(data.uuid);
          server.runCommandSilent(`particle minecraft:totem_of_undying ${chestPos.x + 0.5} ${chestPos.y + 1} ${chestPos.z + 0.5} 0.2 0.2 0.2 0.05 15 force @a`);
        });

        saveActiveChestPlayers(activePlayers, server);
        winnerMessages.push("§a=======================================");
        winnerMessages.forEach((line) => {
          server.runCommandSilent(`execute positioned ${bossPos.x} ${bossPos.y} ${bossPos.z} run tellraw @a[distance=..64] "${line}"`);
        });
        let minutes = msmpConfig.DELAY_TICKS / 1200;
        activePlayers.forEach((uuid) => {
          let player = server.getPlayerList().getPlayer(uuid);
          if (player) {
            player.tell(`§eO baú irá desaparecer em ${minutes} minutos!`);
          }
        });
      });
    }
  }

  pd.remove("kubejs_damageTracker");
  pd.remove("kubejs_isEnraged");
  pd.remove("kubejs_maxHealth");
  pd.remove("kubejs_bossActivated");
  pd.remove("kubejs_activationRange");
  for (let i = 0; i < 10; i++) {
    pd.remove(`phase_${i}_crystals`);
    pd.remove(`phase_${i}_crystalDamage`);
    pd.remove(`phase_${i}_crystalsCleared`);
    pd.remove(`phase_${i}_inRitual`);
    pd.remove(`phase_${i}_ritualStartTick`);
    pd.remove(`phase_${i}_baseDamage`);
    for (let j = 0; j < 20; j++) {
      pd.remove(`phase_${i}_ability_${j}_lastTick`);
    }
  }
  pd.remove("currentPhase");
  pd.remove("lastPhaseChangeTick");
});
```

Parte do usuario para remover a barra de vida e não aparecer o titulo do boss:
```typescript
PlayerEvents.tick((e) => {
  if (e.player.level.time % 20 !== 0) return;
  let bossBar: $CustomBossEvent = activeBossBar;
  if (!bossBar) return;
  let server = e.server;
  let { boss, config }: { boss: $LivingEntity; config: IMiniBoss } = getBossActive(server);
  if (!boss || !boss.isAlive()) {
    bossBar.removePlayer(e.player);
    return;
  }
  let position = e.player.blockPosition();
  let bossPosition = boss.blockPosition();
  let distance = position.distSqr(bossPosition);
  const VISIBILITY_RANGE = 32 * 32; // 1024 blocks
  let hasBossBar = bossBar.getPlayers().contains(e.player);
  let playerUuid = e.player.stringUuid;
  let bossUuid = boss.stringUuid;
  if (distance > VISIBILITY_RANGE) {
    if (hasBossBar) {
      bossBar.removePlayer(e.player);
    }
    return;
  }
  if (!hasBossBar) {
    bossBar.addPlayer(e.player);
    if (!hasPlayerSeenBoss(playerUuid, bossUuid, server)) {
      showBossIntroduction(e.player, boss, config, server);
      markBossAsSeen(playerUuid, bossUuid, server);
    }
  }
});
```
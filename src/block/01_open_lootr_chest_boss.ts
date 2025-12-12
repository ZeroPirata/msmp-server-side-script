BlockEvents.rightClicked((event) => {
  let block = event.block;
  let player = event.player;
  let level = event.level;
  let server = level.server;

  if (level.isClientSide()) return;
  if (block.id !== "lootr:lootr_chest") return;

  let chestPos = block.pos;
  let playerUuid = player.uuid.toString();
  let chestKey = getChestKey(chestPos);
  let playerKey = getPlayerChestKey(chestKey, playerUuid);

  let hasPermission = server.persistentData.contains(playerKey);
  let activePlayers = getActiveChestPlayers(server);
  let isRegisteredChest = false;
  let ownerName = null;

  for (let playerName of activePlayers) {
    let chestData = loadChestKey(playerName, server);
    if (chestData && chestData.pos.x === chestPos.x && chestData.pos.y === chestPos.y && chestData.pos.z === chestPos.z) {
      isRegisteredChest = true;
      ownerName = playerName;
      break;
    }
  }

  if (isRegisteredChest && !hasPermission) {
    event.cancel();
    player.sendSystemMessage(Text.red("⚠ Este baú pertence a outro jogador!"));
    player.sendSystemMessage(Text.gold(`Dono: ${ownerName}`));
    player.level.playSound(null, player.blockPosition(), "minecraft:block.chest.locked", "blocks", 1.0, 1.0);
    return;
  }

  if (!server.persistentData.contains(playerKey)) {
    if (isRegisteredChest && hasPermission) {
      console.log(`[MSMP] ${player.name.getString()} abriu seu baú (Sem Recompensas)`);
    }
    return;
  }

  let data = JSON.parse(server.persistentData.getString(playerKey)) as PlayerChestData;

  if (data.used) {
    player.tell("§eVocê já pegou suas recompensas!");
    event.cancel();
    return;
  }

  let lootMultiplier = data.dropMultiplier ?? 1.0;

  server.scheduleInTicks(2, () => {
    if (lootMultiplier > 1.0) {
      let extraRolls = Math.floor(lootMultiplier - 1.0);
      let chanceForExtraRoll = lootMultiplier - 1.0 - extraRolls;

      for (let i = 0; i < extraRolls; i++) {
        server.runCommandSilent(`loot spawn ${chestPos.x + 0.5} ${chestPos.y + 1} ${chestPos.z + 0.5} loot ${data.lootTable}`);
      }

      if (Math.random() < chanceForExtraRoll) {
        server.runCommandSilent(`loot spawn ${chestPos.x + 0.5} ${chestPos.y + 1} ${chestPos.z + 0.5} loot ${data.lootTable}`);
      }

      player.tell(`§6§l+${((lootMultiplier - 1.0) * 100).toFixed(0)}% Loot Extra!`);
    }

    data.used = true;
    server.persistentData.putString(playerKey, JSON.stringify(data));
    player.tell(`§a§l✔ Você recebeu suas recompensas!`);
    player.playSound("minecraft:entity.player.levelup", 1, 1);
  });
});

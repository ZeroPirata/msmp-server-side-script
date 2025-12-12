ServerEvents.tick((event) => {
  let server = event.server;
  let msmpConfig = getMsmpConfig(server);
  if (msmpConfig === null) return;
  if (server.tickCount % 20 !== 0) return;
  let activePlayers = getActiveChestPlayers(server);
  if (activePlayers.length === 0) return;
  let toRemove: string[] = [];
  activePlayers.forEach((playerName) => {
    let data = loadChestKey(playerName, server);
    if (!data) {
      toRemove.push(playerName);
      return;
    }
    data.ticks += 20;
    if (data.ticks >= msmpConfig.DELAY_TICKS) {
      let pos = data.pos;
      server.runCommandSilent(`setblock ${Math.floor(pos.x)} ${Math.floor(pos.y)} ${Math.floor(pos.z)} minecraft:air`);
      let player = server.players.find((p) => p.name.string === playerName);
      if (player) {
        player.tell("§c§l⚠ Seu baú de recompensas expirou!");
      }
      toRemove.push(playerName);
      removeChestKey(playerName, server);
    } else {
      saveChestKey(playerName, data, server);
      let remainingTicks = msmpConfig.DELAY_TICKS - data.ticks;
      let remainingSeconds = Math.floor(remainingTicks / 20);
      if (remainingSeconds === 30 || remainingSeconds === 10) {
        let player = server.players.find((p) => p.name.string === playerName);
        if (player) {
          player.tell(`§e⚠ Seu baú expira em §c${remainingSeconds}§e segundos!`);
        }
      }
    }
  });

  if (toRemove.length > 0) {
    let newActivePlayers = activePlayers.filter((name) => !toRemove.includes(name));
    saveActiveChestPlayers(newActivePlayers, server);
  }
});

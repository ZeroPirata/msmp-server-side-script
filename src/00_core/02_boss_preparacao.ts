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

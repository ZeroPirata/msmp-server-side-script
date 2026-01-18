import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";

function prepareBossSpawnMulti(server: $MinecraftServer, level: $ServerLevel, bossConfig: IMiniBoss, pos: $BlockPos, spawnDay: number, silent?: boolean): void {
  forceLoadBossChunk(level, pos);
  let pendingBoss: PendingBossData = {
    config: bossConfig,
    x: pos.getX(),
    y: pos.getY(),
    z: pos.getZ(),
    activationRange: 64.0,
    spawnDay: spawnDay
  };

  pendingBosses.push(pendingBoss);

  // Só mostrar mensagem se não for silent (usado para Blood Moon)
  if (!silent) {
    let x = Math.floor(pos.getX());
    let y = Math.floor(pos.getY());
    let z = Math.floor(pos.getZ());

    server.players.tell(Component.gold("§l--------------------------------"));
    server.players.tell(Component.red("§l💥 ALERTA DE INVASÃO IMINENTE! 💥"));
    server.players.tell([Component.gold("LOCALIZAÇÃO: "), Component.green(`X: ${x} | Y: ${y} | Z: ${z}`)]);
    server.players.tell(Component.gold("§l--------------------------------"));
  }
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

import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";

PlayerEvents.tick((e) => {
  if (e.player.level.time % 20 !== 0) return;
  let bossBar: $CustomBossEvent = activeBossBar;
  if (!bossBar) return;
  let server = e.server;
  let { boss }: { boss: $LivingEntity } = getBossActive(server);
  if (!boss || !boss.isAlive()) {
    bossBar.removePlayer(e.player);
    return;
  }
  let position = e.player.blockPosition();
  let bossPosition = boss.blockPosition();
  let distance = position.distSqr(bossPosition);
  const VISIBILITY_RANGE = 16 * 16;
  let hasBossBar = bossBar.getPlayers().contains(e.player);
  if (distance > VISIBILITY_RANGE) {
    if (hasBossBar) {
      bossBar.removePlayer(e.player);
    }
    return;
  }
  if (!hasBossBar) {
    bossBar.addPlayer(e.player);
  }
});

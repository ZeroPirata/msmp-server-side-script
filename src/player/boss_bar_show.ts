import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";

PlayerEvents.tick((e) => {
  let bossBar: $CustomBossEvent = activeBossBar;
  if (e.player.level.time % 20 !== 0) return;
  if (!bossBar) return;
  let position = e.player.blockPosition();
  let server = e.server;
  let { boss }: { boss: $LivingEntity } = getBossActive(server);
  if (!boss || !boss.isAlive()) return;
  let bossPosition = boss.blockPosition();
  let distance = position.distSqr(bossPosition);
  if (distance > 256 * 256) {
    activeBossBar.removePlayer(e.player);
    return;
  }
  let hasBossBar = bossBar.getPlayers().contains(e.player);
  if (hasBossBar) return;
  bossBar.addPlayer(e.player);
});

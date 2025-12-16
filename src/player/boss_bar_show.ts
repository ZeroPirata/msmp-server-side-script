import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";

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

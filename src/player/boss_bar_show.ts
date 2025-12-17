import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";

PlayerEvents.tick((e) => {
  if (e.player.level.time % 20 !== 0) return;

  let server = e.server;
  let player = e.player;
  let playerPos = player.blockPosition();
  let playerUuid = player.stringUuid;

  const VISIBILITY_RANGE = 32 * 32;

  // Para cada boss ativo, verifica se o player deve ver a barra
  let bossKeys = Object.keys(activeBosses);
  for (let i = 0; i < bossKeys.length; i++) {
    let formattedUuid = bossKeys[i];
    let bossData = activeBosses[formattedUuid];
    if (!bossData) continue;

    let boss = findBossByUuid(server, bossData.uuid);
    if (!boss || !boss.isAlive()) continue;

    let bossBarId = new ResourceLocation("msmp", `${bossData.bossBarId}`);
    let bossBar = server.customBossEvents.get(bossBarId);
    if (!bossBar) continue;

    let bossPosition = boss.blockPosition();
    let distance = playerPos.distSqr(bossPosition);

    let hasBossBar = bossBar.getPlayers().contains(player);

    if (distance > VISIBILITY_RANGE) {
      if (hasBossBar) {
        bossBar.removePlayer(player);
      }
      continue;
    }

    if (!hasBossBar) {
      bossBar.addPlayer(player);
      if (!hasPlayerSeenBoss(playerUuid, formattedUuid, server)) {
        showBossIntroduction(player, boss, bossData.config, server);
        markBossAsSeen(playerUuid, formattedUuid, server);
      }
    }
  }
});

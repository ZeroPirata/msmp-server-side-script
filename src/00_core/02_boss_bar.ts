import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";
import { $BossEvent$BossBarOverlay } from "net.minecraft.world.BossEvent$BossBarOverlay";

function createBossBarForBoss(server: $MinecraftServer, bossUuid: string, bossName: string, color: string, overlay: string): $CustomBossEvent {
  let bossUuidFormated = bossUuid.toString().split("-").join("").toLowerCase();
  let bossBarId = `${bossUuidFormated}`;

  let resourceLocation;
  try {
    resourceLocation = new ResourceLocation("msmp", bossBarId);
  } catch (e) {
    resourceLocation = ResourceLocation.of(`msmp:${bossBarId}`);
  }

  let barColor = BossBarColor[color] || BossBarColor.RED;
  let barOverlay = BossBarOverlay[overlay] || BossBarOverlay.PROGRESS;

  let bossBar = server.customBossEvents.create(resourceLocation, Text.of(bossName));
  bossBar.setColor(barColor);
  bossBar.setOverlay(barOverlay);
  bossBar.setDarkenScreen(false);
  bossBar.setPlayBossMusic(true);
  bossBar.setCreateWorldFog(false);
  return bossBar;
}

function updateBossBarForBoss(bossUuid: string, server: $MinecraftServer, name?: string, progress?: number, color?: string, overlay?: string): void {
  let bossUuidFormated = bossUuid.toString().split("-").join("").toLowerCase();
  let bossData = activeBosses[bossUuidFormated];
  if (!bossData) return;
  if (!server) return;

  let bossBarId = new ResourceLocation("msmp", `${bossUuidFormated}`);
  let bossBar = server.customBossEvents.get(bossBarId);
  if (!bossBar) return;
  if (name) bossBar.name = Text.of(name);
  if (progress !== undefined) bossBar.setProgress(progress);
  if (color) bossBar.setColor(BossBarColor[color] || BossBarColor.RED);
  if (overlay) bossBar.setOverlay(BossBarOverlay[overlay] || BossBarOverlay.PROGRESS);
}

function removeBossBarForBoss(server: $MinecraftServer, bossUuid: string): void {
  let bossUuidFormated = bossUuid.toString().split("-").join("").toLowerCase();
  let bossData = activeBosses[bossUuidFormated];
  if (!bossData) return;
  let bossBarId = new ResourceLocation(`msmp`, `${bossUuidFormated}`);
  let bossBar = server.customBossEvents.get(bossBarId);
  if (bossBar) {
    bossBar.removeAllPlayers();
    server.customBossEvents.remove(bossBar);
  }
}
import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";
import { $BossEvent$BossBarOverlay } from "net.minecraft.world.BossEvent$BossBarOverlay";



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

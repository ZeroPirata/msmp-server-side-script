import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";
import { $CustomBossEvent } from "net.minecraft.server.bossevents.CustomBossEvent";
import { $BossEvent$BossBarOverlay } from "net.minecraft.world.BossEvent$BossBarOverlay";

const CustomBossEvent = Java.loadClass("net.minecraft.server.bossevents.CustomBossEvent");
const BossBarColor = Java.loadClass("net.minecraft.world.BossEvent$BossBarColor");
const BossBarOverlay = Java.loadClass("net.minecraft.world.BossEvent$BossBarOverlay");
const ResourceLocation = Java.loadClass("net.minecraft.resources.ResourceLocation");

// Função para criar e mostrar a boss bar
function createBossBar(server: $MinecraftServer, bossName: string, color, overlay: string) {
  console.log(`[BOSS BAR] Criando boss bar para: ${bossName}`);
  let bossBarId;
  try {
    bossBarId = new ResourceLocation("msmp", "boss_bar");
  } catch (e) {
    console.log("[BOSS BAR] Tentando método alternativo...");
    bossBarId = ResourceLocation.of("msmp:boss_bar");
  }

  color = color || "RED";
  overlay = overlay || "PROGRESS";
  // Remove boss bar anterior se existir
  if (activeBossBar) {
    removeBossBar(server);
  }

  // Cores disponíveis: PINK, BLUE, RED, GREEN, YELLOW, PURPLE, WHITE
  let barColor = BossBarColor[color] || BossBarColor.RED;

  // Overlays disponíveis: PROGRESS, NOTCHED_6, NOTCHED_10, NOTCHED_12, NOTCHED_20
  let barOverlay = BossBarOverlay[overlay] || BossBarOverlay.PROGRESS;

  // Cria a boss bar
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

  console.log(`[BOSS BAR] Criada: ${bossName}`);

  return bossBar;
}

// Função para atualizar o nome da boss bar
function updateBossBarName(newName: string): void {
  if (!activeBossBar) return;
  activeBossBar.name = Text.of(newName);
}

// Função para atualizar a cor da boss bar
function updateBossBarColor(color: string): void {
  if (!activeBossBar) return;
  let barColor = BossBarColor[color] || BossBarColor.RED;
  activeBossBar.setColor(barColor);
}

// Função para atualizar o overlay da boss bar
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

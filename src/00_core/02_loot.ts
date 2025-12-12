import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

console.log("[MSMP] Carregando core de loot...");

function removeChestKey(playerName: string, server: $MinecraftServer): void {
  let key = `chest_key_${playerName}`;
  server.persistentData.remove(key);
}

function loadChestKey(playerName: string, server: $MinecraftServer): ChestKeyData | null {
  let key = `chest_key_${playerName}`;
  if (!server.persistentData.contains(key)) return null;
  let data = JSON.parse(server.persistentData.getString(key));
  return {
    pos: new BlockPos(data.x, data.y, data.z),
    ticks: data.ticks
  };
}

function saveChestKey(playerName: string, data: ChestKeyData, server: $MinecraftServer): void {
  let key = `chest_key_${playerName}`;
  let saveData = {
    x: data.pos.x,
    y: data.pos.y,
    z: data.pos.z,
    ticks: data.ticks
  };
  server.persistentData.putString(key, JSON.stringify(saveData));
}

function saveActiveChestPlayers(players: string[], server: $MinecraftServer): void {
  server.persistentData.putString("chest_active_players", JSON.stringify(players));
}

function getActiveChestPlayers(server: $MinecraftServer): string[] {
  if (!server.persistentData.contains("chest_active_players")) {
    return [];
  }
  return JSON.parse(server.persistentData.getString("chest_active_players"));
}

function demageLootCalculate(damagePercent: number): "low" | "medium" | "high" {
  if (damagePercent >= 0.67) {
    return "high";
  } else if (damagePercent >= 0.34) {
    return "medium";
  } else {
    return "low";
  }
}

function rankingPlayersRaid(rank: number): string {
  switch (rank) {
    case 1:
      return "§6🥇 1º Lugar";
    case 2:
      return "§f🥈 2º Lugar";
    case 3:
      return "§c🥉 3º Lugar";
    default:
      return `§7#${rank} Lugar`;
  }
}

function getPlayerChestKey(chestKey: string, uuid: string): string {
  return `${chestKey}_${uuid}`;
}

function getChestKey(pos: $BlockPos): string {
  return `boss_chest_${pos.x}_${pos.y}_${pos.z}`;
}

function isChestOwner(player: $ServerPlayer, chestPos: $BlockPos, server: $MinecraftServer): boolean {
  let chestKey = getChestKey(chestPos);
  let playerKey = getPlayerChestKey(chestKey, player.stringUUID);
  return server.persistentData.contains(playerKey);
}

function getChestOwnerName(chestPos: $BlockPos, server: $MinecraftServer): string | null {
  let activePlayers = getActiveChestPlayers(server);

  for (let playerName of activePlayers) {
    let chestData = loadChestKey(playerName, server);
    if (chestData && chestData.pos.x === chestPos.x && chestData.pos.y === chestPos.y && chestData.pos.z === chestPos.z) {
      return playerName;
    }
  }

  return null;
}

import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";

function hasPlayerSeenBoss(playerUuid: string, bossUuid: string, server: $MinecraftServer): boolean {
  if (!server) return false;

  let player = server.getPlayerList().getPlayer(playerUuid);
  if (!player) return false;

  let key = `seen_boss_${bossUuid}`;
  return player.persistentData.getBoolean(key);
}

function markBossAsSeen(playerUuid: string, bossUuid: string, server: $MinecraftServer): void {
  if (!server) return;

  let player = server.getPlayerList().getPlayer(playerUuid);
  if (!player) return;

  let key = `seen_boss_${bossUuid}`;
  player.persistentData.putBoolean(key, true);
}

function clearBossFromAllPlayers(bossUuid: string, server: $MinecraftServer): void {
  if (!server) return;

  server
    .getPlayerList()
    .getPlayers()
    .forEach((player) => {
      let key = `seen_boss_${bossUuid}`;
      player.persistentData.remove(key);
    });
}

function showBossIntroduction(player: $ServerPlayer, boss: $LivingEntity, config: IMiniBoss): void {
  let bossName = boss.customName?.getString() || config.name || "Boss Desconhecido";

  player.runCommandSilent(`title @s times 10 70 20`);
  player.runCommandSilent(`title @s title {"text":"${bossName}","color":"dark_red","bold":true}`);
  player.runCommandSilent(`title @s subtitle {"text":"Prepare-se para a batalha!","color":"gold","italic":true}`);
}

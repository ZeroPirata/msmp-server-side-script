import { $LivingEntity } from "net.minecraft.world.entity.LivingEntity";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";
import { $Entity } from "net.minecraft.world.entity.Entity";
import { $BlockPos } from "net.minecraft.core.BlockPos";
import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $Level } from "net.minecraft.world.level.Level";
import { $ChunkPos } from "net.minecraft.world.level.ChunkPos";

// CORE Para funções de configuração

function saveMsmpConfig(server: $MinecraftServer, configObj: any): void {
  server.persistentData.putString(CONFIG_KEY, JSON.stringify(configObj));
}

function getMsmpConfig(server: $MinecraftServer): any {
  let data = server.persistentData.getString(CONFIG_KEY);

  if (!data) {
    server.persistentData.putString(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }

  try {
    return Object.assign({}, DEFAULT_CONFIG, JSON.parse(data));
  } catch (e) {
    console.error(`[MSMP Config] Erro ao carregar configuração: ${e}`);
    return DEFAULT_CONFIG;
  }
}

// CORE Para funções de boss

function clearBossActive(server: $MinecraftServer): void {
  server.persistentData.remove("kubejs_active_boss_uuid");
  server.persistentData.remove("kubejs_active_boss_config");
}

function setBossActive(boss: $LivingEntity, config: IMiniBoss): void {
  let server = boss.level.server;
  server.persistentData.putString("kubejs_active_boss_uuid", boss.uuid.toString());
  server.persistentData.putString("kubejs_active_boss_config", JSON.stringify(config));
}

function getBossActive(server: $MinecraftServer): { boss: $LivingEntity | null; config: IMiniBoss | null } {
  let uuid = server.persistentData.getString("kubejs_active_boss_uuid");
  let configJson = server.persistentData.getString("kubejs_active_boss_config");

  if (!uuid || !configJson) return { boss: null, config: null };

  let foundBoss: $LivingEntity | null = null;
  server.overworld().entities.forEach((entity) => {
    if (entity.uuid.toString() === uuid) {
      foundBoss = entity as $LivingEntity;
    }
  });

  return {
    boss: foundBoss,
    config: JSON.parse(configJson)
  };
}

function getRandomBoss(bloodMoon: boolean): IMiniBoss {
  // 1. Filtra a lista
  let bossList = bloodMoon ? MINIBOSSES.filter((b) => b.bloodMoon === true) : MINIBOSSES.filter((b) => b.bloodMoon !== true);

  // Segurança: se a lista filtrada estiver vazia, usa a lista completa
  if (bossList.length === 0) bossList = MINIBOSSES;

  // 2. Sorteia um índice baseado no tamanho da lista FILTRADA
  let max = bossList.length;
  let choice = Math.floor(Math.random() * max);

  // 3. RETORNA DA LISTA FILTRADA (O segredo está aqui)
  return bossList[choice];
}

// CORE Para quantidade de players online
function countOnlinePlayers(level: $ServerLevel): number {
  let allPlayers = level.players;
  let onlinePlayers = allPlayers.filter((player) => player && player.isAlive() && !player.isSpectator());
  return onlinePlayers.length;
}

// CORE Para gerais

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

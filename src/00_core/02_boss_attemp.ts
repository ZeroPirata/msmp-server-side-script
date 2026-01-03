import { $MinecraftServer } from "net.minecraft.server.MinecraftServer";
import { $ServerLevel } from "net.minecraft.server.level.ServerLevel";

function attemptBossSpawn(server: $MinecraftServer, overworld: $ServerLevel, state: NightSpawnState, config: any, currentDay: number): void {
  let bossConfig = getRandomBossWithDifficulty(state, currentDay);
  if (!bossConfig) return;

  let pos = generateBossPosition(overworld, state.spawnedPositions, config);
  if (!pos) return;

  state.spawnedCount++;
  state.spawnedPositions.push({ x: pos.getX(), z: pos.getZ() });

  let difficulty = (bossConfig.difficulty as BossDifficulty) || "NORMAL";
  state.spawnedDifficulties[difficulty] = (state.spawnedDifficulties[difficulty] || 0) + 1;

  saveNightState(server, state);
  prepareBossSpawnMulti(server, overworld, bossConfig, pos, currentDay);
}

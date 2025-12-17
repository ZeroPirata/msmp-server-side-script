function attemptBossSpawn(server: $MinecraftServer, overworld: $ServerLevel, state: NightSpawnState, config: any, currentDay: number): void {
  let bossConfig = getRandomBossWithDifficulty(state, currentDay);
  if (!bossConfig) {
    console.log(`[MULTI-BOSS] Nenhum boss disponível para spawnar (limites de dificuldade atingidos)`);
    return;
  }

  let pos = generateBossPosition(overworld, state.spawnedPositions, config.MIN_BOSS_DISTANCE);
  if (!pos) {
    console.log(`[MULTI-BOSS] Não foi possível encontrar posição válida para boss`);
    return;
  }

  state.spawnedCount++;
  state.spawnedPositions.push({ x: pos.getX(), z: pos.getZ() });

  let difficulty = (bossConfig.difficulty as BossDifficulty) || "NORMAL";
  let currentDiffCount = state.spawnedDifficulties[difficulty] || 0;
  state.spawnedDifficulties[difficulty] = currentDiffCount + 1;
  saveNightState(server, state);
  prepareBossSpawnMulti(overworld, bossConfig, pos.getX(), pos.getY(), pos.getZ(), currentDay);
}

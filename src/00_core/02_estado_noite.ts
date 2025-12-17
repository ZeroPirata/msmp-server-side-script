function initNightState(day: number): NightSpawnState {
  return {
    day: day,
    spawnedCount: 0,
    attemptCount: 0,
    spawnedDifficulties: {},
    spawnedPositions: []
  };
}

function saveNightState(server: $MinecraftServer, state: NightSpawnState): void {
  if (!state) {
    server.persistentData.remove("kubejs_night_state");
    return;
  }

  server.persistentData.putString(
    "kubejs_night_state",
    JSON.stringify({
      day: state.day,
      spawnedCount: state.spawnedCount,
      attemptCount: state.attemptCount,
      spawnedDifficulties: state.spawnedDifficulties,
      spawnedPositions: state.spawnedPositions
    })
  );
}

function loadNightState(server: $MinecraftServer): NightSpawnState | null {
  let data = server.persistentData.getString("kubejs_night_state");
  if (!data) return null;

  try {
    let parsed = JSON.parse(data);
    return {
      day: parsed.day,
      spawnedCount: parsed.spawnedCount,
      attemptCount: parsed.attemptCount,
      spawnedDifficulties: parsed.spawnedDifficulties || {},
      spawnedPositions: parsed.spawnedPositions
    };
  } catch (e) {
    return null;
  }
}

function isPositionTooClose(x: number, z: number, existingPositions: Array<{ x: number; z: number }>, minDistance: number): boolean {
  const minDistanceSq = minDistance * minDistance;
  for (let i = 0; i < existingPositions.length; i++) {
    const pos = existingPositions[i];
    const dx = pos.x - x;
    const dz = pos.z - z;
    const distSq = dx * dx + dz * dz;

    if (distSq < minDistanceSq) return true;
  }
  return false;
}

function generateBossPosition(overworld: $ServerLevel, existingPositions: Array<{ x: number; z: number }>, config: any): BlockPos | null {
  let maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let pos = generateRandomPositionBoss(overworld, config);
    if (pos && !isPositionTooClose(pos.getX(), pos.getZ(), existingPositions, config.MIN_BOSS_DISTANCE)) {
      return pos;
    }
  }
  return null;
}

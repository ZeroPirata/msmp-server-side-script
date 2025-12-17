function isPositionTooClose(x: number, z: number, existingPositions: Array<{ x: number; z: number }>, minDistance: number): boolean {
  for (let pos of existingPositions) {
    let distSq = Math.pow(pos.x - x, 2) + Math.pow(pos.z - z, 2);
    if (distSq < minDistance * minDistance) {
      return true;
    }
  }
  return false;
}

function generateBossPosition(overworld: $ServerLevel, existingPositions: Array<{ x: number; z: number }>, minDistance: number, maxAttempts: number): BlockPos | null {
  maxAttempts = 50;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let pos = generateRandomPositionBoss(overworld);

    if (!isPositionTooClose(pos.getX(), pos.getZ(), existingPositions, minDistance)) {
      return pos;
    }
  }
  return null;
}

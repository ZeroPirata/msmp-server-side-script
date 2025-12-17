const DIFFICULTY_WEIGHTS: DifficultyWeight[] = [
  { difficulty: "FACIL", baseWeight: 40, dayMultiplier: 1.0 },
  { difficulty: "NORMAL", baseWeight: 30, dayMultiplier: 1.1 },
  { difficulty: "MEDIO", baseWeight: 20, dayMultiplier: 1.2 },
  { difficulty: "DIFICIL", baseWeight: 8, dayMultiplier: 1.3 },
  { difficulty: "RAID", baseWeight: 2, dayMultiplier: 1.5 }
];

const MAX_PER_DIFFICULTY: Map<BossDifficulty, number> = new Map([
  ["FACIL", 3],
  ["NORMAL", 2],
  ["MEDIO", 2],
  ["DIFICIL", 1],
  ["RAID", 1]
]);

function getDifficultyWeight(difficulty: BossDifficulty, currentDay: number): number {
  let config = DIFFICULTY_WEIGHTS.find((d) => d.difficulty === difficulty);
  if (!config) return 1;

  let dayFactor = Math.min(1 + (currentDay / 100) * config.dayMultiplier, 3.0);
  return config.baseWeight * dayFactor;
}

function canSpawnDifficulty(difficulty: BossDifficulty, state: NightSpawnState): boolean {
  let maxAllowed = MAX_PER_DIFFICULTY.get(difficulty) || 1;
  let currentCount = state.spawnedDifficulties[difficulty] || 0;
  return currentCount < maxAllowed;
}

function getRandomBossWithDifficulty(state: NightSpawnState, currentDay: number): IMiniBoss | null {
  let availableBosses = MINIBOSSES.filter((boss) => {
    let difficulty = (boss.difficulty as BossDifficulty) || "NORMAL";
    return canSpawnDifficulty(difficulty, state);
  });

  if (availableBosses.length === 0) return null;

  let totalWeight = 0;
  let weights: number[] = [];

  for (let boss of availableBosses) {
    let difficulty = (boss.difficulty as BossDifficulty) || "NORMAL";
    let difficultyWeight = getDifficultyWeight(difficulty, currentDay);
    let finalWeight = boss.spawnWeight * difficultyWeight;
    weights.push(finalWeight);
    totalWeight += finalWeight;
  }
  let random = Math.random() * totalWeight;
  for (let i = 0; i < availableBosses.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return availableBosses[i];
    }
  }
  return availableBosses[0];
}

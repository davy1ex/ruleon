export const XP_PER_LEVEL = 100;

export interface LevelInfo {
  currentLevel: number;
  currentLevelXp: number;
  xpPerLevel: number;
  progressPercent: number;
}

export function calculateLevelInfo(
  totalXp: number,
  xpPerLevel = XP_PER_LEVEL,
): LevelInfo {
  const currentLevel = Math.floor(totalXp / xpPerLevel) + 1;
  const currentLevelXp = totalXp % xpPerLevel;
  const progressPercent = (currentLevelXp / xpPerLevel) * 100;

  return { currentLevel, currentLevelXp, xpPerLevel, progressPercent };
}

/** XP required to reach level N (level 1 starts at 0 XP). */
export function xpForLevel(level: number): number {
  if (level <= 1) {
    return 0;
  }
  return (level - 1) ** 2 * 100;
}

export function levelFromXp(totalXp: number): number {
  if (totalXp <= 0) {
    return 1;
  }
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

export function xpProgressInLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number;
} {
  const level = levelFromXp(totalXp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = Math.max(nextLevelXp - currentLevelXp, 1);
  const progress = Math.min(
    Math.max((totalXp - currentLevelXp) / span, 0),
    1,
  );
  return { level, currentLevelXp, nextLevelXp, progress };
}

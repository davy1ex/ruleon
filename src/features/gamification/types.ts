export interface DailyGamificationStats {
  tasksCompleted: number;
  xpEarned: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
}

export interface GamificationProfile {
  totalXp: number;
  coins: number;
  dailyStats: Record<string, DailyGamificationStats>;
}

export const XP_PER_TASK = 10;

export function defaultGamificationProfile(): GamificationProfile {
  return {
    totalXp: 0,
    coins: 0,
    dailyStats: {},
  };
}

export function todayDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

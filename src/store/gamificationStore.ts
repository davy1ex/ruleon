import { create } from "zustand";
import { createNodeId } from "../domain/outliner/seed";
import {
  enrichTaskTitlesFromMemory,
  getTodayActivity,
  type TodayCompletedTask,
  type TodayProject,
} from "../domain/outliner/todayActivity";
import { useOutlinerStore } from "./outlinerStore";
import {
  ensureDefaultGamificationProfile,
  getCustomRewards,
  getGamificationProfile,
  setCustomRewards,
  setGamificationProfile,
} from "../features/gamification/gamificationKv";
import {
  todayDateKey,
  type GamificationProfile,
  type Reward,
} from "../features/gamification/types";
import { getDbContext } from "./dbContext";

interface GamificationState {
  totalXp: number;
  coins: number;
  rewards: Reward[];
  todayXpEarned: number;
  todayCompleted: number;
  todayTasks: TodayCompletedTask[];
  todayProjects: TodayProject[];
  loadXp: () => Promise<void>;
  loadTodayActivity: () => Promise<void>;
  addXp: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  addReward: (title: string, cost: number) => Promise<void>;
  updateReward: (id: string, title: string, cost: number) => Promise<void>;
  removeReward: (id: string) => Promise<void>;
}

function deriveTodayStats(profile: GamificationProfile): {
  todayXpEarned: number;
  todayCompleted: number;
} {
  const today = profile.dailyStats[todayDateKey()];
  return {
    todayXpEarned: today?.xpEarned ?? 0,
    todayCompleted: today?.tasksCompleted ?? 0,
  };
}

function applyProfile(
  set: (state: Partial<GamificationState>) => void,
  profile: GamificationProfile,
): void {
  set({
    totalXp: profile.totalXp,
    coins: profile.coins,
    ...deriveTodayStats(profile),
  });
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  totalXp: 0,
  coins: 0,
  rewards: [],
  todayXpEarned: 0,
  todayCompleted: 0,
  todayTasks: [],
  todayProjects: [],

  loadTodayActivity: async () => {
    const db = getDbContext()?.db;
    if (!db) {
      return;
    }
    const activity = await getTodayActivity(db);
    const { nodesByRootId, linkedReferenceNodesById } =
      useOutlinerStore.getState();
    const tasks = enrichTaskTitlesFromMemory(activity.tasks, {
      ...nodesByRootId,
      ...linkedReferenceNodesById,
    });
    set({
      todayTasks: tasks,
      todayProjects: activity.projects,
    });
  },

  loadXp: async () => {
    const db = getDbContext()?.db;
    if (!db) {
      return;
    }
    const [profile, rewards] = await Promise.all([
      ensureDefaultGamificationProfile(db),
      getCustomRewards(db),
    ]);
    applyProfile(set, profile);
    set({ rewards });
    await get().loadTodayActivity();
  },

  addXp: async (amount: number) => {
    if (amount === 0) {
      return;
    }

    const db = getDbContext()?.db;
    if (!db) {
      return;
    }

    const profile = await getGamificationProfile(db);
    const dayKey = todayDateKey();
    const todayStats = profile.dailyStats[dayKey] ?? {
      tasksCompleted: 0,
      xpEarned: 0,
    };

    const taskDelta = amount > 0 ? 1 : -1;
    const updatedProfile: GamificationProfile = {
      ...profile,
      totalXp: Math.max(0, profile.totalXp + amount),
      coins: profile.coins + amount,
      dailyStats: {
        ...profile.dailyStats,
        [dayKey]: {
          tasksCompleted: Math.max(0, todayStats.tasksCompleted + taskDelta),
          xpEarned: Math.max(0, todayStats.xpEarned + amount),
        },
      },
    };

    set({
      totalXp: updatedProfile.totalXp,
      coins: updatedProfile.coins,
      ...deriveTodayStats(updatedProfile),
    });

    await setGamificationProfile(db, updatedProfile);
    await get().loadTodayActivity();
  },

  spendCoins: async (amount: number) => {
    if (get().coins < amount) {
      return false;
    }

    const db = getDbContext()?.db;
    if (!db) {
      return false;
    }

    const profile = await getGamificationProfile(db);
    const updatedProfile: GamificationProfile = {
      ...profile,
      coins: profile.coins - amount,
    };

    set({ coins: updatedProfile.coins });
    await setGamificationProfile(db, updatedProfile);
    return true;
  },

  addReward: async (title: string, cost: number) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || cost <= 0) {
      return;
    }

    const db = getDbContext()?.db;
    if (!db) {
      return;
    }

    const nextRewards = [
      ...get().rewards,
      { id: createNodeId(), title: trimmedTitle, cost },
    ];
    set({ rewards: nextRewards });
    await setCustomRewards(db, nextRewards);
  },

  updateReward: async (id: string, title: string, cost: number) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle || cost <= 0) {
      return;
    }

    const db = getDbContext()?.db;
    if (!db) {
      return;
    }

    const nextRewards = get().rewards.map((reward) =>
      reward.id === id ? { ...reward, title: trimmedTitle, cost } : reward,
    );
    set({ rewards: nextRewards });
    await setCustomRewards(db, nextRewards);
  },

  removeReward: async (id: string) => {
    const db = getDbContext()?.db;
    if (!db) {
      return;
    }

    const nextRewards = get().rewards.filter((reward) => reward.id !== id);
    set({ rewards: nextRewards });
    await setCustomRewards(db, nextRewards);
  },
}));

export async function hydrateGamificationFromDB(): Promise<void> {
  await useGamificationStore.getState().loadXp();
}

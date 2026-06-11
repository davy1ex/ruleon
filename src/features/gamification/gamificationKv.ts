import type { RuleonDb as DB } from "../../domain/db/types";
import {
  CUSTOM_REWARDS_KEY,
  GAMIFICATION_PROFILE_KEY,
} from "../../domain/settings/settingKeys";
import { getSetting, setSetting } from "../../domain/settings/settingsRepo";
import {
  defaultGamificationProfile,
  type GamificationProfile,
  type Reward,
} from "./types";

export function parseGamificationProfile(raw: unknown): GamificationProfile {
  if (!raw || typeof raw !== "object") {
    return defaultGamificationProfile();
  }
  const profile = raw as Partial<GamificationProfile>;
  return {
    totalXp:
      typeof profile.totalXp === "number" && profile.totalXp >= 0
        ? profile.totalXp
        : 0,
    coins: typeof profile.coins === "number" ? profile.coins : 0,
    dailyStats:
      profile.dailyStats && typeof profile.dailyStats === "object"
        ? profile.dailyStats
        : {},
  };
}

function parseRewardItem(raw: unknown): Reward | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const item = raw as Partial<Reward>;
  if (
    typeof item.id !== "string" ||
    typeof item.title !== "string" ||
    !item.title.trim() ||
    typeof item.cost !== "number" ||
    item.cost <= 0
  ) {
    return null;
  }
  return { id: item.id, title: item.title.trim(), cost: item.cost };
}

export function parseRewards(raw: unknown): Reward[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const rewards: Reward[] = [];
  for (const item of raw) {
    const reward = parseRewardItem(item);
    if (reward) {
      rewards.push(reward);
    }
  }
  return rewards;
}

export async function getCustomRewards(db: DB): Promise<Reward[]> {
  const raw = await getSetting(db, CUSTOM_REWARDS_KEY);
  return parseRewards(raw);
}

export async function setCustomRewards(db: DB, rewards: Reward[]): Promise<void> {
  await setSetting(db, CUSTOM_REWARDS_KEY, rewards);
}

export async function getGamificationProfile(db: DB): Promise<GamificationProfile> {
  const raw = await getSetting(db, GAMIFICATION_PROFILE_KEY);
  return parseGamificationProfile(raw);
}

export async function setGamificationProfile(
  db: DB,
  profile: GamificationProfile,
): Promise<void> {
  await setSetting(db, GAMIFICATION_PROFILE_KEY, profile);
}

export async function ensureDefaultGamificationProfile(db: DB): Promise<GamificationProfile> {
  const raw = await getSetting(db, GAMIFICATION_PROFILE_KEY);
  if (raw === null) {
    const profile = defaultGamificationProfile();
    await setGamificationProfile(db, profile);
    return profile;
  }
  return parseGamificationProfile(raw);
}

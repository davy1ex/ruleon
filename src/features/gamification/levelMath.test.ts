import { describe, expect, it } from "vitest";
import { calculateLevelInfo, XP_PER_LEVEL } from "./levelMath";

describe("calculateLevelInfo", () => {
  it("starts at level 1 with zero xp", () => {
    const info = calculateLevelInfo(0);
    expect(info.currentLevel).toBe(1);
    expect(info.currentLevelXp).toBe(0);
    expect(info.progressPercent).toBe(0);
  });

  it("uses flat 100 xp per level", () => {
    expect(calculateLevelInfo(50).currentLevel).toBe(1);
    expect(calculateLevelInfo(50).currentLevelXp).toBe(50);
    expect(calculateLevelInfo(50).progressPercent).toBe(50);

    expect(calculateLevelInfo(100).currentLevel).toBe(2);
    expect(calculateLevelInfo(100).currentLevelXp).toBe(0);
  });

  it("respects custom xp per level", () => {
    const info = calculateLevelInfo(25, 50);
    expect(info.xpPerLevel).toBe(50);
    expect(info.currentLevel).toBe(1);
    expect(info.progressPercent).toBe(50);
    expect(XP_PER_LEVEL).toBe(100);
  });
});

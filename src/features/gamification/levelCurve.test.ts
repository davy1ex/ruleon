import { describe, expect, it } from "vitest";
import { levelFromXp, xpForLevel, xpProgressInLevel } from "./levelCurve";

describe("levelCurve", () => {
  it("starts at level 1 with zero xp", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(xpForLevel(1)).toBe(0);
  });

  it("computes level from total xp", () => {
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(399)).toBe(2);
    expect(levelFromXp(400)).toBe(3);
  });

  it("returns progress within the current level", () => {
    const atStart = xpProgressInLevel(0);
    expect(atStart.level).toBe(1);
    expect(atStart.progress).toBe(0);

    const midLevel = xpProgressInLevel(50);
    expect(midLevel.level).toBe(1);
    expect(midLevel.progress).toBe(0.5);

    const nextLevel = xpProgressInLevel(100);
    expect(nextLevel.level).toBe(2);
    expect(nextLevel.progress).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  parseGamificationProfile,
  parseRewards,
} from "./gamificationKv";

describe("parseGamificationProfile", () => {
  it("defaults coins to 0 when missing", () => {
    expect(parseGamificationProfile({ totalXp: 5, dailyStats: {} }).coins).toBe(0);
  });

  it("preserves negative coin balances", () => {
    expect(
      parseGamificationProfile({ totalXp: 0, coins: -15, dailyStats: {} }).coins,
    ).toBe(-15);
  });
});

describe("parseRewards", () => {
  it("returns an empty array for non-array input", () => {
    expect(parseRewards(null)).toEqual([]);
    expect(parseRewards({})).toEqual([]);
  });

  it("filters invalid reward entries", () => {
    expect(
      parseRewards([
        { id: "1", title: "Coffee", cost: 5 },
        { id: "2", title: "", cost: 3 },
        { id: "3", title: "Bad", cost: 0 },
        { id: 4, cost: 10 },
      ]),
    ).toEqual([{ id: "1", title: "Coffee", cost: 5 }]);
  });
});

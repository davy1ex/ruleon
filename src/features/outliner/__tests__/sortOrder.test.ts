import { describe, expect, it } from "vitest";
import {
  computeFractionalSortOrder,
  sanitizeSortOrder,
} from "../../../domain/outliner/sortOrder";

describe("computeFractionalSortOrder", () => {
  it("inserts at start using midpoint of next sibling", () => {
    expect(computeFractionalSortOrder(null, 100)).toBe(50);
  });

  it("inserts between neighbors using fractional index", () => {
    expect(computeFractionalSortOrder(100, 200)).toBe(150);
  });

  it("inserts at end by adding 100 to previous order", () => {
    expect(computeFractionalSortOrder(300, null)).toBe(400);
  });

  it("returns zero when both bounds are absent", () => {
    expect(computeFractionalSortOrder(null, null)).toBe(0);
  });

  it("supports non-integer midpoint results", () => {
    expect(computeFractionalSortOrder(0, 1)).toBeCloseTo(0.5);
  });
});

describe("sanitizeSortOrder", () => {
  it("returns the value when finite", () => {
    expect(sanitizeSortOrder(42)).toBe(42);
  });

  it("falls back for NaN", () => {
    expect(sanitizeSortOrder(Number.NaN, 999)).toBe(999);
  });

  it("falls back for Infinity", () => {
    expect(sanitizeSortOrder(Number.POSITIVE_INFINITY, 999)).toBe(999);
  });
});

import { describe, expect, it } from "vitest";
import type { Recipe } from "../recipes/types";
import { dayFromMeals, dayFromRecipes } from "./today";
import { chartStats, leftKcal, macroShares } from "./stats";

const day = (date: string, planned: number, eaten: number) => ({ date, planned, eaten, macros: { protein: 80, carbs: 150, fat: 40 } });
const recipe = (kcal: number, protein: number, carbs: number, fat: number) => ({ kcal, protein, carbs, fat }) as Recipe;

describe("leftKcal", () => {
  it("floors at 0", () => {
    expect(leftKcal(1900, 1420)).toBe(480);
    expect(leftKcal(1900, 2500)).toBe(0);
  });
});

describe("chartStats", () => {
  it("averages past days only and counts days within 10% of plan", () => {
    expect(chartStats([day("a", 1900, 1900), day("b", 1900, 2200), day("c", 1900, 1400)])).toEqual({ avgEaten: 2050, avgPlanned: 1900, onPlan: 1, pastDays: 2 });
  });
  it("handles a single day", () => {
    expect(chartStats([day("a", 1, 1)]).pastDays).toBe(0);
  });
});

describe("macroShares", () => {
  it("sums to 1 and weights fat at 9 kcal/g", () => {
    const s = macroShares({ protein: 100, carbs: 100, fat: 100 });
    expect(s[0] + s[1] + s[2]).toBeCloseTo(1);
    expect(s[2]).toBeGreaterThan(s[0]);
  });
  it("zero macros give zero shares", () => {
    expect(macroShares({ protein: 0, carbs: 0, fat: 0 })).toEqual([0, 0, 0]);
  });
});

describe("dayFromRecipes", () => {
  it("adds up what was eaten", () => {
    const d = dayFromRecipes("2026-11-21", 1900, [recipe(430, 20, 58, 13), recipe(610, 28, 90, 14)]);
    expect(d).toEqual({ date: "2026-11-21", planned: 1900, eaten: 1040, macros: { protein: 48, carbs: 148, fat: 27 } });
  });
  it("nothing eaten is zero, not missing", () => {
    expect(dayFromRecipes("d", 1900, []).eaten).toBe(0);
  });
});

describe("dayFromMeals", () => {
  it("sums kcal and macros, rounding away float noise", () => {
    const d = dayFromMeals("d", 1900, [{ kcal: 720, protein: 33.3, carbs: 93, fat: 22.5 }, { kcal: 310, protein: 22.1, carbs: 6, fat: 22 }]);
    expect(d).toEqual({ date: "d", planned: 1900, eaten: 1030, macros: { protein: 55.4, carbs: 99, fat: 44.5 } });
  });
});

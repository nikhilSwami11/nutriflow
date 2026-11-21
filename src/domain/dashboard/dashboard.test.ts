import { describe, expect, it } from "vitest";
import { logPlannedMeal } from "./logPlannedMeal";
import { chartStats, leftKcal, macroShares } from "./stats";
import type { DashboardData } from "./types";

const day = (date: string, planned: number, eaten: number) => ({ date, planned, eaten, macros: { protein: 80, carbs: 150, fat: 40 } });

const data: DashboardData = {
  goals: { calories: 1900, protein: 105, carbs: 230, fat: 60 },
  days: [day("a", 1900, 1900), day("b", 1900, 2200), day("c", 1900, 1400)],
  meals: [
    { name: "Breakfast", slot: "breakfast", planned: 450, eaten: 430 },
    { name: "Dinner", slot: "dinner", planned: 600, eaten: 0 },
  ],
  tonight: { title: "Dal", tags: [], blurb: "", kcal: 480, macros: { protein: 24, carbs: 60, fat: 16 } },
  suggestions: [],
};

describe("leftKcal", () => {
  it("floors at 0", () => {
    expect(leftKcal(1900, 1420)).toBe(480);
    expect(leftKcal(1900, 2500)).toBe(0);
  });
});

describe("chartStats", () => {
  it("averages past days only and counts days within 10% of plan", () => {
    expect(chartStats(data.days)).toEqual({ avgEaten: 2050, avgPlanned: 1900, onPlan: 1, pastDays: 2 });
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

describe("logPlannedMeal", () => {
  it("marks the meal eaten and adds to today", () => {
    const r = logPlannedMeal(data, "Dinner");
    expect(r.meals[1].eaten).toBe(480);
    expect(r.days[2].eaten).toBe(1880);
    expect(r.days[2].macros.protein).toBe(104);
    expect(r.days[0]).toBe(data.days[0]);
  });
  it("does not double count", () => {
    const once = logPlannedMeal(data, "Dinner");
    expect(logPlannedMeal(once, "Dinner")).toBe(once);
  });
  it("ignores unknown or already-eaten meals", () => {
    expect(logPlannedMeal(data, "Snack")).toBe(data);
    expect(logPlannedMeal(data, "Breakfast")).toBe(data);
  });
});

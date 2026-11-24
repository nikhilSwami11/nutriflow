import { describe, expect, it } from "vitest";
import type { MealLog } from "../nutrition/types";
import { dashboardFromLogs, goalsFromRange } from "./fromLogs";
import { chartStats } from "./stats";

const log = (date: string, slot: MealLog["slot"], kcal: number, recipeId?: string): MealLog => ({ id: `${date}-${slot}`, date, slot, source: "cook", name: "x", kcal, recipeId, protein: 20, carbs: 50, fat: 10 });
const today = new Date(2026, 10, 23);
const range = { min: 1800, max: 2100 };

describe("dashboardFromLogs", () => {
  it("is empty for a new account: every day a gap, nothing eaten, no history", () => {
    const d = dashboardFromLogs([], today, range);
    expect(d.days).toHaveLength(30);
    expect(d.days.every((x) => x.eaten === null)).toBe(true);
    expect(d.days[29].date).toBe("2026-11-23");
    expect(d.eatenToday).toEqual([]);
    expect(d.history).toEqual({});
    expect(chartStats(d.days).pastDays).toBe(0);
  });

  it("sums logged days, counts past recipes, and marks today's slots eaten", () => {
    const logs = [log("2026-11-22", "lunch", 600, "dal-rice"), log("2026-11-22", "dinner", 700, "dal-rice"), log("2026-11-23", "breakfast", 400, "oats-banana")];
    const d = dashboardFromLogs(logs, today, range);
    expect(d.days[28]).toMatchObject({ eaten: 1300, macros: { protein: 40, carbs: 100, fat: 20 } });
    expect(d.days[27].eaten).toBeNull();
    expect(d.history).toEqual({ "dal-rice": 2 });
    expect(d.eatenToday).toEqual(["Breakfast"]);
  });

  it("takes goals from the middle of the range", () => {
    expect(goalsFromRange(range)).toEqual({ calories: 1950, protein: 107, carbs: 234, fat: 65 });
  });
});

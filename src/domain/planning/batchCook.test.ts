import { describe, expect, it } from "vitest";
import type { Recipe } from "../recipes/types";
import { batchCook, needsFreezer, nextCookDates } from "./batchCook";

const rec = (id: string, minutes: number): Recipe => ({ id, name: id, blurb: "", minutes, servings: 2, meal: "Dinner", kcal: 500, protein: 20, carbs: 50, fat: 15, tint: "", ingredients: [], steps: [] });
const recipes = [rec("dal", 40), rec("curry", 50), rec("toast", 5)];
// 2026-11-23 is a Monday.
const plan = ["2026-11-23", "2026-11-24", "2026-11-25", "2026-11-26", "2026-11-27"].map((date, i) => ({ date, meals: [{ meal: "Dinner" as const, recipeId: i < 3 ? "dal" : "curry" }, { meal: "Breakfast" as const, recipeId: "toast" }] }));

describe("batchCook", () => {
  it("cooks each meal on the latest cook day on or before it, and keeps quick dishes fresh", () => {
    const b = batchCook(plan, recipes, ["2026-11-23", "2026-11-26"]);
    expect(b.sessions.map((s) => s.date)).toEqual(["2026-11-23", "2026-11-26"]);
    expect(b.sessions[0].dishes).toEqual([{ recipe: recipes[0], servings: 3 }]);
    expect(b.sessions[1].dishes).toEqual([{ recipe: recipes[1], servings: 2 }]);
    expect(b.fresh).toHaveLength(5);
  });
  it("a session cooks one dish per meal type, in bulk", () => {
    const week = ["2026-11-23", "2026-11-24", "2026-11-25"].map((date, i) => ({ date, meals: [{ meal: "Dinner" as const, recipeId: i === 0 ? "dal" : "curry" }] }));
    const b = batchCook(week, recipes, ["2026-11-23"]);
    expect(b.sessions[0].dishes).toEqual([{ recipe: recipes[0], servings: 3 }]);
    expect(b.sessions[0].covers.map((c) => c.recipeId)).toEqual(["dal", "dal", "dal"]);
  });
  it("a meal before the first cook day is cooked as you go", () => {
    const b = batchCook(plan, recipes, ["2026-11-25"]);
    expect(b.sessions).toHaveLength(1);
    expect(b.sessions[0].covers).toHaveLength(3); // Wed, Thu, Fri dinners
    expect(b.fresh.filter((f) => f.recipeId === "dal")).toHaveLength(2); // Mon, Tue
  });
  it("time is the longest dish plus half of the others", () => {
    const b = batchCook([{ date: "2026-11-23", meals: [{ meal: "Dinner", recipeId: "dal" }, { meal: "Lunch", recipeId: "curry" }] }], recipes, ["2026-11-23"]);
    expect(b.sessions[0].minutes).toBe(70); // 50 + 40 / 2
  });
  it("no cook days gives no sessions", () => {
    expect(batchCook(plan, recipes, []).sessions).toEqual([]);
  });
});

describe("cook days", () => {
  it("finds the next Monday and Thursday", () => {
    expect(nextCookDates("2026-11-23", [1, 4])).toEqual(["2026-11-23", "2026-11-26"]);
  });
  it("a meal three days after cooking goes to the freezer", () => {
    expect(needsFreezer("2026-11-23", "2026-11-25")).toBe(false);
    expect(needsFreezer("2026-11-23", "2026-11-26")).toBe(true);
  });
});

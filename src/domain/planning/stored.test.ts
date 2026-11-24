import { describe, expect, it } from "vitest";
import type { MealName, Recipe } from "../recipes/types";
import { ensurePlan, redoPlan, type MealPlanRepository, type StoredDay } from "./stored";

const r = (id: string, meal: MealName, kcal: number, protein: number) => ({ id, name: id, meal, kcal, protein, ingredients: [] }) as unknown as Recipe;
const recipes = [r("oats", "Breakfast", 400, 14), r("eggs", "Breakfast", 330, 28), r("dal", "Lunch", 600, 24), r("rajma", "Lunch", 650, 30), r("nuts", "Snack", 220, 6), r("palak", "Dinner", 610, 26), r("pasta", "Dinner", 700, 20)];
const dates = ["2026-11-23", "2026-11-24", "2026-11-25"];
const input = { recipes, goals: { calories: 1900, protein: 105 }, history: {}, dates };

const memory = (rows: StoredDay[] = []): MealPlanRepository & { rows: StoredDay[] } => ({
  rows,
  async list(from, to) { return this.rows.filter((d) => d.date >= from && d.date <= to); },
  async add(days) { for (const d of days) if (!this.rows.some((x) => x.date === d.date)) this.rows.push(d); },
  async clearFrom(date) { this.rows = this.rows.filter((d) => d.date < date); },
});

describe("ensurePlan", () => {
  it("plans and stores a missing week, then reads the same week back", async () => {
    const repo = memory();
    const first = await ensurePlan(repo, input);
    expect(repo.rows).toHaveLength(3);
    expect(await ensurePlan(repo, input)).toEqual(first);
  });

  it("keeps stored days and replans one whose recipe is no longer allowed", async () => {
    const kept: StoredDay = { date: dates[0], focus: "balanced", meals: [{ meal: "Lunch", recipeId: "rajma" }] };
    const banned: StoredDay = { date: dates[1], focus: "balanced", meals: [{ meal: "Lunch", recipeId: "chicken" }] };
    const repo = memory([kept, banned]);
    const week = await ensurePlan(repo, input);
    expect(week[0]).toEqual(kept);
    expect(week[1].meals.every((m) => m.recipeId !== "chicken")).toBe(true);
    expect(repo.rows.map((d) => d.date).sort()).toEqual(dates);
  });

  it("still returns a week when storage fails", async () => {
    const broken: MealPlanRepository = { list: async () => { throw new Error("no table"); }, add: async () => { throw new Error("no table"); }, clearFrom: async () => { throw new Error("no table"); } };
    expect(await ensurePlan(broken, input)).toHaveLength(3);
  });
});

describe("redoPlan", () => {
  it("replaces the week with the new focus, and new days keep it", async () => {
    const repo = memory();
    await ensurePlan(repo, input);
    await redoPlan(repo, { ...input, focus: "protein" });
    expect(repo.rows.every((d) => d.focus === "protein")).toBe(true);
    const longer = await ensurePlan(repo, { ...input, dates: [...dates, "2026-11-26"] });
    expect(longer[3].focus).toBe("protein");
  });
});

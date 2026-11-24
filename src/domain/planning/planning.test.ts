import { describe, expect, it } from "vitest";
import type { MealName, Recipe } from "../recipes/types";
import { dayBalance, weekBalance } from "./balance";
import { eatNext, eatNextIndex } from "./eatNext";
import { planWeek } from "./planWeek";
import { prepTasks } from "./prep";

const r = (id: string, meal: MealName, kcal: number, protein: number): Recipe => ({ id, name: id, meal, kcal, protein, ingredients: [] }) as unknown as Recipe;
const recipes = [
  r("oats", "Breakfast", 400, 14), r("eggs", "Breakfast", 330, 28),
  r("dal", "Lunch", 600, 24), r("rajma", "Lunch", 650, 30), r("khichdi", "Lunch", 480, 18),
  r("yogurt", "Snack", 160, 15), r("nuts", "Snack", 220, 6),
  r("palak", "Dinner", 610, 26), r("tadka", "Dinner", 480, 22), r("pasta", "Dinner", 700, 20),
];
const goals = { calories: 1900, protein: 105 };
const dates = ["d1", "d2", "d3", "d4", "d5", "d6", "d7"];

describe("planWeek", () => {
  const plan = planWeek({ recipes, goals, history: {}, dates, focus: "balanced" });

  it("fills every meal of every day with a recipe of that meal type", () => {
    expect(plan).toHaveLength(7);
    for (const d of plan) {
      expect(d.meals.map((m) => m.meal)).toEqual(["Breakfast", "Lunch", "Snack", "Dinner"]);
      for (const m of d.meals) expect(recipes.find((x) => x.id === m.recipeId)!.meal).toBe(m.meal);
    }
  });
  it("is deterministic", () => {
    expect(planWeek({ recipes, goals, history: {}, dates, focus: "balanced" })).toEqual(plan);
  });
  it("lands each day near the calorie goal", () => {
    for (const d of weekBalance(plan, recipes, goals, (x) => x).days) expect(Math.abs(d.kcal - goals.calories)).toBeLessThanOrEqual(goals.calories * 0.15);
  });
  it("does not repeat a dinner two days running when alternatives exist", () => {
    const dinners = plan.map((d) => d.meals.find((m) => m.meal === "Dinner")!.recipeId);
    for (let i = 1; i < dinners.length; i++) expect(dinners[i]).not.toBe(dinners[i - 1]);
  });
  it("high protein focus never lowers weekly protein", () => {
    const protein = (p: typeof plan) => weekBalance(p, recipes, goals, (x) => x).avgProtein;
    expect(protein(planWeek({ recipes, goals, history: {}, dates, focus: "protein" }))).toBeGreaterThanOrEqual(protein(plan));
  });
  it("prefers meals eaten before when otherwise equal", () => {
    const twins = [r("a", "Breakfast", 400, 20), r("b", "Breakfast", 400, 20), ...recipes.filter((x) => x.meal !== "Breakfast")];
    const p = planWeek({ recipes: twins, goals, history: { b: 4 }, dates: ["d1"], focus: "balanced" });
    expect(p[0].meals[0].recipeId).toBe("b");
  });
  it("prefers what the pantry can already cook when otherwise equal", () => {
    const withIng = (x: Recipe, name: string) => ({ ...x, ingredients: [{ name, qty: 1, unit: "pcs" }] }) as Recipe;
    const twins = [withIng(r("a", "Breakfast", 400, 20), "Bagel"), withIng(r("b", "Breakfast", 400, 20), "Paneer"), ...recipes.filter((x) => x.meal !== "Breakfast")];
    const pantry = [{ id: "1", name: "Paneer", group: "Dairy" as const, qty: 1, unit: "pcs" as const, lowAt: 0 }];
    expect(planWeek({ recipes: twins, goals, history: {}, dates: ["d1"], focus: "balanced", pantry })[0].meals[0].recipeId).toBe("b");
  });
    it("copes with a meal type that has no recipes", () => {
    const p = planWeek({ recipes: recipes.filter((x) => x.meal !== "Snack"), goals, history: {}, dates: ["d1"], focus: "balanced" });
    expect(p[0].meals.map((m) => m.meal)).toEqual(["Breakfast", "Lunch", "Dinner"]);
  });
});

describe("balance", () => {
  const low = { date: "mon", meals: [{ meal: "Breakfast" as const, recipeId: "oats" }, { meal: "Lunch" as const, recipeId: "khichdi" }] };
  it("flags a day under on both calories and protein", () => {
    const b = dayBalance(low, recipes, goals);
    expect(b).toMatchObject({ kcal: 880, protein: 32, kcalStatus: "under", proteinStatus: "under" });
  });
  it("more protein than the goal is fine", () => {
    const big = { date: "x", meals: [{ meal: "Lunch" as const, recipeId: "rajma" }, { meal: "Breakfast" as const, recipeId: "eggs" }, { meal: "Dinner" as const, recipeId: "palak" }, { meal: "Snack" as const, recipeId: "yogurt" }, { meal: "Lunch" as const, recipeId: "dal" }] };
    expect(dayBalance(big, recipes, { calories: 100, protein: 50 }).proteinStatus).toBe("ok");
  });
  it("notes name the worst day, or say all is well", () => {
    const w = weekBalance([low], recipes, goals, () => "Monday");
    expect(w.notes).toEqual(["Monday is 73 g short on protein.", "Monday is 1,020 kcal under your goal."]);
    const ok = weekBalance(planWeek({ recipes, goals, history: {}, dates: ["d1"], focus: "protein" }), recipes, goals, (x) => x);
    expect(ok.notes.length).toBeGreaterThan(0);
  });
});

describe("eatNextIndex", () => {
  const day = ["Breakfast", "Lunch", "Snack", "Dinner"] as MealName[];
  it("is the first uneaten meal whose time has not passed", () => {
    expect(eatNextIndex(day, [], 8)).toBe(0);
    expect(eatNextIndex(day, ["Breakfast"], 9)).toBe(1);
    expect(eatNextIndex(day, [], 13)).toBe(1); // a skipped breakfast is not offered at lunch time
    expect(eatNextIndex(day, ["Lunch"], 13)).toBe(2);
  });
  it("is -1 when nothing is left today", () => {
    expect(eatNextIndex(day, ["Dinner"], 20)).toBe(-1);
  });
});

describe("eatNext", () => {
  const dm = (meal: MealName, id: string) => ({ meal, recipe: { id, name: id, ingredients: [{ name: "Rice", qty: 1, unit: "cup" }] } as unknown as Recipe });
  const today = [dm("Breakfast", "oats"), dm("Lunch", "dal"), dm("Dinner", "palak")];
  const tomorrow = [dm("Breakfast", "eggs")];
  it("picks the next meal by the clock, with the rest of today and what blocks it", () => {
    const n = eatNext({ today, tomorrow, eaten: [], hour: 13, pantry: [] })!;
    expect(n.recipe.id).toBe("dal");
    expect(n.tomorrow).toBe(false);
    expect(n.then.map((m) => m.meal)).toEqual(["Dinner"]);
    expect(n.cook.unknown.map((i) => i.name)).toEqual(["Rice"]); // an empty pantry: unknown, not missing
    expect(eatNext({ today, tomorrow, eaten: [], hour: 13, pantry: [{ name: "rice", qty: 0 } as never] })!.cook.needed.map((i) => i.name)).toEqual(["Rice"]);
    expect(eatNext({ today, tomorrow, eaten: [], hour: 13, pantry: [{ name: "rice", qty: 2 } as never] })!.cook.canCook).toBe(true);
  });
  it("is tomorrow's first meal when today is done, and null with no plan", () => {
    expect(eatNext({ today, tomorrow, eaten: ["Dinner"], hour: 21, pantry: [] })).toMatchObject({ meal: "Breakfast", tomorrow: true, then: [] });
    expect(eatNext({ today: [], tomorrow: [], eaten: [], hour: 9, pantry: [] })).toBeNull();
  });
});

describe("prepTasks", () => {
  const dish = (id: string, name: string, ingredients: [string, string][]) => ({ id, name, ingredients: ingredients.map(([n, unit]) => ({ name: n, qty: 1, unit })) }) as Recipe;
  const rajma = dish("rajma", "Rajma chawal", [["Rajma", "cup"], ["Rice", "cups"]]);
  const canned = dish("chole", "Chole", [["Chickpeas", "cans"]]);
  const tikka = dish("tikka", "Chicken tikka", [["Chicken", "lb"], ["Greek yogurt", "cup"]]);
  const oats = dish("oats", "Overnight oats", [["Oats", "cups"]]);
  it("soaks and sets the night before tomorrow's meals; short jobs for tomorrow wait", () => {
    expect(prepTasks("d", [], [rajma, tikka, oats, canned]).map((t) => `${t.due}:${t.action}`)).toEqual(["tonight:Soak the rajma", "tonight:Set the overnight oats"]);
  });
  it("anything for a meal still ahead today is due now", () => {
    expect(prepTasks("d", [tikka], [])).toEqual([{ id: "d:today:tikka:marinate", action: "Marinate the chicken", dish: "Chicken tikka", recipeId: "tikka", due: "now", forDay: "today" }]);
  });
});

import { describe, expect, it } from "vitest";
import type { MealLog } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import { logRecipeEaten } from "./logRecipe";

const recipe = { id: "dal-rice", name: "Dal rice", servings: 2, kcal: 600, protein: 20, carbs: 90, fat: 12 } as Recipe;
const repo = () => {
  const rows: MealLog[] = [];
  return { rows, listBetween: async () => rows, add: async (l: MealLog) => void rows.push(l), remove: async () => undefined };
};

describe("logRecipeEaten", () => {
  it("logs one serving with the recipe's numbers by default", async () => {
    const r = repo();
    const log = await logRecipeEaten(r, { id: "1", date: "2026-11-23", slot: "lunch", recipe, source: "cook" });
    expect(log).toMatchObject({ name: "Dal rice", recipeId: "dal-rice", servings: 1, kcal: 600, protein: 20 });
    expect(r.rows).toHaveLength(1);
  });
  it("refuses zero servings and logs nothing", async () => {
    const r = repo();
    await expect(logRecipeEaten(r, { id: "1", date: "2026-11-23", slot: "lunch", recipe, servings: 0, source: "chat" })).rejects.toThrow();
    expect(r.rows).toHaveLength(0);
  });
});

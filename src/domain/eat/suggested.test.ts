import { describe, expect, it } from "vitest";
import type { Recipe } from "../recipes/types";
import { suggested } from "./suggested";

const rec = (id: string, o: Partial<Recipe> = {}): Recipe =>
  ({ id, name: id, meal: "Lunch", minutes: 30, kcal: 500, protein: 15, ingredients: [{ name: "Rice", qty: 1, unit: "" }], steps: [], ...o }) as Recipe;

const recipes = [rec("dal"), rec("toast", { minutes: 5 }), rec("oats", { minutes: 8, meal: "Breakfast" }), rec("curry", { minutes: 45 }), rec("salad", { minutes: 15 }), rec("rice", { minutes: 25 })];
const base = { recipes, pantry: [], today: "2026-11-27", hour: 12 };

describe("suggested", () => {
  it("puts leftovers first, then prepped, each recipe once", () => {
    const out = suggested({ ...base, leftovers: [{ id: "l1", recipeId: "dal", name: "dal", portions: 2, madeOn: "2026-11-26" }], prepped: ["curry", "dal"] });
    expect(out[0]).toMatchObject({ badge: "leftover", leftoverId: "l1", note: "2 portions left" });
    expect(out[0].recipe.id).toBe("dal");
    expect(out[1]).toMatchObject({ badge: "prepped" });
    expect(out[1].recipe.id).toBe("curry");
    expect(new Set(out.map((o) => o.recipe.id)).size).toBe(out.length);
  });

  it("drops leftovers older than the fridge allows", () => {
    const out = suggested({ ...base, leftovers: [{ id: "l2", recipeId: "dal", name: "dal", portions: 1, madeOn: "2026-11-10" }], prepped: [] });
    expect(out.some((o) => o.badge === "leftover")).toBe(false);
  });

  it("offers instant dishes (10 minutes or less) and always fills the page", () => {
    const out = suggested({ ...base, leftovers: [], prepped: [] });
    const instant = out.filter((x) => x.badge === "instant");
    expect(instant.length).toBeGreaterThan(0);
    for (const o of instant) expect(o.recipe.minutes).toBeLessThanOrEqual(10);
    expect(out.length).toBe(recipes.length);
  });

  it("skips a leftover the diet rules out", () => {
    const egg = rec("egg", { ingredients: [{ name: "Chicken thighs", qty: 1, unit: "" }] });
    const out = suggested({ ...base, recipes: [...recipes, egg], diet: "vegetarian", leftovers: [{ id: "l3", recipeId: "egg", name: "egg", portions: 1, madeOn: "2026-11-27" }], prepped: [] });
    expect(out.some((o) => o.recipe.id === "egg")).toBe(false);
  });
});

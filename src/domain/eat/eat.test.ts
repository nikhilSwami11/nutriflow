import { describe, expect, it } from "vitest";
import type { PantryItem } from "../pantry/types";
import type { Recipe } from "../recipes/types";
import { dietAllows, dietOf } from "./diet";
import { boostFromSearch } from "./search";
import { mealForHour, parseWants, suggestMeals } from "./suggest";

const rec = (id: string, o: Partial<Recipe> & { names?: string[] } = {}): Recipe =>
  ({ id, name: id, meal: "Lunch", minutes: 30, kcal: 500, protein: 15, ingredients: (o.names ?? ["Rice"]).map((name) => ({ name, qty: 1, unit: "" })), ...o }) as Recipe;
const have = (...names: string[]): PantryItem[] => names.map((name) => ({ id: name, name, group: "Dry goods", qty: 2, unit: "pcs", lowAt: 1 }));

describe("dietOf and dietAllows", () => {
  it("reads the diet from the ingredients", () => {
    expect(dietOf(rec("a", { names: ["Rice", "Cumin"] }))).toBe("vegan");
    expect(dietOf(rec("b", { names: ["Rice", "Ghee"] }))).toBe("vegetarian");
    expect(dietOf(rec("c", { names: ["Eggs", "Onions"] }))).toBe("egg");
    expect(dietOf(rec("d", { names: ["Chicken thighs", "Eggs"] }))).toBe("nonveg");
  });
  it("lets each diet keep to its own", () => {
    const egg = rec("c", { names: ["Eggs"] });
    expect([dietAllows("anything", egg), dietAllows("eggetarian", egg), dietAllows("vegetarian", egg), dietAllows("vegan", egg), dietAllows(undefined, egg)]).toEqual([true, true, false, false, true]);
  });
});

describe("parseWants and mealForHour", () => {
  it("hears a few wishes at once", () => {
    expect(parseWants("I need to eat something quick and light")).toEqual(["quick", "light"]);
    expect(parseWants("high protein after the gym, use what I have")).toEqual(["protein", "pantry"]);
    expect(parseWants("I need to eat something")).toEqual([]);
  });
  it("maps the hour to a meal", () => {
    expect([8, 12, 16, 20].map(mealForHour)).toEqual(["Breakfast", "Lunch", "Snack", "Dinner"]);
  });
});

describe("suggestMeals", () => {
  const recipes = [rec("ready", { names: ["Rice", "Dal"] }), rec("missing", { names: ["Saffron", "Truffle"] }), rec("meaty", { names: ["Rice", "Chicken"] })];
  const pantry = have("Rice", "Dal");

  it("puts what the pantry already has first, with reasons", () => {
    const [top] = suggestMeals({ recipes, pantry, hour: 12 });
    expect(top.recipe.id).toBe("ready");
    expect(top.ready).toBe(true);
    expect(top.reasons).toContain("Ready to cook");
  });
  it("drops what the diet or a dislike rules out", () => {
    expect(suggestMeals({ recipes, pantry, hour: 12, diet: "vegetarian" }).map((s) => s.recipe.id)).not.toContain("meaty");
    expect(suggestMeals({ recipes, pantry, hour: 12, dislikes: ["dal"] }).map((s) => s.recipe.id)).not.toContain("ready");
  });
  it("prefers what fits the calories left", () => {
    const big = rec("big", { names: ["Rice", "Dal"], kcal: 900 });
    const small = rec("small", { names: ["Rice", "Dal"], kcal: 300 });
    expect(suggestMeals({ recipes: [big, small], pantry, hour: 12, kcalLeft: 400 })[0].recipe.id).toBe("small");
  });
  it("honours quick, light and protein wishes", () => {
    const slow = rec("slow", { names: ["Rice"], minutes: 60, kcal: 700 });
    const fast = rec("fast", { names: ["Rice"], minutes: 10, kcal: 300 });
    expect(suggestMeals({ recipes: [slow, fast], pantry, hour: 12, wants: ["quick", "light"] })[0].recipe.id).toBe("fast");
    const lean = rec("lean", { names: ["Rice"], protein: 40 });
    const low = rec("low", { names: ["Rice"], protein: 5 });
    expect(suggestMeals({ recipes: [low, lean], pantry, hour: 12, wants: ["protein"] })[0].recipe.id).toBe("lean");
  });
  it("is steady: same input, same answer, limited to three", () => {
    const many = Array.from({ length: 6 }, (_, i) => rec(`r${i}`));
    const a = suggestMeals({ recipes: many, pantry, hour: 12 }).map((s) => s.recipe.id);
    expect(a).toEqual(suggestMeals({ recipes: many, pantry, hour: 12 }).map((s) => s.recipe.id));
    expect(a).toHaveLength(3);
  });
});

describe("search by meaning", () => {
  it("boosts the best three matches that are close enough, 3 then 2 then 1", async () => {
    const search = { search: async () => [{ id: "a", similarity: 0.6 }, { id: "b", similarity: 0.4 }, { id: "c", similarity: 0.1 }, { id: "d", similarity: 0.3 }] };
    expect(await boostFromSearch(search, "warm and spicy")).toEqual({ a: 3, b: 2, d: 1 });
  });
  it("is empty when search is missing, down, slow, or the words are empty", async () => {
    expect(await boostFromSearch(undefined, "x")).toEqual({});
    expect(await boostFromSearch({ search: async () => { throw new Error("down"); } }, "x")).toEqual({});
    expect(await boostFromSearch({ search: () => new Promise(() => undefined) }, "x")).toEqual({});
    expect(await boostFromSearch({ search: async () => [{ id: "a", similarity: 0.9 }] }, "  ")).toEqual({});
  });
  it("lifts a boosted recipe over a better pantry match and says why", () => {
    const a = rec("plain", { names: ["Rice", "Dal"] });
    const b = rec("spicy", { names: ["Chillies"] });
    const [top] = suggestMeals({ recipes: [a, b], pantry: have("Rice", "Dal"), hour: 12, boost: { spicy: 9 } });
    expect(top.recipe.id).toBe("spicy");
    expect(top.reasons[0]).toBe("Matches your words");
  });
});

import { describe, expect, it } from "vitest";
import type { MyRecipe } from "../recipes/mine";
import type { Recipe } from "../recipes/types";
import { askAiToChange, saveEdited, toDraft, type RecipeAdapter } from "./edit";

const base: Recipe = {
  id: "dal", name: "Dal tadka", blurb: "Lentils", minutes: 30, servings: 2, meal: "Dinner", kcal: 400, protein: 20, carbs: 50, fat: 10, tint: "#abc", image: "/recipes/dal.webp",
  ingredients: [{ name: "Toor dal", qty: 200, unit: "g" }, { name: "Onion", qty: 1, unit: "pcs" }, { name: "Salt", qty: 1, unit: "tsp" }],
  steps: [{ text: "Boil the dal", verb: "Boil", minutes: 20, look: "soft" }, { text: "Fry onion", verb: "Fry" }],
  swaps: [{ ingredient: "Onion", use: "shallot" }],
};

function deps(adapter?: RecipeAdapter) {
  const rows: MyRecipe[] = [];
  let n = 0;
  return { rows, d: { mine: { list: async () => rows, put: async (recipe: Recipe, saved: boolean) => void rows.push({ recipe, saved }) }, newId: () => `n${++n}`, adapter } };
}

describe("editing a recipe", () => {
  it("a built-in edit is kept as the person's own copy, with the picture", async () => {
    const { d, rows } = deps();
    const draft = { ...toDraft(base), name: "Dal, my way", servings: 4 };
    const r = await saveEdited(d, base, draft, false);
    expect(r).toMatchObject({ id: "ai-n1", name: "Dal, my way", servings: 4, image: "/recipes/dal.webp", tint: "#abc", written: true });
    expect(r?.swaps).toEqual(base.swaps);
    expect(rows).toEqual([{ recipe: r, saved: true }]);
  });

  it("their own recipe is changed in place and a step keeps its minutes and look", async () => {
    const { d } = deps();
    const mine = { ...base, id: "ai-x" };
    const draft = toDraft(mine);
    draft.steps[0].text = "Boil the dal with turmeric";
    const r = await saveEdited(d, mine, draft, true);
    expect(r?.id).toBe("ai-x");
    expect(r?.steps[0]).toMatchObject({ text: "Boil the dal with turmeric", minutes: 20, look: "soft" });
  });

  it("an edit that is not a recipe is refused and nothing is saved", async () => {
    const { d, rows } = deps();
    expect(await saveEdited(d, base, { ...toDraft(base), steps: [] }, false)).toBeNull();
    expect(await saveEdited(d, base, { ...toDraft(base), name: " " }, false)).toBeNull();
    expect(rows).toHaveLength(0);
  });
});

describe("Ask AI", () => {
  it("keeps the AI's version unsaved with the picture; the original is untouched", async () => {
    const { d, rows } = deps({ adapt: async ({ recipe, instruction }) => ({ ...recipe, name: `${recipe.name} (${instruction})`, ingredients: recipe.ingredients.filter((i) => i.name !== "Onion") }) });
    const r = await askAiToChange(d, base, " no onion ", { dislikes: [] });
    expect(r).toMatchObject({ id: "ai-n1", name: "Dal tadka (no onion)", image: "/recipes/dal.webp" });
    expect(rows).toEqual([{ recipe: r, saved: false }]);
  });

  it("explains in plain words when the AI is missing, slow, or wrong", async () => {
    await expect(askAiToChange(deps().d, base, "spicier", { dislikes: [] })).rejects.toThrow(/account/);
    await expect(askAiToChange({ ...deps({ adapt: () => new Promise(() => undefined) }).d, timeoutMs: 10 }, base, "x", { dislikes: [] })).rejects.toThrow(/too long/);
    const wrong = deps({ adapt: async ({ recipe }) => ({ ...recipe, steps: [] }) });
    await expect(askAiToChange(wrong.d, base, "x", { dislikes: [] })).rejects.toThrow(/differently/);
    await expect(askAiToChange(wrong.d, base, "  ", { dislikes: [] })).rejects.toThrow(/Say what/);
    expect(wrong.rows).toHaveLength(0);
  });

  it("refuses a version that breaks the diet or a dislike", async () => {
    const { d } = deps({ adapt: async ({ recipe }) => ({ ...recipe, ingredients: [...recipe.ingredients, { name: "Chicken", qty: 100, unit: "g" }] }) });
    await expect(askAiToChange(d, base, "more protein", { diet: "vegetarian", dislikes: [] })).rejects.toThrow(/differently/);
  });
});

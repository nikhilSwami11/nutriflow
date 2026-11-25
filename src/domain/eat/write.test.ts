import { describe, expect, it } from "vitest";
import type { MyRecipe } from "../recipes/mine";
import type { Recipe } from "../recipes/types";
import { kcalTargetFor, toRecipe, whatToEat, type DraftRecipe, type RecipeWriter, type WriteInput } from "./write";

const builtin = (o: Partial<Recipe> & { id: string }): Recipe => ({
  name: o.id, blurb: "", minutes: 10, servings: 1, meal: "Breakfast", kcal: 300, protein: 10, carbs: 40, fat: 8, tint: "#eee",
  ingredients: [{ name: "Oats", qty: 1, unit: "cup" }], steps: [{ text: "Cook", verb: "Boil" }], ...o,
});
const BUILTINS = [builtin({ id: "oats", name: "Oats porridge", image: "/recipes/oats.webp" }), builtin({ id: "toast", name: "Toast" }), builtin({ id: "eggs", name: "Eggs" })];

const draft = (o: Partial<DraftRecipe> = {}): DraftRecipe => ({
  name: "Paneer bhurji", blurb: "Spiced scrambled paneer", minutes: 20, servings: 2, kcal: 420, protein: 24, carbs: 12, fat: 28,
  ingredients: [{ name: "Paneer", qty: 200, unit: "g" }, { name: "Onion", qty: 1, unit: "pcs" }],
  steps: [{ text: "Chop the onion", verb: "chop" }, { text: "Cook the paneer", verb: "Saute", minutes: 5 }, { text: "Plate it", verb: "garnish" }],
  ...o,
});

function mine() {
  const rows: MyRecipe[] = [];
  return { rows, repo: { list: async () => rows, put: async (recipe: Recipe, saved: boolean) => void rows.push({ recipe, saved }) } };
}
const writer = (fn: (i: WriteInput) => Promise<{ recipe: DraftRecipe; ideas: { name: string; blurb: string }[] }>): RecipeWriter => ({ write: fn });
const input = { builtins: BUILTINS, pantry: [], dayMax: 2000, hour: 8, wants: [] };

describe("toRecipe", () => {
  it("keeps only the cook screen's verbs, rounds numbers and marks it written", () => {
    const r = toRecipe(draft(), "ai-1", "Breakfast", { dislikes: [] }, BUILTINS)!;
    expect(r.steps.map((s) => s.verb)).toEqual(["Chop", "Sauté", "Stir"]);
    expect(r.steps[1].minutes).toBe(5);
    expect(r).toMatchObject({ id: "ai-1", written: true, meal: "Breakfast", tint: "#F4E3A1" });
  });

  it("borrows the picture of a built-in dish with the same name", () => {
    expect(toRecipe(draft({ name: "Oats porridge" }), "ai-1", "Breakfast", { dislikes: [] }, BUILTINS)!.image).toBe("/recipes/oats.webp");
  });

  it("refuses nonsense, a dislike or the wrong diet", () => {
    expect(toRecipe(draft({ kcal: -5 }), "a", "Lunch", { dislikes: [] }, [])).toBeNull();
    expect(toRecipe(draft({ steps: [{ text: "Eat", verb: "Serve" }] }), "a", "Lunch", { dislikes: [] }, [])).toBeNull();
    expect(toRecipe(draft(), "a", "Lunch", { dislikes: ["paneer"] }, [])).toBeNull();
    expect(toRecipe(draft({ ingredients: [{ name: "Chicken", qty: 1, unit: "pcs" }, { name: "Rice", qty: 1, unit: "cup" }] }), "a", "Lunch", { diet: "vegetarian", dislikes: [] }, [])).toBeNull();
  });
});

describe("kcalTargetFor", () => {
  it("is the meal's share of the day, never more than what is left", () => {
    expect(kcalTargetFor("Lunch", 2000)).toBe(700);
    expect(kcalTargetFor("Lunch", 2000, 400)).toBe(400);
    expect(kcalTargetFor("Snack", 2000, 0)).toBe(150);
  });
});

describe("whatToEat", () => {
  it("keeps a written meal (not saved) so it can be opened, with two ideas", async () => {
    const m = mine();
    const out = await whatToEat({ writer: writer(async () => ({ recipe: draft(), ideas: [{ name: "Poha", blurb: "Flattened rice" }, { name: "Upma", blurb: "" }, { name: "Extra", blurb: "" }] })), mine: m.repo, newId: () => "x" }, input);
    expect(out.source).toBe("ai");
    expect(out.best.id).toBe("ai-x");
    expect(out.ideas.map((i) => i.name)).toEqual(["Poha", "Upma"]);
    expect(m.rows).toEqual([{ recipe: out.best, saved: false }]);
  });

  it("falls back to the built-ins when there is no writer, it fails, it is slow, or it writes junk", async () => {
    const cases: (RecipeWriter | undefined)[] = [
      undefined,
      writer(async () => Promise.reject(new Error("down"))),
      writer(() => new Promise(() => undefined)),
      writer(async () => ({ recipe: draft({ kcal: Number.NaN }), ideas: [] })),
    ];
    for (const w of cases) {
      const m = mine();
      const out = await whatToEat({ writer: w, mine: m.repo, newId: () => "x", timeoutMs: 20 }, input);
      expect(out.source).toBe("rules");
      expect(out.ideas).toHaveLength(2);
      expect(out.ideas.every((i) => i.recipeId)).toBe(true);
      expect(m.rows).toEqual([]);
    }
  });

  it("passes what it knows: the meal by hour, the target, what the pantry has, and the idea", async () => {
    let seen: WriteInput | undefined;
    await whatToEat({ writer: writer(async (i) => ((seen = i), { recipe: draft(), ideas: [] })), mine: mine().repo, newId: () => "x" }, {
      ...input, hour: 13, kcalLeft: 500, idea: "Paneer wrap",
      pantry: [{ id: "1", name: "Paneer", group: "Dairy", qty: 1, unit: "pcs", lowAt: 0 }, { id: "2", name: "Milk", group: "Dairy", qty: 0, unit: "cups", lowAt: 1 }],
    });
    expect(seen).toMatchObject({ meal: "Lunch", kcalTarget: 500, pantry: ["Paneer"], idea: "Paneer wrap", dislikes: [] });
  });
});

import { matchPicture } from "./write";
describe("matchPicture", () => {
  const b = (name: string, image?: string) => ({ id: name, name, image }) as unknown as Recipe;
  const builtins = [b("Dal tadka", "/recipes/dal-tadka.webp"), b("Chicken tikka masala", "/recipes/ctm.webp"), b("Chicken curry", "/recipes/cc.webp"), b("Vegetable poha", "/recipes/poha.webp"), b("Greek salad")];
  it("takes the picture of the same dish, even with extra words or a different order", () => {
    expect(matchPicture("Dal Tadka with jeera rice", builtins)?.image).toBe("/recipes/dal-tadka.webp");
    expect(matchPicture("Tikka masala chicken", builtins)?.image).toBe("/recipes/ctm.webp");
    expect(matchPicture("Poha", builtins)?.image).toBe("/recipes/poha.webp");
  });
  it("does not borrow a picture for a different dish that shares a word, or from a recipe without one", () => {
    expect(matchPicture("Chicken salad", builtins)).toBeUndefined();
    expect(matchPicture("Greek salad", builtins)).toBeUndefined();
  });
});

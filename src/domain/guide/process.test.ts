import { describe, expect, it } from "vitest";
import type { Recipe } from "../recipes/types";
import { processTiles } from "./process";

const recipe = {
  servings: 4,
  ingredients: [
    { name: "Toor dal", qty: 1, unit: "cup" },
    { name: "Onions", qty: 2, unit: "" },
    { name: "Tomatoes", qty: 2, unit: "" },
    { name: "Ghee", qty: 2, unit: "tbsp" },
  ],
  steps: [
    { text: "Chop the onions and tomatoes", verb: "Chop" },
    { text: "Boil the dal until soft", verb: "Boil" },
    { text: "Heat the ghee and fry the onions", verb: "Fry" },
    { text: "Serve hot", verb: "Serve" },
    { text: "Chop fresh tomatoes to finish", verb: "Chop" },
  ],
} as Recipe;

describe("processTiles", () => {
  const tiles = processTiles(recipe, 4);
  it("starts with Wash for dal and produce, not for onions or ghee", () => {
    expect(tiles[0].verb).toBe("Wash");
    expect(tiles[0].items.map((i) => i.name)).toEqual(["Toor dal", "Tomatoes"]);
    expect(tiles[0].note).toMatch(/runs clear/);
  });
  it("groups steps of the same action into one tile, in first-seen order", () => {
    expect(tiles.map((t) => t.verb)).toEqual(["Wash", "Chop", "Boil", "Fry", "Serve"]);
    expect(tiles[1].steps).toEqual([1, 5]);
  });
  it("lists what each action works on, scaled to the servings", () => {
    expect(tiles[1].items.map((i) => i.name)).toEqual(["Onions", "Tomatoes"]);
    expect(tiles[2].items).toEqual([{ name: "Toor dal", amount: "1 cup · ≈ 200 g dry" }]);
    expect(processTiles(recipe, 8)[2].items[0].amount).toBe("2 cup · ≈ 400 g dry");
  });
  it("shows the step text when no ingredient is named", () => {
    expect(tiles[4].items).toEqual([]);
    expect(tiles[4].lines).toEqual(["Serve hot"]);
  });

  it("a timed action leaves hands free for ones that use other food, and the finish never runs in parallel", () => {
    const r = { ...recipe, steps: [
      { text: "Boil the dal until soft", verb: "Boil", minutes: 15 },
      { text: "Chop the onions and tomatoes", verb: "Chop" },
      { text: "Fry the onions in ghee", verb: "Fry" },
      { text: "Serve hot", verb: "Serve" },
    ] } as Recipe;
    const t = processTiles(r, 4);
    const boil = t.find((x) => x.verb === "Boil")!;
    const chop = t.find((x) => x.verb === "Chop")!;
    expect(boil.minutes).toBe(15);
    expect(boil.alongside.map((a) => a.verb)).toEqual(["Chop", "Fry"]);
    expect(chop.alongside).toEqual([{ verb: "Boil", label: "toor dal", minutes: 15 }]);
    expect(t.find((x) => x.verb === "Serve")!.alongside).toEqual([]);
  });

  it("gives every action its tasks to tick: items to wash, and the steps with their timers", () => {
    expect(tiles[0].tasks.map((t) => t.text)).toEqual(["Rinse toor dal", "Wash tomatoes"]);
    expect(tiles[1].tasks).toEqual([{ id: "s:0", text: "Chop the onions and tomatoes", stepIndex: 0 }, { id: "s:4", text: "Chop fresh tomatoes to finish", stepIndex: 4 }]);
  });
});

import { recipeSections } from "./process";
describe("recipeSections", () => {
  it("is one part for a simple recipe, with every step numbered", () => {
    const s = recipeSections(recipe, 4);
    expect(s).toHaveLength(1);
    expect(s[0].ingredients.map((i) => i.name)).toEqual(["Toor dal", "Onions", "Tomatoes", "Ghee"]);
    expect(s[0].steps.map((x) => x.number)).toEqual([1, 2, 3, 4, 5]);
  });
  it("splits a recipe into its parts, keeping the whole-recipe step numbers", () => {
    const r = { servings: 4, ingredients: [
      { name: "Chicken", qty: 500, unit: "g", group: "Marinade" }, { name: "Yogurt", qty: 0.5, unit: "cup", group: "Marinade" },
      { name: "Onion", qty: 2, unit: "", group: "Masala" }, { name: "Ginger-garlic paste", qty: 1, unit: "tbsp", group: "Masala" },
    ], steps: [
      { text: "Mix the chicken with the yogurt", verb: "Mix", group: "Marinade" }, { text: "Rest 30 minutes", verb: "Chill", group: "Marinade" },
      { text: "Fry the onion", verb: "Fry", group: "Masala" }, { text: "Add the paste and cook", verb: "Sauté", group: "Masala" },
    ] } as unknown as Recipe;
    const s = recipeSections(r, 4);
    expect(s.map((x) => x.title)).toEqual(["Marinade", "Masala"]);
    expect(s[1].ingredients.map((i) => i.name)).toEqual(["Onion", "Ginger-garlic paste"]);
    expect(s[1].steps.map((x) => x.number)).toEqual([3, 4]);
  });
});

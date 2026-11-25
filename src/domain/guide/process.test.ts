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
});

import { describe, expect, it } from "vitest";
import type { Recipe } from "../recipes/types";
import { cookableWith } from "./appliances";

const rec = (...verbs: string[]): Recipe => ({ id: "x", name: "x", blurb: "", minutes: 10, servings: 1, meal: "Dinner", kcal: 1, protein: 1, carbs: 1, fat: 1, tint: "", ingredients: [], steps: verbs.map((verb) => ({ text: "", verb })) as Recipe["steps"] });

describe("cookableWith", () => {
  it("everything when the kitchen was never asked about", () => expect(cookableWith(rec("Bake"), undefined)).toBe(true));
  it("a bake needs an oven", () => {
    expect(cookableWith(rec("Chop", "Bake"), ["stove"])).toBe(false);
    expect(cookableWith(rec("Chop", "Bake"), ["oven"])).toBe(true);
  });
  it("toast works with a toaster or an oven", () => {
    expect(cookableWith(rec("Toast"), ["toaster"])).toBe(true);
    expect(cookableWith(rec("Toast"), ["oven"])).toBe(true);
    expect(cookableWith(rec("Toast"), ["stove"])).toBe(false);
  });
  it("cold dishes need nothing", () => expect(cookableWith(rec("Chop", "Mix", "Serve"), [])).toBe(true));
});

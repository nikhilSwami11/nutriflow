import { describe, expect, it } from "vitest";
import type { PantryItem } from "../pantry/types";
import { ingredientStatus, readiness, scaleQty } from "./pantryMatch";
import type { Recipe } from "./types";

const recipe = { ingredients: [{ name: "Onions", qty: 2, unit: "" }, { name: "Butter", qty: 1, unit: "tbsp" }, { name: "Cumin seeds", qty: 1, unit: "tsp" }] } as Recipe;
const item = (name: string, qty: number): PantryItem => ({ id: name, name, group: "Produce", qty, unit: "pcs", lowAt: 1 });

describe("pantry match", () => {
  it("matches by name ignoring case and plural, needs quantity left", () => {
    const s = ingredientStatus(recipe, [item("onion", 1), item("Butter", 0), item("Cumin Seeds", 1)]);
    expect(s.map((x) => x.inPantry)).toEqual([true, false, true]);
  });
  it("readiness counts have and missing", () => {
    expect(readiness(recipe, [item("Onions", 3)])).toEqual({ have: 1, of: 3, missing: 2 });
    expect(readiness(recipe, [])).toEqual({ have: 0, of: 3, missing: 3 });
  });
});

describe("scaleQty", () => {
  it("scales to the nearest quarter", () => {
    expect(scaleQty(1, 4, 2)).toBe(0.5);
    expect(scaleQty(1, 4, 6)).toBe(1.5);
    expect(scaleQty(2, 4, 1)).toBe(0.5);
    expect(scaleQty(1, 4, 1)).toBe(0.25);
  });
});

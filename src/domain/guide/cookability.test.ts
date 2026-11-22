import { describe, expect, it } from "vitest";
import { item } from "../pantry/testing";
import type { Recipe } from "../recipes/types";
import { cookability } from "./cookability";

const recipe = {
  id: "x", name: "X", ingredients: [
    { name: "Paneer", qty: 1, unit: "" }, { name: "Butter", qty: 1, unit: "tbsp" }, { name: "Fresh coriander", qty: 1, unit: "bunch" }, { name: "Rice", qty: 1, unit: "cup" },
  ], steps: [],
} as unknown as Recipe;

describe("cookability", () => {
  it("everything at home: nothing to swap, skip or buy", () => {
    const c = cookability(recipe, [item({ id: "1", name: "Paneer" }), item({ id: "2", name: "Butter" }), item({ id: "3", name: "Fresh coriander" }), item({ id: "4", name: "Rice" })]);
    expect(c).toEqual({ swaps: [], skips: [], needed: [], canCook: true });
  });
  it("swap only counts when the stand-in is in the pantry", () => {
    const c = cookability(recipe, [item({ id: "1", name: "Tofu" }), item({ id: "2", name: "Ghee" }), item({ id: "4", name: "Rice" })]);
    expect(c.swaps.map((s) => s.name)).toEqual(["Paneer", "Butter"]);
    expect(c.skips).toEqual(["Fresh coriander"]);
    expect(c.canCook).toBe(true);
  });
  it("a missing main ingredient with no stand-in blocks and is listed as needed", () => {
    const c = cookability(recipe, [item({ id: "4", name: "Rice" }), item({ id: "2", name: "Butter" })]);
    expect(c.needed.map((n) => n.name)).toEqual(["Paneer"]);
    expect(c.canCook).toBe(false);
  });
  it("an empty stand-in (qty 0) does not count", () => {
    const c = cookability(recipe, [item({ id: "1", name: "Tofu", qty: 0 }), item({ id: "2", name: "Butter" }), item({ id: "4", name: "Rice" })]);
    expect(c.needed.map((n) => n.name)).toEqual(["Paneer"]);
  });
});

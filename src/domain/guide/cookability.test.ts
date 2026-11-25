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
    expect(c).toEqual({ swaps: [], skips: [], needed: [], canCook: true, unknown: [], assumed: [], state: "ready" });
  });
  it("swap only counts when the stand-in is in the pantry", () => {
    const c = cookability(recipe, [item({ id: "1", name: "Tofu" }), item({ id: "2", name: "Ghee" }), item({ id: "4", name: "Rice" })]);
    expect(c.swaps.map((s) => s.name)).toEqual(["Paneer", "Butter"]);
    expect(c.skips).toEqual(["Fresh coriander"]);
    expect(c.canCook).toBe(true);
  });
  it("a missing main ingredient with no stand-in blocks and is listed as needed", () => {
    const c = cookability(recipe, [item({ id: "4", name: "Rice" }), item({ id: "2", name: "Butter" }), item({ id: "1", name: "Paneer", qty: 0 })]);
    expect(c.needed.map((n) => n.name)).toEqual(["Paneer"]);
    expect(c.canCook).toBe(false);
  });
  it("an empty stand-in (qty 0) does not count", () => {
    const c = cookability(recipe, [item({ id: "1", name: "Tofu", qty: 0 }), item({ id: "2", name: "Butter" }), item({ id: "4", name: "Rice" }), item({ id: "5", name: "Paneer", qty: 0 })]);
    expect(c.needed.map((n) => n.name)).toEqual(["Paneer"]);
  });

  it("an empty pantry says unknown, not missing: ask what they have", () => {
    const c = cookability(recipe, []);
    expect(c.needed).toEqual([]);
    expect(c.unknown.map((n) => n.name)).toEqual(["Paneer", "Butter", "Rice"]);
    expect(c.skips).toEqual(["Fresh coriander"]);
    expect(c.state).toBe("check");
    expect(c.canCook).toBe(false);
  });
  it("a set-up pantry that lacks something means it is missing", () => {
    const five = ["a", "b", "c", "d", "e"].map((n) => item({ id: n, name: `Thing ${n}` }));
    const c = cookability(recipe, five);
    expect(c.needed.map((n) => n.name)).toEqual(["Paneer", "Butter", "Rice"]);
    expect(c.state).toBe("missing");
  });
  it("salt and oil are assumed at home unless the pantry says they ran out", () => {
    const r = { id: "o", name: "Omelette", ingredients: [{ name: "Eggs", qty: 2, unit: "" }, { name: "Salt", qty: 1, unit: "tsp" }, { name: "Oil", qty: 1, unit: "tbsp" }], steps: [] } as unknown as Recipe;
    const none = cookability(r, [item({ id: "1", name: "Eggs" })]);
    expect(none.assumed).toEqual(["Salt", "Oil"]);
    expect(none.state).toBe("ready");
    const out = cookability(r, [item({ id: "1", name: "Eggs" }), item({ id: "2", name: "Salt", qty: 0 })]);
    expect(out.needed.map((n) => n.name)).toEqual(["Salt"]);
  });

  it("an ingredient listed in two parts of the dish counts once", () => {
    const r = { id: "t", name: "T", ingredients: [{ name: "Salt", qty: 1, unit: "tsp" }, { name: "Paneer", qty: 1, unit: "" }, { name: "Salt", qty: 1, unit: "tsp" }, { name: "Paneer", qty: 1, unit: "" }], steps: [] } as unknown as Recipe;
    const five = ["a", "b", "c", "d", "e"].map((n) => item({ id: n, name: `Thing ${n}` }));
    expect(cookability(r, five).needed.map((n) => n.name)).toEqual(["Paneer"]);
  });
});

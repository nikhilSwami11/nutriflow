import { describe, expect, it } from "vitest";
import { fakeList, fakePantry, item } from "../pantry/testing";
import type { PlanDay } from "../planning/types";
import type { Recipe } from "../recipes/types";
import { neededForPlan } from "./neededForPlan";
import { markBought, unmarkBought } from "./markBought";
import { recentlyBought, withBought, withoutBought } from "./bought";
import { clampAmount, formatQty, shopUnitFor } from "./units";
import { storeSearchUrl } from "./storeSearch";
import { isZip } from "./types";

describe("storeSearchUrl", () => {
  it("encodes the item name for each store", () => {
    expect(storeSearchUrl("walmart", " Cumin seeds ")).toBe("https://www.walmart.com/search?q=Cumin%20seeds");
    expect(storeSearchUrl("aldi", "Onions & garlic")).toBe("https://www.aldi.us/results?q=Onions%20%26%20garlic");
    expect(storeSearchUrl("costco", "Ghee")).toContain("keyword=Ghee");
  });
});

describe("isZip", () => {
  it("wants exactly five digits", () => {
    expect(isZip("94103")).toBe(true);
    expect(isZip(" 94103 ")).toBe(true);
    expect(isZip("9410")).toBe(false);
    expect(isZip("94103-1")).toBe(false);
    expect(isZip("abcde")).toBe(false);
  });
});

describe("markBought", () => {
  it("adds the amount to the pantry when the units match, and leaves the list", async () => {
    const pantry = fakePantry([item({ id: "a", qty: 1, unit: "cups" })]);
    const list = fakeList(["a"]);
    await list.setAmount("a", { qty: 3, unit: "cups" });
    expect(await markBought({ pantry, list }, "a")).toEqual({ qty: 3, unit: "cups" });
    expect(pantry.items.get("a")!.qty).toBe(4);
    expect(list.ids.has("a")).toBe(false);
  });
  it("only makes sure it is not low when the units differ (kg bought, pantry counts pieces)", async () => {
    const pantry = fakePantry([item({ id: "a", qty: 0, lowAt: 2, unit: "pcs" })]);
    const list = fakeList(["a"]);
    await list.setAmount("a", { qty: 2, unit: "kg" });
    await markBought({ pantry, list }, "a");
    expect(pantry.items.get("a")!.qty).toBe(3);
  });
  it("counts one piece when no amount was set, and still clears an unknown id", async () => {
    const pantry = fakePantry([item({ id: "a", qty: 0, unit: "pcs", lowAt: 0 })]);
    const list = fakeList(["a", "ghost"]);
    await markBought({ pantry, list }, "a");
    await markBought({ pantry, list }, "ghost");
    expect(pantry.items.get("a")!.qty).toBe(1);
    expect(list.ids.size).toBe(0);
  });
});

describe("unmarkBought", () => {
  it("puts the pantry quantity and the amount back, and the item on the list", async () => {
    const pantry = fakePantry([item({ id: "a", qty: 1, unit: "pcs" })]);
    const list = fakeList(["a"]);
    await list.setAmount("a", { qty: 3, unit: "pcs" });
    const amount = await markBought({ pantry, list }, "a");
    await unmarkBought({ pantry, list }, "a", 1, amount);
    expect(pantry.items.get("a")!.qty).toBe(1);
    expect(list.ids.has("a")).toBe(true);
    expect(list.amount.a).toEqual({ qty: 3, unit: "pcs" });
  });
});

describe("units", () => {
  it("clamps to one step up to 999, with no ragged decimals", () => {
    expect(clampAmount({ qty: 0, unit: "g" })).toEqual({ qty: 50, unit: "g" });
    expect(clampAmount({ qty: 1.234, unit: "kg" })).toEqual({ qty: 1.23, unit: "kg" });
    expect(clampAmount({ qty: 5000, unit: "pcs" }).qty).toBe(999);
    expect(formatQty(2)).toBe("2");
    expect(formatQty(0.5)).toBe("0.5");
  });
  it("reads recipe unit words as what a shop sells by", () => {
    expect([shopUnitFor("cup"), shopUnitFor("tbsp"), shopUnitFor(""), shopUnitFor("pinch"), shopUnitFor("clove")]).toEqual(["cups", "tbsp", "pcs", "pcs", "cloves"]);
  });
});

describe("bought history", () => {
  const rec = (id: string, at: number) => ({ id, prevQty: 0, amount: { qty: 1, unit: "pcs" as const }, at });
  const H = 3600_000;
  it("keeps 12 hours, newest first, and drops the rest", () => {
    const now = 100 * H;
    expect(recentlyBought([rec("old", now - 13 * H), rec("a", now - 11 * H), rec("b", now - H)], now).map((r) => r.id)).toEqual(["b", "a"]);
  });
  it("replaces the same item, prunes expired ones, and removes on undo", () => {
    const now = 100 * H;
    const next = withBought([rec("a", now - 2 * H), rec("old", now - 20 * H)], rec("a", now));
    expect(next.map((r) => [r.id, r.at])).toEqual([["a", now]]);
    expect(withoutBought(next, "a")).toEqual([]);
  });
});

describe("neededForPlan", () => {
  const r = (id: string, names: string[]) => ({ id, ingredients: names.map((name) => ({ name, qty: 1, unit: "" })) }) as Recipe;
  const recipes = [r("a", ["Onions", "Ghee"]), r("b", ["Onion", "Rice"]), r("c", ["Saffron"])];
  const plan: PlanDay[] = [
    { date: "2026-11-21", meals: [{ meal: "Lunch", recipeId: "a" }, { meal: "Dinner", recipeId: "b" }] },
    { date: "2026-11-22", meals: [{ meal: "Dinner", recipeId: "c" }] },
  ];
  const base = { plan, recipes, pantry: [item({ id: "g", name: "ghee", qty: 1 })], today: "2026-11-21", eatenToday: [] as never[] };

  it("lists what the pantry lacks once each, across days", () => {
    expect(neededForPlan(base).map((n) => n.name)).toEqual(["Onions", "Rice", "Saffron"]);
  });
  it("skips today's meals already eaten", () => {
    expect(neededForPlan({ ...base, eatenToday: ["Lunch"] }).map((n) => n.name)).toEqual(["Onion", "Rice", "Saffron"]);
  });
  it("only looks at the next few days, and not at the past", () => {
    expect(neededForPlan({ ...base, days: 1 }).map((n) => n.name)).toEqual(["Onions", "Rice"]);
    expect(neededForPlan({ ...base, today: "2026-11-22" }).map((n) => n.name)).toEqual(["Saffron"]);
  });
  it("fills the amount from the recipes, summing the same unit", () => {
    const rs = [
      { id: "a", ingredients: [{ name: "Onions", qty: 2, unit: "" }, { name: "Milk", qty: 1, unit: "cups" }] },
      { id: "b", ingredients: [{ name: "Onion", qty: 1, unit: "" }, { name: "Milk", qty: 200, unit: "ml" }] },
    ] as Recipe[];
    const p: PlanDay[] = [{ date: "2026-11-21", meals: [{ meal: "Lunch", recipeId: "a" }, { meal: "Dinner", recipeId: "b" }] }];
    expect(neededForPlan({ plan: p, recipes: rs, pantry: [], today: "2026-11-21", eatenToday: [] })).toEqual([
      { name: "Onions", qty: 3, unit: "pcs" },
      { name: "Milk", qty: 1, unit: "cups" },
    ]);
  });
});

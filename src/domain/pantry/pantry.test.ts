import { describe, expect, it } from "vitest";
import { addItemsFromUtterance } from "./addItemsFromUtterance";
import { adviseNeeds } from "./adviseNeeds";
import { addNamesToShoppingList } from "./addNamesToList";
import { adjustQuantity } from "./adjustQuantity";
import { depleteForRecipe } from "./depleteForRecipe";
import { getLowItems, listPantry } from "./listPantry";
import { fakeList, fakePantry, item } from "./testing";
import { toggleLowOnShoppingList } from "./toggleShoppingList";

describe("adjustQuantity", () => {
  it("adds and subtracts", async () => {
    const repo = fakePantry([item({ id: "a", qty: 2 })]);
    expect((await adjustQuantity(repo, "a", 1)).qty).toBe(3);
    expect((await adjustQuantity(repo, "a", -2)).qty).toBe(1);
  });
  it("clamps at 0", async () => {
    const repo = fakePantry([item({ id: "a", qty: 1 })]);
    expect((await adjustQuantity(repo, "a", -5)).qty).toBe(0);
  });
  it("throws for unknown id", async () => {
    await expect(adjustQuantity(fakePantry([]), "x", 1)).rejects.toThrow("not found");
  });
});

describe("listPantry / getLowItems", () => {
  const items = [
    item({ id: "onion", group: "Produce", qty: 1, lowAt: 2 }),
    item({ id: "milk", group: "Dairy", qty: 9, lowAt: 2 }),
    item({ id: "rice", group: "Dry goods", qty: 2, lowAt: 2 }),
  ];
  it("treats qty == lowAt as low", () => {
    expect(getLowItems(items).map((i) => i.id)).toEqual(["onion", "rice"]);
  });
  it("groups in design order with counts", () => {
    const v = listPantry(items);
    expect(v.groups.map((g) => g.name)).toEqual(["Produce", "Dairy", "Dry goods"]);
    expect(v.total).toBe(3);
    expect(v.lowCount).toBe(2);
  });
  it("low filter drops empty groups but keeps counts", () => {
    const v = listPantry(items, "low");
    expect(v.groups.map((g) => g.name)).toEqual(["Produce", "Dry goods"]);
    expect(v.total).toBe(3);
  });
});

describe("addItemsFromUtterance", () => {
  const parser = (parsed: { name: string; qty: number }[]) => ({ parse: async () => parsed });
  let n = 0;
  const newId = () => `new${++n}`;

  it("adds to existing items, matching plurals and case", async () => {
    const repo = fakePantry([item({ id: "onion", name: "Onions", qty: 1 })]);
    const out = await addItemsFromUtterance({ repo, parser: parser([{ name: "onion", qty: 3 }]), newId }, "x");
    expect(out).toHaveLength(1);
    expect(repo.items.get("onion")?.qty).toBe(4);
  });
  it("creates unknown items with defaults", async () => {
    const repo = fakePantry([]);
    await addItemsFromUtterance({ repo, parser: parser([{ name: "Butter", qty: 1 }]), newId }, "x");
    const created = [...repo.items.values()][0];
    expect(created).toMatchObject({ name: "Butter", qty: 1, group: "Dry goods", unit: "pcs", lowAt: 1 });
  });
  it("merges duplicates within one utterance and ignores non-positive qty", async () => {
    const repo = fakePantry([]);
    await addItemsFromUtterance(
      { repo, parser: parser([{ name: "egg", qty: 2 }, { name: "eggs", qty: 3 }, { name: "salt", qty: 0 }]), newId },
      "x",
    );
    const all = [...repo.items.values()];
    expect(all).toHaveLength(1);
    expect(all[0].qty).toBe(5);
  });
  it("saves nothing when nothing parsed", async () => {
    const repo = fakePantry([]);
    expect(await addItemsFromUtterance({ repo, parser: parser([]), newId }, "x")).toEqual([]);
  });
});

describe("depleteForRecipe", () => {
  it("subtracts ingredients", async () => {
    const repo = fakePantry([item({ id: "a", qty: 5 }), item({ id: "b", qty: 3 })]);
    const r = await depleteForRecipe(repo, [{ itemId: "a", qty: 2 }, { itemId: "b", qty: 1 }]);
    expect(r.shortfalls).toEqual([]);
    expect(repo.items.get("a")?.qty).toBe(3);
    expect(repo.items.get("b")?.qty).toBe(2);
  });
  it("reports shortfalls and clamps at 0", async () => {
    const repo = fakePantry([item({ id: "a", qty: 1 })]);
    const r = await depleteForRecipe(repo, [{ itemId: "a", qty: 3 }, { itemId: "ghost", qty: 2 }]);
    expect(r.shortfalls).toEqual([{ itemId: "a", missing: 2 }, { itemId: "ghost", missing: 2 }]);
    expect(repo.items.get("a")?.qty).toBe(0);
  });
  it("sums repeated ingredient lines", async () => {
    const repo = fakePantry([item({ id: "a", qty: 4 })]);
    await depleteForRecipe(repo, [{ itemId: "a", qty: 1 }, { itemId: "a", qty: 2 }]);
    expect(repo.items.get("a")?.qty).toBe(1);
  });
});

describe("toggleLowOnShoppingList", () => {
  const pantry = () => fakePantry([item({ id: "a", qty: 0 }), item({ id: "b", qty: 1 }), item({ id: "c", qty: 9 })]);
  it("lists all low items, then unlists them", async () => {
    const p = pantry(), l = fakeList();
    expect(await toggleLowOnShoppingList(p, l)).toEqual({ listed: true });
    expect([...l.ids].sort()).toEqual(["a", "b"]);
    expect(await toggleLowOnShoppingList(p, l)).toEqual({ listed: false });
    expect(l.ids.size).toBe(0);
  });
  it("tops up when only some are listed", async () => {
    const p = pantry(), l = fakeList(["a"]);
    expect(await toggleLowOnShoppingList(p, l)).toEqual({ listed: true });
    expect([...l.ids].sort()).toEqual(["a", "b"]);
  });
  it("does nothing when nothing is low", async () => {
    const p = fakePantry([item({ id: "c", qty: 9 })]), l = fakeList();
    expect(await toggleLowOnShoppingList(p, l)).toEqual({ listed: false });
  });
});

describe("hearUtterance", () => {
  it("returns parsed items without saving", async () => {
    const { hearUtterance } = await import("./addItemsFromUtterance");
    expect(await hearUtterance({ parse: async () => [{ name: "egg", qty: 2 }] }, "x")).toEqual([{ name: "egg", qty: 2 }]);
  });
});

describe("addNamesToShoppingList", () => {
  it("reuses known items, creates unknown ones at 0, and lists them all", async () => {
    const pantry = fakePantry([item({ id: "o", name: "Onions", qty: 0 })]);
    const list = fakeList();
    let n = 0;
    const count = await addNamesToShoppingList({ pantry, list, newId: () => `new${++n}` }, [{ name: "onion", qty: 2, unit: "kg" }, { name: "Garam masala" }]);
    expect(count).toBe(2);
    expect([...list.ids].sort()).toEqual(["new1", "o"]);
    expect(pantry.items.get("new1")).toMatchObject({ name: "Garam masala", qty: 0 });
    expect(list.amount).toEqual({ o: { qty: 2, unit: "kg" }, new1: { qty: 1, unit: "pcs" } });
  });
  it("does not duplicate a name given twice", async () => {
    const pantry = fakePantry([]);
    const list = fakeList();
    let n = 0;
    expect(await addNamesToShoppingList({ pantry, list, newId: () => `x${++n}` }, [{ name: "Ghee" }, { name: "ghee" }])).toBe(1);
  });
});

describe("adviseNeeds and the advisor in addNamesToShoppingList", () => {
  const needs = [{ name: "Milk", qty: 3, unit: "cups" as const }, { name: "Onions", qty: 2, unit: "pcs" as const }];

  it("uses good advice and keeps the recipe amount for a bad entry", async () => {
    const advisor = { suggest: async () => [{ name: "milk", qty: 1, unit: "l" as const }, { name: "Onions", qty: -4, unit: "pcs" as const }] };
    expect(await adviseNeeds(advisor, needs)).toEqual([{ name: "Milk", qty: 1, unit: "l" }, needs[1]]);
  });
  it("falls back to the recipe amounts when the advisor throws, is slow, or answers the wrong shape", async () => {
    expect(await adviseNeeds({ suggest: async () => { throw new Error("down"); } }, needs)).toEqual(needs);
    expect(await adviseNeeds({ suggest: () => new Promise(() => undefined) }, needs, 20)).toEqual(needs);
    expect(await adviseNeeds({ suggest: async () => [{ name: "Milk", qty: 1, unit: "furlongs" as never }] }, needs)).toEqual(needs);
    expect(await adviseNeeds(undefined, needs)).toEqual(needs);
  });
  it("only asks about what is not already on the list", async () => {
    const pantry = fakePantry([item({ id: "m", name: "Milk", qty: 0 })]);
    const list = fakeList(["m"]);
    await list.setAmount("m", { qty: 5, unit: "l" });
    const asked: string[][] = [];
    const advisor = { suggest: async (n: typeof needs) => (asked.push(n.map((x) => x.name)), n.map((x) => ({ ...x, qty: 9 }))) };
    await addNamesToShoppingList({ pantry, list, newId: () => "o", advisor }, needs);
    expect(asked).toEqual([["Onions"]]);
    expect(list.amount.m).toEqual({ qty: 5, unit: "l" });
    expect(list.amount.o).toEqual({ qty: 9, unit: "pcs" });
  });
});

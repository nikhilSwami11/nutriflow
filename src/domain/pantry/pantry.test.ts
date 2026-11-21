import { describe, expect, it } from "vitest";
import { addItemsFromUtterance } from "./addItemsFromUtterance";
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

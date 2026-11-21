import { describe, expect, it } from "vitest";
import { InMemoryPantryRepository, InMemoryShoppingListRepository, LocalUtteranceParser } from "./inMemory";
import { SEED } from "./seed";
import { fromRow, toRow } from "./supabase";

describe("in-memory repositories", () => {
  it("saves and lists", async () => {
    const r = new InMemoryPantryRepository(SEED);
    await r.save([{ ...SEED[0], qty: 9 }]);
    expect((await r.list()).find((i) => i.id === "onion")?.qty).toBe(9);
  });
  it("shopping list add/remove", async () => {
    const l = new InMemoryShoppingListRepository();
    await l.add(["a", "b"]);
    await l.remove(["a"]);
    expect(await l.list()).toEqual(["b"]);
  });
});

describe("LocalUtteranceParser", () => {
  it("parses the design example", async () => {
    expect(await new LocalUtteranceParser().parse("I have 3 onions, 2 tomatoes and butter")).toEqual([
      { name: "onions", qty: 3 },
      { name: "tomatoes", qty: 2 },
      { name: "butter", qty: 1 },
    ]);
  });
  it("handles number words", async () => {
    expect(await new LocalUtteranceParser().parse("two eggs")).toEqual([{ name: "eggs", qty: 2 }]);
  });
});

describe("row mapping", () => {
  it("round-trips and coerces numeric strings", () => {
    const row = toRow(SEED[2]);
    expect(fromRow({ ...row, qty: "8" as unknown as number })).toEqual(SEED[2]);
  });
});

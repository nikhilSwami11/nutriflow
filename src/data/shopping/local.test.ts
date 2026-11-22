import { describe, expect, it } from "vitest";
import { LocalBoughtRepository } from "./boughtLocal";
import { LocalShoppingPrefsRepository } from "./local";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};

describe("LocalShoppingPrefsRepository", () => {
  it("is empty, saves, and reads back", async () => {
    const r = new LocalShoppingPrefsRepository(mem());
    expect(await r.get()).toBeNull();
    await r.save({ zip: "94103", store: "aldi" });
    expect(await r.get()).toEqual({ zip: "94103", store: "aldi" });
  });
  it("survives corrupt or blocked storage", async () => {
    const bad = { getItem: () => "{nope", setItem: () => { throw new Error("blocked"); } };
    const r = new LocalShoppingPrefsRepository(bad);
    await expect(r.save({ zip: "94103", store: "aldi" })).resolves.toBeUndefined();
    expect(await r.get()).toBeNull();
  });
});

describe("LocalBoughtRepository", () => {
  it("saves and reads back, and shrugs off bad storage", async () => {
    const r = new LocalBoughtRepository(mem());
    expect(await r.list()).toEqual([]);
    const rec = { id: "a", prevQty: 1, amount: { qty: 2, unit: "kg" as const }, at: 5 };
    await r.save([rec]);
    expect(await r.list()).toEqual([rec]);
    const bad = new LocalBoughtRepository({ getItem: () => "{nope", setItem: () => { throw new Error("blocked"); } });
    await expect(bad.save([rec])).resolves.toBeUndefined();
    expect(await bad.list()).toEqual([]);
  });
});

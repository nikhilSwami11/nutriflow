import type { PantryRepository, ShoppingListRepository } from "./ports";
import type { PantryItem } from "./types";

/** Test doubles, also reused by the in-memory data repository later. */
export function fakePantry(seed: PantryItem[]): PantryRepository & { items: Map<string, PantryItem> } {
  const items = new Map(seed.map((i) => [i.id, i]));
  return {
    items,
    list: async () => [...items.values()],
    save: async (xs) => xs.forEach((x) => items.set(x.id, x)),
  };
}

export function fakeList(seed: string[] = []): ShoppingListRepository & { ids: Set<string> } {
  const ids = new Set(seed);
  return {
    ids,
    list: async () => [...ids],
    add: async (xs) => xs.forEach((x) => ids.add(x)),
    remove: async (xs) => xs.forEach((x) => ids.delete(x)),
  };
}

export const item = (o: Partial<PantryItem> & { id: string }): PantryItem => ({
  name: o.id,
  group: "Produce",
  qty: 5,
  unit: "pcs",
  lowAt: 2,
  ...o,
});

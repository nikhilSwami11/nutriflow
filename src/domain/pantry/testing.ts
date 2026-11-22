import type { PantryRepository, ShoppingListRepository } from "./ports";
import type { Amount, PantryItem } from "./types";

/** Test doubles, also reused by the in-memory data repository later. */
export function fakePantry(seed: PantryItem[]): PantryRepository & { items: Map<string, PantryItem> } {
  const items = new Map(seed.map((i) => [i.id, i]));
  return {
    items,
    list: async () => [...items.values()],
    save: async (xs) => xs.forEach((x) => items.set(x.id, x)),
  };
}

export function fakeList(seed: string[] = []): ShoppingListRepository & { ids: Set<string>; amount: Record<string, Amount> } {
  const ids = new Set(seed);
  const amount: Record<string, Amount> = {};
  return {
    ids,
    amount,
    amounts: async () => ({ ...amount }),
    setAmount: async (id, a) => void (amount[id] = a),
    list: async () => [...ids],
    add: async (xs, amounts = {}) =>
      xs.forEach((x) => {
        if (!ids.has(x) && amounts[x]) amount[x] = amounts[x];
        ids.add(x);
      }),
    remove: async (xs) => xs.forEach((x) => (ids.delete(x), delete amount[x])),
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

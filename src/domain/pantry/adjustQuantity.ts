import type { PantryRepository } from "./ports";
import { clampQty } from "./quantity";
import type { PantryItem } from "./types";

export async function adjustQuantity(repo: PantryRepository, id: string, delta: number): Promise<PantryItem> {
  const item = (await repo.list()).find((i) => i.id === id);
  if (!item) throw new Error(`Pantry item not found: ${id}`);
  const next = { ...item, qty: clampQty(item.qty + delta) };
  await repo.save([next]);
  return next;
}

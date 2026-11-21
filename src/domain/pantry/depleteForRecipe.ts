import type { PantryRepository } from "./ports";
import { clampQty } from "./quantity";
import type { PantryItem, RecipeIngredient } from "./types";

export interface Shortfall {
  itemId: string;
  missing: number;
}

/** Subtract ingredients used. Never goes below 0; reports what the pantry could not cover. */
export async function depleteForRecipe(
  repo: PantryRepository,
  ingredients: RecipeIngredient[],
): Promise<{ updated: PantryItem[]; shortfalls: Shortfall[] }> {
  const byId = new Map((await repo.list()).map((i) => [i.id, i]));
  const shortfalls: Shortfall[] = [];
  const updated = new Map<string, PantryItem>();

  for (const ing of ingredients) {
    const cur = updated.get(ing.itemId) ?? byId.get(ing.itemId);
    if (!cur) {
      shortfalls.push({ itemId: ing.itemId, missing: ing.qty });
      continue;
    }
    if (ing.qty > cur.qty) shortfalls.push({ itemId: cur.id, missing: ing.qty - cur.qty });
    updated.set(cur.id, { ...cur, qty: clampQty(cur.qty - ing.qty) });
  }
  const out = [...updated.values()];
  if (out.length) await repo.save(out);
  return { updated: out, shortfalls };
}

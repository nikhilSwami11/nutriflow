import type { PantryRepository, ShoppingListRepository } from "../pantry/ports";
import type { Amount } from "../pantry/types";
import { pantryUnitFor } from "./units";

interface Deps {
  pantry: PantryRepository;
  list: ShoppingListRepository;
}

/**
 * Bought: the amount goes into the pantry and the item leaves the list. Returns the amount bought.
 * shortcut: the pantry adds quantities only when the units mean the same thing (cups to cups); otherwise it just
 * makes sure the item is not low. Upgrade when the pantry learns grams.
 */
export async function markBought(deps: Deps, itemId: string): Promise<Amount> {
  const amount = (await deps.list.amounts())[itemId] ?? { qty: 1, unit: "pcs" };
  const item = (await deps.pantry.list()).find((i) => i.id === itemId);
  if (item) {
    const qty = pantryUnitFor(amount.unit) === item.unit && amount.unit === item.unit ? item.qty + amount.qty : Math.max(item.qty, item.lowAt + 1);
    await deps.pantry.save([{ ...item, qty }]);
  }
  await deps.list.remove([itemId]);
  return amount;
}

/** Changed your mind: the pantry quantity and the amount on the list both come back. */
export async function unmarkBought(deps: Deps, itemId: string, previousPantryQty: number, amount: Amount): Promise<void> {
  const item = (await deps.pantry.list()).find((i) => i.id === itemId);
  if (item) await deps.pantry.save([{ ...item, qty: previousPantryQty }]);
  await deps.list.add([itemId], { [itemId]: amount });
}

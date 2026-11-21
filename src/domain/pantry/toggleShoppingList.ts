import { getLowItems } from "./listPantry";
import type { PantryRepository, ShoppingListRepository } from "./ports";

/** The "Add to list" tile: put every running-low item on the list, or take them all off if all are already on. */
export async function toggleLowOnShoppingList(
  pantry: PantryRepository,
  list: ShoppingListRepository,
): Promise<{ listed: boolean }> {
  const lowIds = getLowItems(await pantry.list()).map((i) => i.id);
  const onList = new Set(await list.list());
  const allListed = lowIds.length > 0 && lowIds.every((id) => onList.has(id));
  if (allListed) {
    await list.remove(lowIds);
    return { listed: false };
  }
  await list.add(lowIds.filter((id) => !onList.has(id)));
  return { listed: lowIds.length > 0 };
}

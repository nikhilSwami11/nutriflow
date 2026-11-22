import { adviseNeeds } from "./adviseNeeds";
import type { BuyAdvisor, PantryRepository, ShoppingListRepository } from "./ports";
import type { Amount, Need, PantryItem } from "./types";

// Same plural fold as the voice add. shortcut: English only.
const norm = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

/**
 * Put things on the shopping list by name, with an amount when known ("what this meal is missing"). A name the pantry already knows
 * (even at 0) is reused; a new one becomes a 0 quantity pantry item, so the list never holds a stranger.
 * New items default to "Dry goods", "pcs", lowAt 1. With an advisor, new things get a buyable amount ("1 l" for "3 cups").
 * Returns how many were put on the list.
 */
export async function addNamesToShoppingList(
  deps: { pantry: PantryRepository; list: ShoppingListRepository; newId: () => string; advisor?: BuyAdvisor },
  needs: Need[],
): Promise<number> {
  const items = await deps.pantry.list();
  // What is already on the list keeps its amount, so only the new things are worth asking the advisor about.
  const onList = new Set(await deps.list.list());
  needs = await adviseNeeds(
    deps.advisor,
    needs.filter((n) => {
      const found = items.find((i) => norm(i.name) === norm(n.name));
      return !(found && onList.has(found.id));
    }),
  );
  const created: PantryItem[] = [];
  const amounts: Record<string, Amount> = {};
  for (const need of needs) {
    const found = [...items, ...created].find((i) => norm(i.name) === norm(need.name));
    let id = found?.id;
    if (!id) {
      const item: PantryItem = { id: deps.newId(), name: need.name.trim(), group: "Dry goods", qty: 0, unit: "pcs", lowAt: 1 };
      created.push(item);
      id = item.id;
    }
    amounts[id] ??= { qty: need.qty ?? 1, unit: need.unit ?? "pcs" };
  }
  if (created.length) await deps.pantry.save(created);
  await deps.list.add(Object.keys(amounts), amounts);
  return Object.keys(amounts).length;
}

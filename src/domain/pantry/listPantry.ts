import type { PantryFilter, PantryGroup, PantryItem } from "./types";

export const GROUP_ORDER: PantryGroup[] = ["Produce", "Dairy", "Dry goods"];

export const isLow = (i: PantryItem): boolean => i.qty <= i.lowAt;

export const getLowItems = (items: PantryItem[]): PantryItem[] => items.filter(isLow);

export interface PantryView {
  groups: { name: PantryGroup; items: PantryItem[] }[];
  total: number;
  lowCount: number;
}

/** Groups in design order, empty groups dropped. Counts ignore the filter, as in the design tabs. */
export function listPantry(items: PantryItem[], filter: PantryFilter = "all"): PantryView {
  const shown = filter === "low" ? getLowItems(items) : items;
  return {
    groups: GROUP_ORDER.map((name) => ({ name, items: shown.filter((i) => i.group === name) })).filter(
      (g) => g.items.length > 0,
    ),
    total: items.length,
    lowCount: getLowItems(items).length,
  };
}

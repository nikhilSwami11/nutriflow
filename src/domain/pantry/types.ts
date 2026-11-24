export type PantryGroup = "Produce" | "Dairy" | "Dry goods";
export type Unit = "pcs" | "cloves" | "packs" | "jar" | "cups";

export const SHOP_UNIT_IDS = ["pcs", "g", "kg", "ml", "l", "tbsp", "tsp", "cups", "packs", "cloves", "jar", "bunch"] as const;

/** What a shop sells by: wider than the pantry units. */
export type ShopUnit = (typeof SHOP_UNIT_IDS)[number];

/** How much of an item to buy. */
export interface Amount {
  qty: number;
  unit: ShopUnit;
}

/** What a shopping-list item counts as when no amount was set. */
export const DEFAULT_AMOUNT: Amount = { qty: 1, unit: "pcs" };

/** Something to put on the list by name, with an amount when the caller knows it. */
export interface Need {
  name: string;
  qty?: number;
  unit?: ShopUnit;
}

export interface PantryItem {
  id: string;
  name: string;
  group: PantryGroup;
  qty: number;
  unit: Unit;
  /** Item counts as "running low" when qty <= lowAt. */
  lowAt: number;
}

/** What the voice parser hears. Group and unit are optional hints. */
export interface ParsedItem {
  name: string;
  qty: number;
  unit?: Unit;
  group?: PantryGroup;
}

export interface RecipeIngredient {
  itemId: string;
  qty: number;
}

export type PantryFilter = "all" | "low";

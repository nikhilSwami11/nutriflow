export type PantryGroup = "Produce" | "Dairy" | "Dry goods";
export type Unit = "pcs" | "cloves" | "packs" | "jar" | "cups";

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

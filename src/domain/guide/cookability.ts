import type { PantryItem } from "../pantry/types";
import { ingredientStatus } from "../recipes/pantryMatch";
import type { Ingredient, Recipe } from "../recipes/types";
import { swapsFor } from "./guide";

// Same plural fold the pantry uses. shortcut: English only.
const norm = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

// Garnish and finishers: the dish works without them. shortcut: name rule, a recipe can override with `optional`.
const OPTIONAL = /coriander|cilantro|parsley|mint|basil|lemon|cinnamon|honey/i;
export const isOptional = (i: Ingredient): boolean => i.optional ?? OPTIONAL.test(i.name);

export interface Cookability {
  /** Missing, but you own a stand-in: use `use` instead. */
  swaps: { name: string; use: string }[];
  /** Missing, and the dish works without it. */
  skips: string[];
  /** Missing, with no stand-in at home: shop for these. */
  needed: Ingredient[];
  /** Nothing blocks cooking: every missing thing has a swap or can be skipped. */
  canCook: boolean;
}

/** The stand-in from the recipe's swaps that the pantry really has, or null. */
function standIn(recipe: Recipe, name: string, pantry: PantryItem[]): string | null {
  for (const s of swapsFor(recipe, name)) {
    const options = s.use.split(/ or |, /).map(norm);
    if (pantry.some((p) => p.qty > 0 && options.some((o) => o.includes(norm(p.name)) || norm(p.name).includes(o)))) return s.use;
  }
  return null;
}

/** Sorts what is missing into: swap (you own a stand-in), skip (optional), needed (shop for it). */
export function cookability(recipe: Recipe, pantry: PantryItem[]): Cookability {
  const out: Cookability = { swaps: [], skips: [], needed: [], canCook: true };
  for (const { ingredient, inPantry } of ingredientStatus(recipe, pantry)) {
    if (inPantry) continue;
    const use = standIn(recipe, ingredient.name, pantry);
    if (use) out.swaps.push({ name: ingredient.name, use });
    else if (isOptional(ingredient)) out.skips.push(ingredient.name);
    else out.needed.push(ingredient);
  }
  out.canCook = out.needed.length === 0;
  return out;
}

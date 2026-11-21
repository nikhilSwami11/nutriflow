import type { PantryItem } from "../pantry/types";
import type { Ingredient, Recipe } from "./types";

// Same plural fold the pantry uses ("onions" == "onion"). shortcut: English only.
const norm = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

export interface IngredientStatus {
  ingredient: Ingredient;
  inPantry: boolean;
}

/** An ingredient is in the pantry when an item with that name has quantity left. */
export function ingredientStatus(recipe: Recipe, pantry: PantryItem[]): IngredientStatus[] {
  return recipe.ingredients.map((ingredient) => ({
    ingredient,
    inPantry: pantry.some((p) => p.qty > 0 && norm(p.name) === norm(ingredient.name)),
  }));
}

export interface Readiness {
  have: number;
  of: number;
  missing: number;
}

export function readiness(recipe: Recipe, pantry: PantryItem[]): Readiness {
  const s = ingredientStatus(recipe, pantry);
  const have = s.filter((x) => x.inPantry).length;
  return { have, of: s.length, missing: s.length - have };
}

/** Scale an ingredient amount from the recipe's servings to the wanted servings, to the nearest quarter. */
export const scaleQty = (qty: number, from: number, to: number): number => Math.round(((qty * to) / from) * 4) / 4;

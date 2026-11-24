import { foodKey as norm } from "../pantry/foodKey";
import type { PantryItem, RecipeIngredient } from "../pantry/types";
import type { Recipe } from "../recipes/types";


/**
 * Recipe amounts come in cups, tablespoons and pieces; the pantry counts pieces, cloves, cups, packs and jars.
 * Only units that mean the same thing are subtracted. A tablespoon of ghee from a jar is left alone:
 * guessing how much of a jar that is would be wrong more often than right.
 */
const comparable = (ingredientUnit: string, pantryUnit: PantryItem["unit"]): boolean => {
  const u = ingredientUnit.trim().toLowerCase();
  if (u === "") return pantryUnit === "pcs";
  if (u === "cup" || u === "cups") return pantryUnit === "cups";
  if (u === "clove" || u === "cloves") return pantryUnit === "cloves";
  return false;
};

/** What this cook uses up from the pantry: matching name, matching unit, scaled to the servings made. */
export function ingredientsToDeplete(recipe: Recipe, servingsMade: number, pantry: PantryItem[]): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (const ing of recipe.ingredients) {
    const item = pantry.find((p) => norm(p.name) === norm(ing.name) && comparable(ing.unit, p.unit));
    if (!item) continue;
    const scaled = (ing.qty * servingsMade) / recipe.servings;
    // whole pieces can't be half used up in a pantry count
    const qty = item.unit === "pcs" || item.unit === "cloves" ? Math.ceil(scaled) : Math.round(scaled * 100) / 100;
    if (qty > 0) out.push({ itemId: item.id, qty });
  }
  return out;
}

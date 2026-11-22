import type { Need, PantryItem } from "../pantry/types";
import type { PlanDay } from "../planning/types";
import { ingredientStatus } from "../recipes/pantryMatch";
import type { MealName, Recipe } from "../recipes/types";
import { shopUnitFor } from "./units";

// Same plural fold as the pantry. shortcut: English only.
const norm = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

/**
 * What to buy for the next few planned days: every ingredient the pantry has none of, once each, with the
 * amount the recipes call for (summed when two recipes use the same unit; shortcut: otherwise the first one stands).
 * Today's meals already eaten are skipped (cooking used the pantry up, so they would look missing).
 */
export function neededForPlan(input: {
  plan: PlanDay[];
  recipes: Recipe[];
  pantry: PantryItem[];
  today: string;
  eatenToday: MealName[];
  days?: number;
}): Need[] {
  const byId = new Map(input.recipes.map((r) => [r.id, r]));
  const needs = new Map<string, Need>();
  for (const day of input.plan.filter((d) => d.date >= input.today).slice(0, input.days ?? 3)) {
    for (const m of day.meals) {
      if (day.date === input.today && input.eatenToday.includes(m.meal)) continue;
      const recipe = byId.get(m.recipeId);
      if (!recipe) continue;
      for (const s of ingredientStatus(recipe, input.pantry)) {
        if (s.inPantry) continue;
        const key = norm(s.ingredient.name);
        const unit = shopUnitFor(s.ingredient.unit);
        const have = needs.get(key);
        if (!have) needs.set(key, { name: s.ingredient.name, qty: s.ingredient.qty, unit });
        else if (have.unit === unit) have.qty = (have.qty ?? 0) + s.ingredient.qty;
      }
    }
  }
  return [...needs.values()];
}

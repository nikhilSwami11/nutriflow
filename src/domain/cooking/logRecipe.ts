import { logMeal } from "../nutrition/logMeal";
import type { MealLogRepository } from "../nutrition/ports";
import type { DateKey, MealLog, MealSlot } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import { nutritionEaten } from "./eaten";

/** Logs servings of a recipe someone ate, with the recipe's calories and macros. Used by Mark eaten and the chat. */
export async function logRecipeEaten(
  repo: MealLogRepository,
  input: { id: string; date: DateKey; slot: MealSlot; recipe: Recipe; servings?: number; source: MealLog["source"] },
): Promise<MealLog> {
  const servings = input.servings ?? 1;
  if (!(servings > 0)) throw new Error("servings must be more than 0");
  const { recipe: r } = input;
  return logMeal(repo, { id: input.id, date: input.date, slot: input.slot, source: input.source, name: r.name, recipeId: r.id, servings, ...nutritionEaten(r, r.servings, servings) });
}

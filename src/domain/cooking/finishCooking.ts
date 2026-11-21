import { depleteForRecipe, type Shortfall } from "../pantry/depleteForRecipe";
import type { PantryRepository } from "../pantry/ports";
import type { PantryItem } from "../pantry/types";
import { logMeal } from "../nutrition/logMeal";
import type { MealLogRepository } from "../nutrition/ports";
import type { DateKey, MealLog, MealSlot } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import { ingredientsToDeplete } from "./depletion";
import { nutritionEaten } from "./eaten";
import { updateHabit, type ServingHabit, type ServingHabitRepository } from "./habits";

export interface FinishDeps {
  pantry: PantryRepository;
  logs: MealLogRepository;
  habits: ServingHabitRepository;
  newId: () => string;
}

export interface FinishInput {
  recipe: Recipe;
  servingsMade: number;
  servingsEaten: number;
  date: DateKey;
}

export interface FinishResult {
  log: MealLog;
  depleted: PantryItem[];
  shortfalls: Shortfall[];
  habit: ServingHabit | null;
  /** Things that failed after the meal was safely logged. */
  warnings: string[];
}

const SLOT: Record<Recipe["meal"], MealSlot> = { Breakfast: "breakfast", Lunch: "lunch", Snack: "snack", Dinner: "dinner" };

/**
 * End of a cook session. The meal is logged first and on its own: it is the thing that must never be lost.
 * Pantry depletion and the serving-size habit come after; if either fails the meal is still logged and a warning says why.
 */
export async function finishCooking(deps: FinishDeps, { recipe, servingsMade, servingsEaten, date }: FinishInput): Promise<FinishResult> {
  if (!(servingsMade > 0)) throw new Error("servings made must be more than 0");
  if (!(servingsEaten > 0) || servingsEaten > servingsMade) throw new Error("servings eaten must be more than 0 and at most the servings made");

  const n = nutritionEaten(recipe, servingsMade, servingsEaten);
  const log = await logMeal(deps.logs, {
    id: deps.newId(), date, slot: SLOT[recipe.meal], source: "cook", name: recipe.name,
    kcal: n.kcal, recipeId: recipe.id, servings: servingsEaten, protein: n.protein, carbs: n.carbs, fat: n.fat,
  });

  const warnings: string[] = [];
  let depleted: PantryItem[] = [];
  let shortfalls: Shortfall[] = [];
  try {
    const use = ingredientsToDeplete(recipe, servingsMade, await deps.pantry.list());
    if (use.length) ({ updated: depleted, shortfalls } = await depleteForRecipe(deps.pantry, use));
  } catch {
    warnings.push("The pantry could not be updated");
  }

  let habit: ServingHabit | null = null;
  try {
    habit = updateHabit(await deps.habits.get(recipe.id), recipe.id, servingsEaten);
    await deps.habits.save(habit);
  } catch {
    habit = null;
    warnings.push("Your serving size could not be saved");
  }
  return { log, depleted, shortfalls, habit, warnings };
}

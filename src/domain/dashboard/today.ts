import type { DateKey } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import type { DayNutrition } from "./types";

/** Today's totals from the meals actually eaten (one serving each). */
export function dayFromRecipes(date: DateKey, planned: number, eaten: Recipe[]): DayNutrition {
  const sum = (f: (r: Recipe) => number) => eaten.reduce((s, r) => s + f(r), 0);
  return {
    date,
    planned,
    eaten: sum((r) => r.kcal),
    macros: { protein: sum((r) => r.protein), carbs: sum((r) => r.carbs), fat: sum((r) => r.fat) },
  };
}

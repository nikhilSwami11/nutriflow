import type { DateKey } from "../nutrition/types";
import type { Recipe } from "../recipes/types";
import type { DayNutrition } from "./types";

export interface EatenMeal {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** Today's totals from the meals actually eaten. */
export function dayFromMeals(date: DateKey, planned: number, eaten: EatenMeal[]): DayNutrition & { eaten: number } {
  const sum = (f: (m: EatenMeal) => number) => Math.round(eaten.reduce((s, m) => s + f(m), 0) * 10) / 10;
  return { date, planned, eaten: sum((m) => m.kcal), macros: { protein: sum((m) => m.protein), carbs: sum((m) => m.carbs), fat: sum((m) => m.fat) } };
}

/** The same, for meals taken as one serving of a recipe. */
export const dayFromRecipes = (date: DateKey, planned: number, eaten: Recipe[]) => dayFromMeals(date, planned, eaten);

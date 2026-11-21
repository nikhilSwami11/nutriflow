import type { Recipe } from "../recipes/types";

export interface Eaten {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Everything the recipe makes, per its per-serving numbers. */
export const recipeTotalKcal = (r: Recipe, servingsMade: number): number => r.kcal * servingsMade;

/** Calories from what was cooked, divided by the servings made, times the servings eaten. */
export const kcalEaten = (totalKcal: number, servingsMade: number, servingsEaten: number): number =>
  Math.round((totalKcal / servingsMade) * servingsEaten);

export function nutritionEaten(r: Recipe, servingsMade: number, servingsEaten: number): Eaten {
  return {
    kcal: kcalEaten(recipeTotalKcal(r, servingsMade), servingsMade, servingsEaten),
    protein: round1(r.protein * servingsEaten),
    carbs: round1(r.carbs * servingsEaten),
    fat: round1(r.fat * servingsEaten),
  };
}

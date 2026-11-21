import type { DateKey } from "../nutrition/types";
import type { MealName } from "../recipes/types";

export type Focus = "balanced" | "protein";

export interface PlannedMeal {
  meal: MealName;
  recipeId: string;
}

export interface PlanDay {
  date: DateKey;
  meals: PlannedMeal[];
}

export interface DayGoals {
  calories: number;
  protein: number;
}

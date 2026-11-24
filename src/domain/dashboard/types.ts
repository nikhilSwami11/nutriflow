import type { DateKey } from "../nutrition/types";
import type { MealName } from "../recipes/types";

/** Grams. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayNutrition {
  date: DateKey;
  planned: number;
  /** null when nothing was logged that day: a gap in charts, never zero. */
  eaten: number | null;
  macros: Macros;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DashboardData {
  goals: Goals;
  /** Oldest first. The last entry is today's placeholder: the view-model replaces it with what was actually eaten. */
  days: DayNutrition[];
  /** Meals already eaten today. */
  eatenToday: MealName[];
  /** How many times each recipe was eaten before. Feeds the planner. */
  history: Record<string, number>;
}

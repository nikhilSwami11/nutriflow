import type { DateKey, MealSlot } from "../nutrition/types";

/** Grams. */
export interface Macros {
  protein: number;
  carbs: number;
  fat: number;
}

export interface DayNutrition {
  date: DateKey;
  planned: number;
  eaten: number;
  macros: Macros;
}

export type MealName = "Breakfast" | "Lunch" | "Snack" | "Dinner";

export interface PlannedMeal {
  name: MealName;
  slot: MealSlot;
  planned: number;
  eaten: number;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Tonight {
  title: string;
  tags: string[];
  blurb: string;
  kcal: number;
  macros: Macros;
}

export interface Suggestion {
  id: string;
  title: string;
  body: string;
  cta: string;
}

export interface DashboardData {
  goals: Goals;
  /** Oldest first, the last entry is today. */
  days: DayNutrition[];
  meals: PlannedMeal[];
  tonight: Tonight;
  suggestions: Suggestion[];
}

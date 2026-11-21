export type MealName = "Breakfast" | "Lunch" | "Snack" | "Dinner";
export const MEALS: MealName[] = ["Breakfast", "Lunch", "Snack", "Dinner"];

export interface Ingredient {
  /** Matched against pantry item names. */
  name: string;
  qty: number;
  unit: string;
}

export interface Step {
  text: string;
  verb: string;
  /** Timed steps (simmering, boiling). The cook screen shows a countdown. */
  minutes?: number;
}

/** Nutrition is per serving. */
export interface Recipe {
  id: string;
  name: string;
  blurb: string;
  minutes: number;
  servings: number;
  meal: MealName;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  tint: string;
  ingredients: Ingredient[];
  steps: Step[];
}

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
  /** What to look for to know the step is right. Falls back to a line for the verb. */
  look?: string;
  /** One useful tip. Falls back to a line for the verb. */
  tip?: string;
}

export interface Swap {
  ingredient: string;
  use: string;
  note?: string;
}

export interface Fix {
  /** A word or two the cook might say: "salty", "too thick". */
  problem: string;
  fix: string;
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
  /** Things to set out before starting. Derived from the ingredients when missing. */
  prep?: string[];
  swaps?: Swap[];
  fixes?: Fix[];
}

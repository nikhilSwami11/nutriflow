export type MealName = "Breakfast" | "Lunch" | "Snack" | "Dinner";
export const MEALS: MealName[] = ["Breakfast", "Lunch", "Snack", "Dinner"];

export interface Ingredient {
  /** Matched against pantry item names. */
  name: string;
  qty: number;
  unit: string;
  /** Garnish or a finisher: the dish works without it. Guessed from the name when missing. */
  optional?: boolean;
  /** What state the amount is measured in: it changes the weight (a cup of dry chickpeas is not a cup of soaked ones). */
  form?: IngredientForm;
}

export type IngredientForm = "dry" | "soaked" | "cooked" | "canned";

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
  /** A cut-out picture of the dish (transparent webp) that sits on `tint`. Without one, the drawn bowl shows. */
  image?: string;
  ingredients: Ingredient[];
  steps: Step[];
  /** Things to set out before starting. Derived from the ingredients when missing. */
  prep?: string[];
  swaps?: Swap[];
  fixes?: Fix[];
  /** Written by the AI for this person: nutrition is an estimate, and it is not part of the weekly planner. */
  written?: boolean;
}

/** The verbs the cook screen animates and the guide has lines for. A written recipe uses only these. */
export const COOK_VERBS = ["Chop", "Slice", "Grate", "Mix", "Whisk", "Stir", "Toss", "Mash", "Knead", "Roll", "Boil", "Simmer", "Fry", "Sauté", "Sear", "Roast", "Bake", "Toast", "Blend", "Chill", "Assemble", "Top", "Serve"] as const;

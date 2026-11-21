/** Calendar day as YYYY-MM-DD in the user's local time. */
export type DateKey = string;
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface TargetRange {
  min: number;
  max: number;
}

export interface Profile {
  range: TargetRange;
}

/** Only real logged intake: a cook session or a photo estimate. Never a guessed "usual day". */
export interface MealLog {
  id: string;
  date: DateKey;
  slot: MealSlot;
  source: "cook" | "photo";
  name: string;
  kcal: number;
  /** Set when the meal came from a recipe, so the day's macros and the serving-size learner have what they need. */
  recipeId?: string;
  servings?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export type IntakeStatus = "below" | "in" | "above";

/** One chart point. kcal is null for an unlogged day: a gap, never zero. */
export interface DayPoint {
  date: DateKey;
  kcal: number | null;
  status: IntakeStatus | null;
}

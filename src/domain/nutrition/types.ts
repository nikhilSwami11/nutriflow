/** Calendar day as YYYY-MM-DD in the user's local time. */
export type DateKey = string;
export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface TargetRange {
  min: number;
  max: number;
}

export type Diet = "anything" | "vegetarian" | "eggetarian" | "vegan";
export const DIETS: Diet[] = ["anything", "vegetarian", "eggetarian", "vegan"];

export interface Profile {
  range: TargetRange;
  /** Missing in profiles saved before preferences existed: read as "anything". */
  diet?: Diet;
  /** Foods to keep out of suggestions, one word or two each. */
  dislikes?: string[];
  /** Allergens are skipped like dislikes, and never suggested. */
  allergens?: string[];
  /** Asked once in onboarding; only used to suggest a calorie range. */
  /** What the person cooks with (ids from domain/kitchen). Missing = not asked, so nothing is ruled out. */
  appliances?: string[];
  heightCm?: number;
  weightKg?: number;
}

/** Only real logged intake: a cook session, a photo estimate, or what the person told an assistant they ate. Never a guessed "usual day". */
export interface MealLog {
  id: string;
  date: DateKey;
  slot: MealSlot;
  // chat: told to an assistant (ChatGPT, Claude) through the MCP connector.
  source: "cook" | "photo" | "chat";
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

/** One thing the detector found on the plate. Nutrition is per unit of `unit`. */
export interface DetectedItem {
  id: string;
  name: string;
  /** 0 to 100. */
  confidence: number;
  amount: number;
  /** How much one tap on + or - changes the amount. */
  step: number;
  unit: string;
  kcalPer: number;
  protein: number;
  carbs: number;
  fat: number;
  color: string;
  /** Where it sits in the photo, as fractions of its width and height. */
  box: { x: number; y: number; w: number; h: number };
  /** What to look for in the pantry to say "matched with your pantry". */
  pantryName: string;
  /** Why the detector thinks it is here, in plain words. */
  reason: string;
}

export interface Detection {
  items: DetectedItem[];
  dish: string;
  /** The recipe this looks like, so the usual serving size can be looked up. */
  recipeId?: string;
  confidence: number;
  /** "vision" once a real model reads the photo. "context" and "demo" are guesses and must be shown as such. */
  source: "vision" | "context" | "demo";
}

export interface MealDetector {
  detect(image: Blob | null): Promise<Detection>;
}

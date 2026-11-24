import { foodKey as norm } from "../pantry/foodKey";
import type { PantryItem } from "../pantry/types";
import type { Diet } from "../nutrition/types";
import { readiness } from "../recipes/pantryMatch";
import type { MealName, Recipe } from "../recipes/types";
import { dietAllows } from "./diet";

export type Want = "quick" | "light" | "protein" | "pantry";

/** What someone typed or said ("something quick and light") as a few wishes. Several can apply. */
export function parseWants(text: string): Want[] {
  const t = text.toLowerCase();
  const wants: Want[] = [];
  if (/\b(quick|fast|hurry|hurried|short on time|in a rush|no time)\b|\b(10|15|20) ?min/.test(t)) wants.push("quick");
  if (/\b(light|small|snack|little|not (too )?heavy)\b/.test(t)) wants.push("light");
  if (/\b(protein|gym|workout|muscle)\b/.test(t)) wants.push("protein");
  if (/\b(have|pantry|fridge|home|already)\b/.test(t)) wants.push("pantry");
  return wants;
}

export interface Suggestion {
  recipe: Recipe;
  /** Short plain reasons, best first: "Ready to cook", "20 min". */
  reasons: string[];
  ready: boolean;
  score: number;
}

/** Drops what the diet or a disliked food rules out. */
export function fitsPrefs(recipes: Recipe[], diet?: Diet, dislikes: string[] = []): Recipe[] {
  const no = dislikes.map(norm).filter(Boolean);
  const hated = (r: Recipe) => r.ingredients.some((i) => no.some((d) => norm(i.name).includes(d) || d.includes(norm(i.name))));
  return recipes.filter((r) => dietAllows(diet, r) && !hated(r));
}

/** The meal most likely wanted at this hour. */
export function mealForHour(hour: number): MealName {
  if (hour < 11) return "Breakfast";
  if (hour < 15) return "Lunch";
  if (hour < 18) return "Snack";
  return "Dinner";
}

/**
 * What to eat now. Drops what the diet or a dislike rules out, then ranks by: what the pantry already has, whether it
 * fits the calories left today, the time of day, and any wishes. Returns the best three with reasons.
 * Rules only, so the same answer comes back every time.
 */
export function suggestMeals(input: {
  recipes: Recipe[];
  pantry: PantryItem[];
  diet?: Diet;
  dislikes?: string[];
  /** Calories left in today's range; omit when unknown. */
  kcalLeft?: number;
  hour: number;
  wants?: Want[];
  /** Extra score by recipe id, e.g. from a search by meaning of what was typed. */
  boost?: Record<string, number>;
  limit?: number;
}): Suggestion[] {
  const wants = input.wants ?? [];
  const meal = mealForHour(input.hour);

  return fitsPrefs(input.recipes, input.diet, input.dislikes)
    .map<Suggestion>((r) => {
      const rd = readiness(r, input.pantry);
      const ready = rd.missing === 0;
      let score = (rd.have / Math.max(1, rd.of)) * 4;
      const reasons: string[] = [ready ? "Ready to cook" : `Missing ${rd.missing}`];
      if (r.meal === meal) {
        score += 2;
        reasons.push(`Good for ${meal.toLowerCase()}`);
      }
      if (input.kcalLeft !== undefined) {
        if (r.kcal <= input.kcalLeft) {
          score += 1.5;
          reasons.push(`${r.kcal} kcal fits what is left today`);
        } else {
          score -= 2;
          reasons.push(`${r.kcal} kcal is more than is left today`);
        }
      }
      if (wants.includes("quick")) score += r.minutes <= 20 ? 3 : -2;
      if (wants.includes("light")) score += r.kcal <= 400 ? 3 : -2;
      if (wants.includes("protein")) score += r.protein / 10;
      if (wants.includes("pantry")) score += ready ? 3 : 0;
      const b = input.boost?.[r.id] ?? 0;
      if (b > 0) {
        score += b;
        reasons.unshift("Matches your words");
      }
      if (r.minutes <= 20) reasons.push(`${r.minutes} min`);
      if (wants.includes("protein") && r.protein >= 20) reasons.push(`${r.protein} g protein`);
      return { recipe: r, reasons, ready, score };
    })
    .sort((a, b) => b.score - a.score || a.recipe.minutes - b.recipe.minutes || a.recipe.id.localeCompare(b.recipe.id))
    .slice(0, input.limit ?? 3);
}

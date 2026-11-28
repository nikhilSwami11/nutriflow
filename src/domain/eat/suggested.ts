import { cookability } from "../guide/cookability";
import { activeLeftovers, type Leftover } from "../leftovers";
import type { DateKey, Diet } from "../nutrition/types";
import type { PantryItem } from "../pantry/types";
import type { Recipe } from "../recipes/types";
import { fitsPrefs, suggestMeals, type Want } from "./suggest";

/** Why a recipe is on the Suggested page: food already cooked, a job already done, or nothing to do. */
export type Badge = "leftover" | "prepped" | "instant" | null;

export interface Pick {
  recipe: Recipe;
  badge: Badge;
  /** One short plain line: "2 portions left", "Prepped, ready to cook". */
  note: string;
  leftoverId?: string;
}

/** Ten minutes or less is "instant". */
export const INSTANT_MINUTES = 10;

const portions = (n: number) => `${n} ${n === 1 ? "portion" : "portions"}`;

/**
 * The Suggested page: leftovers first (already cooked), then dishes whose prep is done, then instant ones you can
 * make now, then the best of the rest. Each recipe appears once, with the first reason that fits. Rules only.
 */
export function suggested(input: {
  recipes: Recipe[];
  pantry: PantryItem[];
  leftovers: Leftover[];
  /** Recipe ids whose prep job is ticked done (today or for tomorrow). */
  prepped: string[];
  today: DateKey;
  hour: number;
  diet?: Diet;
  dislikes?: string[];
  kcalLeft?: number;
  wants?: Want[];
  limit?: number;
}): Pick[] {
  const allowed = new Map(fitsPrefs(input.recipes, input.diet, input.dislikes).map((r) => [r.id, r]));
  const out: Pick[] = [];
  const seen = new Set<string>();
  const add = (p: Pick) => {
    if (seen.has(p.recipe.id)) return;
    seen.add(p.recipe.id);
    out.push(p);
  };

  for (const l of activeLeftovers(input.leftovers, input.today)) {
    const recipe = allowed.get(l.recipeId);
    if (recipe) add({ recipe, badge: "leftover", note: `${portions(l.portions)} left`, leftoverId: l.id });
  }
  for (const id of input.prepped) {
    const recipe = allowed.get(id);
    if (recipe) add({ recipe, badge: "prepped", note: "Prepped, ready to cook" });
  }
  const canMake = (r: Recipe) => {
    const c = cookability(r, input.pantry);
    return c.canCook || c.state === "check";
  };
  for (const r of allowed.values()) {
    if (r.minutes <= INSTANT_MINUTES && canMake(r)) add({ recipe: r, badge: "instant", note: `${r.minutes} min, no waiting` });
  }
  const rest = suggestMeals({ recipes: [...allowed.values()], pantry: input.pantry, diet: input.diet, dislikes: input.dislikes, kcalLeft: input.kcalLeft, hour: input.hour, wants: input.wants, limit: 12 });
  for (const s of rest) add({ recipe: s.recipe, badge: null, note: s.reasons[0] ?? "" });
  return out.slice(0, input.limit ?? 10);
}

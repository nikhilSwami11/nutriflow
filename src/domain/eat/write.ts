import { foodKey as norm } from "../pantry/foodKey";
import type { Diet } from "../nutrition/types";
import type { PantryItem } from "../pantry/types";
import type { MyRecipeRepository } from "../recipes/mine";
import { COOK_VERBS, type MealName, type Recipe } from "../recipes/types";
import { dietAllows } from "./diet";
import { mealForHour, suggestMeals, type Want } from "./suggest";

/** What the writer knows about the person when it writes one meal. */
export interface WriteInput {
  meal: MealName;
  /** Calories per serving to aim for. */
  kcalTarget: number;
  diet?: Diet;
  dislikes: string[];
  /** Names of what the pantry has (quantity above 0). */
  pantry: string[];
  wants: Want[];
  /** A one-line idea to write out in full ("Paneer tikka wrap"). */
  idea?: string;
}

/** A recipe as the writer returns it, before it is checked. Nutrition is per serving. */
export interface DraftRecipe {
  name: string;
  blurb: string;
  minutes: number;
  servings: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: { name: string; qty: number; unit: string }[];
  steps: { text: string; verb: string; minutes?: number; look?: string; tip?: string }[];
}

/** A one-line meal idea. From the rules it points at a recipe; from the writer it is written out when tapped. */
export interface Idea {
  name: string;
  blurb: string;
  recipeId?: string;
}

/** Writes a meal (the AI, behind an edge function). */
export interface RecipeWriter {
  write(input: WriteInput): Promise<{ recipe: DraftRecipe; ideas: Idea[] }>;
}

export interface Meal {
  best: Recipe;
  ideas: Idea[];
  /** "ai": written now for this person. "rules": the writer was missing, slow or wrong, so a built-in recipe. */
  source: "ai" | "rules";
}

const MEAL_TINT: Record<MealName, string> = { Breakfast: "#F4E3A1", Lunch: "#BFE5D2", Snack: "#F7C9BB", Dinner: "#CFC8F0" };
/** A day's calories split by meal, for a per-serving target when nothing is logged yet. */
const MEAL_SHARE: Record<MealName, number> = { Breakfast: 0.25, Lunch: 0.35, Snack: 0.1, Dinner: 0.3 };
const fin = (n: unknown, lo: number, hi: number) => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;

/** Calories per serving to aim for: the meal's share of the day, never more than what is left. */
export function kcalTargetFor(meal: MealName, dayMax: number, kcalLeft?: number): number {
  const share = Math.round(dayMax * MEAL_SHARE[meal]);
  return Math.max(150, kcalLeft === undefined ? share : Math.min(share, kcalLeft));
}

/**
 * Checks a written recipe and turns it into a real one: sane numbers, at least two ingredients and steps, only the cook
 * screen's verbs (an unknown verb becomes Stir), and nothing the diet or a dislike rules out. Null when it does not pass.
 * A dish that is also built in borrows its picture.
 */
export function toRecipe(d: DraftRecipe, id: string, meal: MealName, input: Pick<WriteInput, "diet" | "dislikes">, builtins: Recipe[]): Recipe | null {
  const name = d?.name?.trim();
  if (!name || name.length > 80) return null;
  if (!fin(d.kcal, 30, 2500) || !fin(d.protein, 0, 300) || !fin(d.carbs, 0, 500) || !fin(d.fat, 0, 300)) return null;
  if (!fin(d.minutes, 1, 360) || !fin(d.servings, 1, 12)) return null;
  const ingredients = (d.ingredients ?? []).filter((i) => i?.name?.trim() && fin(i.qty, 0, 10000)).map((i) => ({ name: i.name.trim(), qty: i.qty, unit: (i.unit ?? "").trim() || "pcs" }));
  const steps = (d.steps ?? []).filter((s) => s?.text?.trim()).map((s) => {
    const verb = COOK_VERBS.find((v) => norm(v) === norm(s.verb ?? "") || (v === "Sauté" && norm(s.verb ?? "") === "saute")) ?? "Stir";
    const note = (v: unknown) => (typeof v === "string" && v.trim() && v.length <= 240 ? v.trim() : undefined);
    return { text: s.text.trim(), verb, ...(fin(s.minutes, 1, 240) ? { minutes: Math.round(s.minutes!) } : {}), ...(note(s.look) ? { look: note(s.look) } : {}), ...(note(s.tip) ? { tip: note(s.tip) } : {}) };
  });
  if (ingredients.length < 2 || steps.length < 2) return null;

  const twin = builtins.find((b) => norm(b.name) === norm(name));
  const recipe: Recipe = {
    id, name, blurb: (d.blurb ?? "").trim(), minutes: Math.round(d.minutes), servings: Math.round(d.servings), meal,
    kcal: Math.round(d.kcal), protein: Math.round(d.protein), carbs: Math.round(d.carbs), fat: Math.round(d.fat),
    tint: twin?.tint ?? MEAL_TINT[meal], image: twin?.image, ingredients, steps, written: true,
  };
  const dislikes = input.dislikes.map(norm).filter(Boolean);
  const hated = recipe.ingredients.some((i) => dislikes.some((x) => norm(i.name).includes(x) || x.includes(norm(i.name))));
  return hated || !dietAllows(input.diet, recipe) ? null : recipe;
}

export interface WhatToEatDeps {
  writer?: RecipeWriter;
  mine: MyRecipeRepository;
  newId: () => string;
  /** The writer never holds the screen longer than this. */
  timeoutMs?: number;
}

export interface WhatToEatInput {
  /** Built-in recipes: the fallback, and pictures for written dishes that match one. */
  builtins: Recipe[];
  pantry: PantryItem[];
  diet?: Diet;
  dislikes?: string[];
  dayMax: number;
  kcalLeft?: number;
  hour: number;
  wants: Want[];
  idea?: string;
}

/**
 * One meal written for this person now, plus two one-line ideas. The written recipe is kept (not saved) so the cook and
 * recipe screens can open it. If the writer is missing, slow, failing or writes something that does not pass the
 * checks, the rules pick from the built-in recipes instead, so the screen always gets an answer.
 */
export async function whatToEat(deps: WhatToEatDeps, input: WhatToEatInput): Promise<Meal> {
  const meal = mealForHour(input.hour);
  const dislikes = input.dislikes ?? [];
  const rules = (): Meal => {
    const picks = suggestMeals({
      recipes: input.builtins, pantry: input.pantry, diet: input.diet, dislikes, kcalLeft: input.kcalLeft, hour: input.hour, wants: input.wants,
    });
    if (!picks.length) throw new Error("Nothing fits your diet and dislikes.");
    return { best: picks[0].recipe, ideas: picks.slice(1, 3).map((p) => ({ name: p.recipe.name, blurb: p.recipe.blurb, recipeId: p.recipe.id })), source: "rules" };
  };
  if (!deps.writer) return rules();

  const ask: WriteInput = {
    meal, kcalTarget: kcalTargetFor(meal, input.dayMax, input.kcalLeft), diet: input.diet, dislikes,
    pantry: input.pantry.filter((p) => p.qty > 0).map((p) => p.name), wants: input.wants, idea: input.idea,
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const out = await Promise.race([
      deps.writer.write(ask),
      new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error("writer timed out")), deps.timeoutMs ?? 15000))),
    ]);
    const best = toRecipe(out.recipe, `ai-${deps.newId()}`, meal, ask, input.builtins);
    if (!best) return rules();
    await deps.mine.put(best, false);
    const ideas = (out.ideas ?? []).filter((i) => i?.name?.trim()).slice(0, 2).map((i) => ({ name: i.name.trim(), blurb: (i.blurb ?? "").trim() }));
    return { best, ideas, source: "ai" };
  } catch {
    return rules();
  } finally {
    clearTimeout(timer);
  }
}

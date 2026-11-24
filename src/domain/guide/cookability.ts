import { foodKey as norm } from "../pantry/foodKey";
import type { PantryItem } from "../pantry/types";
import { ingredientStatus } from "../recipes/pantryMatch";
import type { Ingredient, Recipe } from "../recipes/types";
import { swapsFor } from "./guide";


// Garnish and finishers: the dish works without them. shortcut: name rule, a recipe can override with `optional`.
const OPTIONAL = /coriander|cilantro|parsley|mint|basil|lemon|cinnamon|honey/i;
export const isOptional = (i: Ingredient): boolean => i.optional ?? OPTIONAL.test(i.name);

// Kitchen basics: nobody tracks them, so a missing one is assumed to be at home unless the pantry says it ran out.
const STAPLE = /^(salt|black pepper|pepper|oil|olive oil|vegetable oil|cooking oil|water|sugar|cumin|cumin seeds|turmeric|red chilli|chilli powder|chili powder|garam masala|coriander powder|mustard seeds|paprika|oregano|baking powder|baking soda)$/i;
export const isStaple = (i: Ingredient): boolean => STAPLE.test(i.name.trim());

/** With fewer things than this at home, the pantry is not really set up: an ingredient it lacks is unknown, not missing. */
export const PANTRY_SET_UP = 5;

export interface Cookability {
  /** Missing, but you own a stand-in: use `use` instead. */
  swaps: { name: string; use: string }[];
  /** Missing, and the dish works without it. */
  skips: string[];
  /** Missing, with no stand-in at home: shop for these. */
  needed: Ingredient[];
  /** Nothing blocks cooking: every missing thing has a swap or can be skipped. */
  canCook: boolean;
  /** The pantry is empty or barely set up, so these main ingredients are unknown: ask, do not claim they are missing. */
  unknown: Ingredient[];
  /** Kitchen basics (salt, oil, spices) not in the pantry: assumed at home. */
  assumed: string[];
  /** ready: cook. check: ask what they have first. missing: shop for `needed`. */
  state: "ready" | "check" | "missing";
}

/** The stand-in from the recipe's swaps that the pantry really has, or null. */
function standIn(recipe: Recipe, name: string, pantry: PantryItem[]): string | null {
  for (const s of swapsFor(recipe, name)) {
    const options = s.use.split(/ or |, /).map(norm);
    if (pantry.some((p) => p.qty > 0 && options.some((o) => o.includes(norm(p.name)) || norm(p.name).includes(o)))) return s.use;
  }
  return null;
}

/** Sorts what is missing into: swap (you own a stand-in), skip (optional), needed (shop for it). */
export function cookability(recipe: Recipe, pantry: PantryItem[]): Cookability {
  const out: Cookability = { swaps: [], skips: [], needed: [], canCook: true, unknown: [], assumed: [], state: "ready" };
  const setUp = pantry.filter((p) => p.qty > 0).length >= PANTRY_SET_UP;
  for (const { ingredient, inPantry } of ingredientStatus(recipe, pantry)) {
    if (inPantry) continue;
    // Known out: the pantry has a record of it at 0 (it ran out, or the person said they do not have it).
    const knownOut = pantry.some((p) => norm(p.name) === norm(ingredient.name));
    const use = standIn(recipe, ingredient.name, pantry);
    if (use) out.swaps.push({ name: ingredient.name, use });
    else if (isOptional(ingredient)) out.skips.push(ingredient.name);
    else if (isStaple(ingredient) && !knownOut) out.assumed.push(ingredient.name);
    else if (knownOut || setUp) out.needed.push(ingredient);
    else out.unknown.push(ingredient);
  }
  out.state = out.needed.length ? "missing" : out.unknown.length ? "check" : "ready";
  out.canCook = out.state === "ready";
  return out;
}

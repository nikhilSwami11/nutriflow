import type { MyRecipeRepository } from "../recipes/mine";
import type { Recipe } from "../recipes/types";
import type { Diet } from "../nutrition/types";
import { toRecipe, type DraftRecipe } from "./write";

/** Rewrites a recipe by an instruction ("no onion", "for 4", "spicier"). The AI, behind an edge function. */
export interface RecipeAdapter {
  adapt(input: { recipe: DraftRecipe; instruction: string; diet?: Diet; dislikes: string[] }): Promise<DraftRecipe>;
}

/** A recipe as the writer's format, for editing or sending to the adapter. */
export const toDraft = (r: Recipe): DraftRecipe => ({
  name: r.name, blurb: r.blurb, minutes: r.minutes, servings: r.servings, kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat,
  ingredients: r.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, ...(i.group ? { group: i.group } : {}) })),
  steps: r.steps.map((s) => ({ text: s.text, verb: s.verb, ...(s.minutes ? { minutes: s.minutes } : {}), ...(s.look ? { look: s.look } : {}), ...(s.tip ? { tip: s.tip } : {}), ...(s.group ? { group: s.group } : {}) })),
  ...(r.swaps ? { swaps: r.swaps } : {}),
  ...(r.fixes ? { fixes: r.fixes } : {}),
  ...(r.prep ? { prep: r.prep } : {}),
});

/** Checked draft -> recipe that keeps the original's picture and the parts the draft left out (swaps, fixes, prep). */
function build(draft: DraftRecipe, id: string, original: Recipe, prefs: { diet?: Diet; dislikes: string[] }): Recipe | null {
  const r = toRecipe({ ...draft, swaps: draft.swaps ?? original.swaps, fixes: draft.fixes ?? original.fixes, prep: draft.prep ?? original.prep }, id, original.meal, prefs, []);
  if (!r) return null;
  return { ...r, tint: original.tint, ...(original.image ? { image: original.image } : {}) };
}

export interface EditDeps { mine: MyRecipeRepository; newId: () => string }

/**
 * The person edited a recipe by hand. Their own recipe is changed in place; a built-in one is never touched: it is kept as
 * their own copy. Either way it lands in Recipes. Null when the edit is not a recipe (a name, 2+ ingredients and steps).
 */
export async function saveEdited(deps: EditDeps, original: Recipe, draft: DraftRecipe, isMine: boolean): Promise<Recipe | null> {
  const recipe = build(draft, isMine ? original.id : `ai-${deps.newId()}`, original, { dislikes: [] });
  if (!recipe) return null;
  await deps.mine.put(recipe, true);
  return recipe;
}

/**
 * Ask AI to change a recipe. The result is a new unsaved version (the original stays as it is) that the person looks at and
 * keeps or drops. Throws a readable error when the AI is missing, slow, or writes something that is not a fitting recipe.
 */
export async function askAiToChange(
  deps: EditDeps & { adapter?: RecipeAdapter; timeoutMs?: number },
  original: Recipe,
  instruction: string,
  prefs: { diet?: Diet; dislikes: string[] },
): Promise<Recipe> {
  const text = instruction.trim().slice(0, 200);
  if (!text) throw new Error("Say what to change.");
  if (!deps.adapter) throw new Error("Ask AI needs an internet connection and an account.");
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const draft = await Promise.race([
      deps.adapter.adapt({ recipe: toDraft(original), instruction: text, diet: prefs.diet, dislikes: prefs.dislikes }),
      new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error("slow")), deps.timeoutMs ?? 25000))),
    ]);
    const recipe = build(draft, `ai-${deps.newId()}`, original, prefs);
    if (!recipe) throw new Error("bad");
    await deps.mine.put(recipe, false);
    return recipe;
  } catch (e) {
    throw new Error(e instanceof Error && e.message === "slow" ? "That took too long. Try again." : "Could not change it that way. Try saying it differently.");
  } finally {
    clearTimeout(timer);
  }
}

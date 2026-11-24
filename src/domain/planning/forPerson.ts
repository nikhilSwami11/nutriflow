import { fitsPrefs } from "../eat/suggest";
import type { Profile } from "../nutrition/types";
import type { Recipe } from "../recipes/types";

/**
 * What the week may be planned from: the tested built-ins (written-for-you recipes are not planned) that fit the
 * diet and dislikes. A diet so strict that nothing is left falls back to every built-in rather than an empty week.
 */
export function plannableRecipes(recipes: Recipe[], profile: Profile | null | undefined): Recipe[] {
  const builtins = recipes.filter((r) => !r.written);
  const liked = fitsPrefs(builtins, profile?.diet, profile?.dislikes);
  return liked.length ? liked : builtins;
}

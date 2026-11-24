import type { Recipe } from "./types";

/** A recipe that belongs to this person: written for them, or saved by them (Save, or cooking it). */
export interface MyRecipe {
  recipe: Recipe;
  /** Shown in the Recipes tab. A written recipe nobody saved stays reachable by id, but is not listed. */
  saved: boolean;
}

export interface MyRecipeRepository {
  list(): Promise<MyRecipe[]>;
  /** Insert or update by recipe id. */
  put(recipe: Recipe, saved: boolean): Promise<void>;
}

/** Only what the person kept, newest first as the repository returns them. */
export const savedOnly = (mine: MyRecipe[]): Recipe[] => mine.filter((m) => m.saved).map((m) => m.recipe);

/** Save or unsave. A built-in recipe is copied in, so the Recipes tab can list it. */
export const setSaved = (repo: MyRecipeRepository, recipe: Recipe, saved: boolean) => repo.put(recipe, saved);

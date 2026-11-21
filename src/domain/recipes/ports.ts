import type { Recipe } from "./types";

export interface RecipeRepository {
  list(): Promise<Recipe[]>;
}

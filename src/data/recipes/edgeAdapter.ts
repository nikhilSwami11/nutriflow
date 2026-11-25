import type { SupabaseClient } from "@supabase/supabase-js";
import type { DraftRecipe, RecipeAdapter } from "@/domain/eat";

/** The AI changes the recipe in the edge function `adapt-recipe` (the OpenAI key lives there). The app checks what comes back. */
export class EdgeRecipeAdapter implements RecipeAdapter {
  constructor(private db: SupabaseClient) {}
  async adapt(input: Parameters<RecipeAdapter["adapt"]>[0]) {
    const { data, error } = await this.db.functions.invoke("adapt-recipe", { body: input });
    if (error) throw error;
    return (data as { recipe: DraftRecipe }).recipe;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DraftRecipe, Idea, RecipeWriter, WriteInput } from "@/domain/eat";

/** The AI writes the meal in the edge function `write-recipe` (the OpenAI key lives there). The app checks what comes back. */
export class EdgeRecipeWriter implements RecipeWriter {
  constructor(private db: SupabaseClient) {}
  async write(input: WriteInput) {
    const { data, error } = await this.db.functions.invoke("write-recipe", { body: input });
    if (error) throw error;
    return data as { recipe: DraftRecipe; ideas: Idea[] };
  }
}

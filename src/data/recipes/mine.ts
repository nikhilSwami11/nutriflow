import type { SupabaseClient } from "@supabase/supabase-js";
import type { MyRecipe, MyRecipeRepository, Recipe, RecipeRepository } from "@/domain/recipes";

/** Without Supabase: kept in memory for the visit. */
export class InMemoryMyRecipeRepository implements MyRecipeRepository {
  private rows: MyRecipe[] = [];
  async list() {
    return [...this.rows];
  }
  async put(recipe: Recipe, saved: boolean) {
    this.rows = [{ recipe, saved }, ...this.rows.filter((r) => r.recipe.id !== recipe.id)];
  }
}

/** Table my_recipes (migration 0011), newest first. Row level security keeps it to the signed-in person. */
export class SupabaseMyRecipeRepository implements MyRecipeRepository {
  constructor(private db: SupabaseClient) {}
  async list() {
    const { data, error } = await this.db.from("my_recipes").select("recipe,saved").order("updated_at", { ascending: false }).limit(200);
    if (error) throw error;
    return (data as { recipe: Recipe; saved: boolean }[]).map((r) => ({ recipe: r.recipe, saved: r.saved }));
  }
  async put(recipe: Recipe, saved: boolean) {
    const { error } = await this.db.from("my_recipes").upsert({ id: recipe.id, recipe, saved, updated_at: new Date().toISOString() }, { onConflict: "user_id,id" });
    if (error) throw error;
  }
}

/** Every recipe the app can open by id: the built-ins, then the person's own (a saved copy of a built-in wins). */
export class CombinedRecipeRepository implements RecipeRepository {
  constructor(private builtins: RecipeRepository, private mine: MyRecipeRepository) {}
  async list() {
    const [base, own] = await Promise.all([this.builtins.list(), this.mine.list().catch(() => [])]);
    const ownIds = new Set(own.map((m) => m.recipe.id));
    return [...base.filter((r) => !ownIds.has(r.id)), ...own.map((m) => m.recipe)];
  }
}

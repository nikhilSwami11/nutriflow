import type { SupabaseClient } from "@supabase/supabase-js";
import type { ServingHabit, ServingHabitRepository } from "@/domain/cooking";
import type { KeyValueStore } from "../feed/local";

const KEY = "nutriflow.servingHabits";

/** Usual servings per recipe, kept in the browser for now. Never throws: storage can be blocked. */
export class LocalServingHabitRepository implements ServingHabitRepository {
  constructor(private store: KeyValueStore) {}

  private read(): Record<string, ServingHabit> {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as Record<string, ServingHabit>) : {};
    } catch {
      return {};
    }
  }

  async get(recipeId: string) {
    return this.read()[recipeId] ?? null;
  }

  async save(habit: ServingHabit) {
    try {
      this.store.setItem(KEY, JSON.stringify({ ...this.read(), [habit.recipeId]: habit }));
    } catch {
      /* losing one habit update is fine */
    }
  }
}

/** Table `serving_habits` (migration 0013). A read that fails counts as no habit yet: cooking never waits on it. */
export class SupabaseServingHabitRepository implements ServingHabitRepository {
  constructor(private db: SupabaseClient) {}
  async get(recipeId: string) {
    const { data, error } = await this.db.from("serving_habits").select("recipe_id,count,avg").eq("recipe_id", recipeId).maybeSingle();
    if (error || !data) return null;
    return { recipeId: data.recipe_id as string, count: data.count as number, avg: data.avg as number };
  }
  async save(habit: ServingHabit) {
    const { error } = await this.db.from("serving_habits").upsert({ recipe_id: habit.recipeId, count: habit.count, avg: habit.avg, updated_at: new Date().toISOString() }, { onConflict: "user_id,recipe_id" });
    if (error) throw error;
  }
}

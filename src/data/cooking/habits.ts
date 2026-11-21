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

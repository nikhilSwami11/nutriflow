import type { SupabaseClient } from "@supabase/supabase-js";
import type { MealPlanRepository, StoredDay } from "@/domain/planning";
import type { MealName } from "@/domain/recipes";

interface Row {
  date: string;
  meal: MealName;
  recipe_id: string;
  focus: StoredDay["focus"];
}

const ORDER: MealName[] = ["Breakfast", "Lunch", "Snack", "Dinner"];

/** Rows (one per meal) folded into days, meals in the day's order. */
export function toDays(rows: Row[]): StoredDay[] {
  const byDate = new Map<string, StoredDay>();
  for (const r of rows) {
    const d = byDate.get(r.date) ?? { date: r.date, focus: r.focus, meals: [] };
    d.meals.push({ meal: r.meal, recipeId: r.recipe_id });
    byDate.set(r.date, d);
  }
  for (const d of byDate.values()) d.meals.sort((a, b) => ORDER.indexOf(a.meal) - ORDER.indexOf(b.meal));
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Table `meal_plans` (migration 0012). */
export class SupabaseMealPlanRepository implements MealPlanRepository {
  constructor(private db: SupabaseClient) {}
  async list(from: string, to: string) {
    const { data, error } = await this.db.from("meal_plans").select("date,meal,recipe_id,focus").gte("date", from).lte("date", to);
    if (error) throw error;
    return toDays(data as Row[]);
  }
  async add(days: StoredDay[]) {
    const rows = days.flatMap((d) => d.meals.map((m) => ({ date: d.date, meal: m.meal, recipe_id: m.recipeId, focus: d.focus })));
    if (!rows.length) return;
    // A row another device already stored stays: first writer wins, everyone then reads the same plan.
    const { error } = await this.db.from("meal_plans").upsert(rows, { onConflict: "user_id,date,meal", ignoreDuplicates: true });
    if (error) throw error;
  }
  async clearFrom(date: string) {
    const { error } = await this.db.from("meal_plans").delete().gte("date", date);
    if (error) throw error;
  }
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { DateKey, MealLog, MealLogRepository, Profile, ProfileRepository } from "@/domain/nutrition";

interface LogRow {
  id: string;
  log_date: string;
  slot: MealLog["slot"];
  source: MealLog["source"];
  name: string;
  kcal: number;
  recipe_id: string | null;
  servings: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

const num = (v: number | null) => (v === null ? undefined : Number(v));
export const logFromRow = (r: LogRow): MealLog => ({
  id: r.id, date: r.log_date, slot: r.slot, source: r.source, name: r.name, kcal: Number(r.kcal),
  recipeId: r.recipe_id ?? undefined, servings: num(r.servings), protein: num(r.protein), carbs: num(r.carbs), fat: num(r.fat),
});
export const logToRow = (l: MealLog): LogRow => ({
  id: l.id, log_date: l.date, slot: l.slot, source: l.source, name: l.name, kcal: l.kcal,
  recipe_id: l.recipeId ?? null, servings: l.servings ?? null, protein: l.protein ?? null, carbs: l.carbs ?? null, fat: l.fat ?? null,
});

export class SupabaseMealLogRepository implements MealLogRepository {
  constructor(private db: SupabaseClient) {}
  async listBetween(from: DateKey, to: DateKey) {
    const { data, error } = await this.db
      .from("meal_logs").select("id,log_date,slot,source,name,kcal,recipe_id,servings,protein,carbs,fat").gte("log_date", from).lte("log_date", to);
    if (error) throw error;
    return (data as LogRow[]).map(logFromRow);
  }
  async add(log: MealLog) {
    // upsert on id: a retry after a lost response must not double count
    const { error } = await this.db.from("meal_logs").upsert(logToRow(log), { onConflict: "id" });
    if (error) throw error;
  }

  async remove(id: string) {
    const { error } = await this.db.from("meal_logs").delete().eq("id", id);
    if (error) throw error;
  }}

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private db: SupabaseClient) {}
  async get(): Promise<Profile | null> {
    const { data, error } = await this.db.from("profiles").select("kcal_min,kcal_max").maybeSingle();
    if (error) throw error;
    return data ? { range: { min: Number(data.kcal_min), max: Number(data.kcal_max) } } : null;
  }
  async save(p: Profile) {
    const { error } = await this.db.from("profiles").upsert({ kcal_min: p.range.min, kcal_max: p.range.max });
    if (error) throw error;
  }
}

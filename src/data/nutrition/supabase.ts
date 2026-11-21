import type { SupabaseClient } from "@supabase/supabase-js";
import type { DateKey, MealLog, MealLogRepository, Profile, ProfileRepository } from "@/domain/nutrition";

interface LogRow {
  id: string;
  log_date: string;
  slot: MealLog["slot"];
  source: MealLog["source"];
  name: string;
  kcal: number;
}

export const logFromRow = (r: LogRow): MealLog => ({
  id: r.id, date: r.log_date, slot: r.slot, source: r.source, name: r.name, kcal: Number(r.kcal),
});
export const logToRow = (l: MealLog): LogRow => ({
  id: l.id, log_date: l.date, slot: l.slot, source: l.source, name: l.name, kcal: l.kcal,
});

export class SupabaseMealLogRepository implements MealLogRepository {
  constructor(private db: SupabaseClient) {}
  async listBetween(from: DateKey, to: DateKey) {
    const { data, error } = await this.db
      .from("meal_logs").select("id,log_date,slot,source,name,kcal").gte("log_date", from).lte("log_date", to);
    if (error) throw error;
    return (data as LogRow[]).map(logFromRow);
  }
  async add(log: MealLog) {
    const { error } = await this.db.from("meal_logs").insert(logToRow(log));
    if (error) throw error;
  }
}

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

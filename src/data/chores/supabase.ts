import type { SupabaseClient } from "@supabase/supabase-js";
import type { Chore, ChoreRepository } from "@/domain/chores";

interface Row {
  id: string;
  title: string;
  repeat: Chore["repeat"];
  day: number | null;
  last_done: string | null;
}

export const fromRow = (r: Row): Chore => ({ id: r.id, title: r.title, repeat: r.repeat, day: r.day ?? undefined, lastDone: r.last_done });
export const toRow = (c: Chore): Row => ({ id: c.id, title: c.title, repeat: c.repeat, day: c.day ?? null, last_done: c.lastDone });

export class SupabaseChoreRepository implements ChoreRepository {
  constructor(private db: SupabaseClient) {}
  async list() {
    const { data, error } = await this.db.from("chores").select("id,title,repeat,day,last_done").order("created_at");
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  }
  async save(chore: Chore) {
    const { error } = await this.db.from("chores").upsert(toRow(chore));
    if (error) throw error;
  }
  async remove(id: string) {
    const { error } = await this.db.from("chores").delete().eq("id", id);
    if (error) throw error;
  }
}

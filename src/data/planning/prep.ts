import type { SupabaseClient } from "@supabase/supabase-js";
import type { PrepDoneRepository } from "@/domain/planning";
import type { KeyValueStore } from "../feed/local";

const KEY = "nutriflow.prepDone";

/** Offline: ticks in browser storage (the key the app always used). Never throws: storage can be blocked. */
export class LocalPrepDoneRepository implements PrepDoneRepository {
  constructor(private store: KeyValueStore) {}
  private read(): string[] {
    try {
      return JSON.parse(this.store.getItem(KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  }
  async doneOn(date: string) {
    return this.read().filter((id) => id.startsWith(`${date}:`));
  }
  async set(id: string, done: boolean) {
    const next = [...this.read().filter((x) => x !== id), ...(done ? [id] : [])].slice(-60);
    try {
      this.store.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage blocked: the tick just won't persist */
    }
  }
}

/** Table `prep_done` (migration 0013). */
export class SupabasePrepDoneRepository implements PrepDoneRepository {
  constructor(private db: SupabaseClient) {}
  async doneOn(date: string) {
    const { data, error } = await this.db.from("prep_done").select("id").like("id", `${date}:%`);
    if (error) throw error;
    return (data as { id: string }[]).map((r) => r.id);
  }
  async set(id: string, done: boolean) {
    const { error } = done
      ? await this.db.from("prep_done").upsert({ id }, { onConflict: "user_id,id", ignoreDuplicates: true })
      : await this.db.from("prep_done").delete().eq("id", id);
    if (error) throw error;
  }
}

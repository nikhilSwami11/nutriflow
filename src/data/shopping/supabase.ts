import type { SupabaseClient } from "@supabase/supabase-js";
import type { BoughtRecord, BoughtRepository, ShoppingPrefs, ShoppingPrefsRepository } from "@/domain/shopping";

// Table `shopping_state` (migration 0014): one row per person. A failed read counts as nothing saved yet.

export class SupabaseShoppingPrefsRepository implements ShoppingPrefsRepository {
  constructor(private db: SupabaseClient) {}
  async get() {
    const { data, error } = await this.db.from("shopping_state").select("zip,store").maybeSingle();
    if (error || !data?.zip || !data.store) return null;
    return { zip: data.zip, store: data.store } as ShoppingPrefs;
  }
  async save(prefs: ShoppingPrefs) {
    const { error } = await this.db.from("shopping_state").upsert({ zip: prefs.zip, store: prefs.store, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  }
}

export class SupabaseBoughtRepository implements BoughtRepository {
  constructor(private db: SupabaseClient) {}
  async list() {
    const { data, error } = await this.db.from("shopping_state").select("bought").maybeSingle();
    if (error || !data) return [];
    return data.bought as BoughtRecord[];
  }
  async save(records: BoughtRecord[]) {
    const { error } = await this.db.from("shopping_state").upsert({ bought: records, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) throw error;
  }
}

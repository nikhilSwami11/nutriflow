import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ParsedItem, PantryItem, PantryRepository, ShoppingListRepository, UtteranceParser } from "@/domain/pantry";

export interface PantryRow {
  id: string;
  name: string;
  grp: PantryItem["group"];
  qty: number;
  unit: PantryItem["unit"];
  low_at: number;
}

export const fromRow = (r: PantryRow): PantryItem => ({
  id: r.id,
  name: r.name,
  group: r.grp,
  qty: Number(r.qty),
  unit: r.unit,
  lowAt: Number(r.low_at),
});

export const toRow = (i: PantryItem): PantryRow => ({
  id: i.id,
  name: i.name,
  grp: i.group,
  qty: i.qty,
  unit: i.unit,
  low_at: i.lowAt,
});

/** Anonymous sign-in until the design has an auth screen. */
export async function createSupabase(url: string, anonKey: string): Promise<SupabaseClient> {
  const client = createClient(url, anonKey);
  const { data } = await client.auth.getSession();
  if (!data.session) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw error;
  }
  return client;
}

export class SupabasePantryRepository implements PantryRepository {
  constructor(private db: SupabaseClient) {}
  async list() {
    const { data, error } = await this.db.from("pantry_items").select("id,name,grp,qty,unit,low_at").order("name");
    if (error) throw error;
    return (data as PantryRow[]).map(fromRow);
  }
  async save(items: PantryItem[]) {
    const { error } = await this.db.from("pantry_items").upsert(items.map(toRow));
    if (error) throw error;
  }
}

export class SupabaseShoppingListRepository implements ShoppingListRepository {
  constructor(private db: SupabaseClient) {}
  async list() {
    const { data, error } = await this.db.from("shopping_list_items").select("item_id");
    if (error) throw error;
    return (data as { item_id: string }[]).map((r) => r.item_id);
  }
  async add(ids: string[]) {
    if (!ids.length) return;
    const { error } = await this.db.from("shopping_list_items").upsert(ids.map((item_id) => ({ item_id })));
    if (error) throw error;
  }
  async remove(ids: string[]) {
    if (!ids.length) return;
    const { error } = await this.db.from("shopping_list_items").delete().in("item_id", ids);
    if (error) throw error;
  }
}

export class EdgeUtteranceParser implements UtteranceParser {
  constructor(private db: SupabaseClient) {}
  async parse(text: string): Promise<ParsedItem[]> {
    const { data, error } = await this.db.functions.invoke("parse-pantry-utterance", { body: { text } });
    if (error) throw error;
    return (data as { items: ParsedItem[] }).items;
  }
}

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { RecipeSearch } from "@/domain/eat";
import type { Amount, BuyAdvisor, Need, ParsedItem, PantryItem, PantryRepository, ShoppingListRepository, UtteranceParser } from "@/domain/pantry";

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

const clients = new Map<string, Promise<SupabaseClient>>();

/** One client per project, shared: two clients on the same storage key fight over the auth session. Sign-in lives in the auth screen (guest or Google), never here. */
export function createSupabase(url: string, anonKey: string): Promise<SupabaseClient> {
  const key = `${url}|${anonKey}`;
  let c = clients.get(key);
  if (!c) {
    c = (async () => {
      const client = createClient(url, anonKey);
      await client.auth.getSession(); // finishes a Google redirect before anything reads the session
      return client;
    })();
    c.catch(() => clients.delete(key)); // let a failed sign-in be retried
    clients.set(key, c);
  }
  return c;
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
  async add(ids: string[], amounts: Record<string, Amount> = {}) {
    if (!ids.length) return;
    // ignoreDuplicates: an item already on the list keeps the amount the user set.
    const rows = ids.map((item_id) => ({ item_id, qty: amounts[item_id]?.qty ?? 1, unit: amounts[item_id]?.unit ?? "pcs" }));
    const { error } = await this.db.from("shopping_list_items").upsert(rows, { onConflict: "user_id,item_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  async amounts() {
    const { data, error } = await this.db.from("shopping_list_items").select("item_id,qty,unit");
    if (error) throw error;
    return Object.fromEntries((data as { item_id: string; qty: number; unit: Amount["unit"] }[]).map((r) => [r.item_id, { qty: Number(r.qty), unit: r.unit }]));
  }
  async setAmount(id: string, amount: Amount) {
    const { error } = await this.db.from("shopping_list_items").update({ qty: amount.qty, unit: amount.unit }).eq("item_id", id);
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

/** Claude decides what to buy ("3 cups milk" is "1 l"). The key lives in the edge function, never here. */
export class EdgeBuyAdvisor implements BuyAdvisor {
  constructor(private db: SupabaseClient) {}
  async suggest(needs: Need[]): Promise<Need[]> {
    const { data, error } = await this.db.functions.invoke("suggest-buy-units", { body: { items: needs } });
    if (error) throw error;
    return (data as { items: Need[] }).items;
  }
}

/** Meaning search over recipes: the question is embedded in an edge function and matched in the vector table. */
export class EdgeRecipeSearch implements RecipeSearch {
  constructor(private db: SupabaseClient) {}
  async search(query: string) {
    const { data, error } = await this.db.functions.invoke("text-search", { body: { query, kind: "recipe" } });
    if (error) throw error;
    return (data as { matches: { id: string; similarity: number }[] }).matches;
  }
}

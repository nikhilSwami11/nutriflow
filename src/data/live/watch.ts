import type { SupabaseClient } from "@supabase/supabase-js";

/** Tables the chat (or another device) can change; migration 0015 adds them to the realtime publication. */
export const LIVE_TABLES = ["meal_logs", "pantry_items", "shopping_list_items", "shopping_state", "chores", "meal_plans", "profiles", "my_recipes", "prep_done"] as const;

/**
 * Calls `onChange` (at most once per `wait` ms) when any of the person's rows in LIVE_TABLES change, so an open app follows
 * what was done in Claude, ChatGPT or on another device. RLS limits inserts and updates to the person's own rows.
 * shortcut: deletes cannot be filtered by RLS and arrive for everyone (primary key only, never read here), so another
 * person's delete costs one extra refetch; filter by user_id with replica identity full if that ever matters.
 * Returns a stop function.
 */
export function watchTables(db: SupabaseClient, onChange: () => void, wait = 800): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const fire = () => {
    clearTimeout(timer);
    timer = setTimeout(onChange, wait);
  };
  const channel = db.channel("nutriflow-live");
  for (const table of LIVE_TABLES) channel.on("postgres_changes", { event: "*", schema: "public", table }, fire);
  channel.subscribe();
  return () => {
    clearTimeout(timer);
    void db.removeChannel(channel);
  };
}

-- Live refresh: the open app hears changes made in chat or on another device (src/data/live/watch.ts).
-- Realtime respects RLS, so each person only receives their own inserts and updates.
alter publication supabase_realtime add table
  public.meal_logs,
  public.pantry_items,
  public.shopping_list_items,
  public.shopping_state,
  public.chores,
  public.meal_plans,
  public.profiles,
  public.my_recipes,
  public.prep_done;

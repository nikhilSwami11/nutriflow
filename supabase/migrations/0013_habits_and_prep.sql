-- Moved out of the browser so every device and the chat (MCP) see them.

-- Usual servings per recipe: the Finish screen starts from this.
create table public.serving_habits (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  recipe_id text not null check (length(recipe_id) between 1 and 120),
  count integer not null check (count >= 0),
  avg real not null check (avg > 0 and avg <= 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);
alter table public.serving_habits enable row level security;
create policy "own serving habits" on public.serving_habits
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.serving_habits to authenticated;

-- Prep jobs ticked done (soak beans, marinate). The id starts with the day it is for: "2026-11-23:today:rajma:soak".
create table public.prep_done (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (length(id) between 1 and 200),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);
alter table public.prep_done enable row level security;
create policy "own prep ticks" on public.prep_done
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.prep_done to authenticated;

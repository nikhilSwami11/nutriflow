-- The week plan, stored so the app and the chat (MCP) read the same meals. One row per person, day and meal.
-- Filled when a day is missing; rebuilt from today when the person asks ("redo my week") or switches focus.
create table public.meal_plans (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('Breakfast', 'Lunch', 'Snack', 'Dinner')),
  recipe_id text not null check (length(recipe_id) between 1 and 120),
  focus text not null default 'balanced' check (focus in ('balanced', 'protein')),
  created_at timestamptz not null default now(),
  primary key (user_id, date, meal)
);

alter table public.meal_plans enable row level security;

create policy "own meal plans" on public.meal_plans
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.meal_plans to authenticated;

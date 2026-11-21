create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  kcal_min numeric not null check (kcal_min > 0),
  kcal_max numeric not null,
  check (kcal_max > kcal_min)
);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  log_date date not null,
  slot text not null check (slot in ('breakfast', 'lunch', 'dinner', 'snack')),
  source text not null check (source in ('cook', 'photo')),
  name text not null,
  kcal numeric not null check (kcal >= 0),
  -- set when the meal came from a recipe
  recipe_id text,
  servings numeric check (servings > 0),
  protein numeric check (protein >= 0),
  carbs numeric check (carbs >= 0),
  fat numeric check (fat >= 0)
);
create index meal_logs_user_date_idx on public.meal_logs (user_id, log_date);

alter table public.profiles enable row level security;
alter table public.meal_logs enable row level security;

create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own meal logs" on public.meal_logs
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.meal_logs to authenticated;

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  grp text not null check (grp in ('Produce', 'Dairy', 'Dry goods')),
  qty numeric not null default 0 check (qty >= 0),
  unit text not null check (unit in ('pcs', 'cloves', 'packs', 'jar', 'cups')),
  low_at numeric not null default 1 check (low_at >= 0),
  updated_at timestamptz not null default now()
);
create index pantry_items_user_idx on public.pantry_items (user_id);

create table public.shopping_list_items (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id uuid not null references public.pantry_items (id) on delete cascade,
  primary key (user_id, item_id)
);

alter table public.pantry_items enable row level security;
alter table public.shopping_list_items enable row level security;

create policy "own pantry" on public.pantry_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own shopping list" on public.shopping_list_items
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

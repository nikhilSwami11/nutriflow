-- Shopping choices and the last 12 hours of bought items, moved out of the browser so every device sees them.
create table public.shopping_state (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  zip text check (zip ~ '^\d{5}$'),
  store text check (store in ('walmart', 'aldi', 'costco')),
  bought jsonb not null default '[]'::jsonb check (jsonb_typeof(bought) = 'array'),
  updated_at timestamptz not null default now()
);
alter table public.shopping_state enable row level security;
create policy "own shopping state" on public.shopping_state
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.shopping_state to authenticated;

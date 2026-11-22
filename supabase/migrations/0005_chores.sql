-- Personal chores. A chore repeats daily or weekly, or happens once; last_done decides whether it is due.
create table public.chores (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  repeat text not null check (repeat in ('daily', 'weekly', 'once')),
  day smallint check (day between 0 and 6),
  last_done date,
  created_at timestamptz not null default now(),
  check ((repeat = 'weekly') = (day is not null))
);
create index chores_user_idx on public.chores (user_id, created_at);

alter table public.chores enable row level security;

create policy "own chores" on public.chores
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.chores to authenticated;

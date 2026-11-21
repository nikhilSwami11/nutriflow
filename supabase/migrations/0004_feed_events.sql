-- What the user did with each feed post. The feed builder learns from this.
create table public.feed_events (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_id text not null,
  kind text not null check (kind in ('next-meal', 'all-done', 'day-chart', 'pantry-alert', 'plan-nudge', 'story')),
  action text not null check (action in ('impression', 'open', 'like', 'unlike', 'save', 'unsave', 'dismiss', 'mark-eaten', 'add-to-list')),
  position int not null check (position >= 0),
  dwell_ms int check (dwell_ms >= 0),
  created_at timestamptz not null default now()
);
create index feed_events_user_time_idx on public.feed_events (user_id, created_at desc);

alter table public.feed_events enable row level security;

create policy "own feed events" on public.feed_events
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, delete on public.feed_events to authenticated;

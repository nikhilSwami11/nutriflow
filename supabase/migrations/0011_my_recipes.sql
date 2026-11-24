-- Recipes that belong to one person: written for them by the AI ("What should I eat?") or saved by them.
-- saved = shown in the Recipes tab (Save button, or cooked). The recipe itself is the app's Recipe shape as JSON.
create table public.my_recipes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (length(id) between 1 and 80),
  recipe jsonb not null,
  saved boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index my_recipes_user_idx on public.my_recipes (user_id, updated_at desc);

alter table public.my_recipes enable row level security;

create policy "own recipes" on public.my_recipes
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.my_recipes to authenticated;

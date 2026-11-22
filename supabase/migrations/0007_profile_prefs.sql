-- Eating preferences on the profile.
alter table public.profiles
  add column diet text not null default 'anything' check (diet in ('anything', 'vegetarian', 'eggetarian', 'vegan')),
  add column dislikes text[] not null default '{}';

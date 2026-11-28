-- Onboarding: allergens (kept out like dislikes), height and weight (only to suggest a calorie range).
alter table public.profiles
  add column allergens text[] not null default '{}',
  add column height_cm numeric check (height_cm is null or (height_cm > 50 and height_cm < 260)),
  add column weight_kg numeric check (weight_kg is null or (weight_kg > 20 and weight_kg < 400));
alter table public.profiles add column appliances text[];

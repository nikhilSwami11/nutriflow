-- How much of each item to buy, and in what unit.
alter table public.shopping_list_items
  add column qty numeric not null default 1 check (qty > 0),
  add column unit text not null default 'pcs'
    check (unit in ('pcs', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cups', 'packs', 'cloves', 'jar', 'bunch'));

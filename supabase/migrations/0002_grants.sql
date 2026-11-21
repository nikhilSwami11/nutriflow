-- RLS policies alone are not enough: the role also needs table privileges.
grant select, insert, update, delete on public.pantry_items to authenticated;
grant select, insert, update, delete on public.shopping_list_items to authenticated;

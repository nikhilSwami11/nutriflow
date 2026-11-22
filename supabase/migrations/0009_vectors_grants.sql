-- The edge function that fills the table runs as service_role, which needs its own grant on a table made by a migration.
grant select, insert, update, delete on public.text_vectors to service_role;

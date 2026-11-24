-- Meals told to an assistant (ChatGPT or Claude through the MCP connector) are logged with source 'chat'.
alter table public.meal_logs drop constraint if exists meal_logs_source_check;
alter table public.meal_logs add constraint meal_logs_source_check check (source in ('cook', 'photo', 'chat'));

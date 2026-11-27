-- The feed has a new post, "shop-now" (a planned meal is blocked by things the pantry lacks).
-- Widen the kind check so its events can be saved. Until this is applied, those events stay in the browser only.
alter table public.feed_events drop constraint if exists feed_events_kind_check;
alter table public.feed_events
  add constraint feed_events_kind_check
  check (kind in ('next-meal', 'all-done', 'day-chart', 'pantry-alert', 'plan-nudge', 'shop-now', 'story'));

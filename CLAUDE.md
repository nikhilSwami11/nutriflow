# NutriFlow

Voice-first cooking and nutrition companion. v1 is personal only (no household, town, garden, marketplace, estimated "usual day").
Design source: the Design canvas (https://claude.ai/artifact/LRpDujJG56m3BrezNnrzCs). Match it. No UI or copy beyond it; if missing, ask.

## Stack
Next.js App Router, strict TS, Tailwind v4 (CSS variables in `src/app/globals.css`), TanStack Query, Zustand, Supabase, Vitest, Playwright.

## Layers (enforced by `eslint-plugin-boundaries`, see `eslint.config.mjs`)
- `src/presentation` -> `src/view-models` -> `src/domain` <- `src/data`
- `domain`: pure TypeScript. No react/next/supabase/tanstack/zustand imports. Defines entities, use cases, ports (repository interfaces).
- `data`: implements domain ports (Supabase, AI clients). Only imports `domain`.
- `view-models`: hooks. Import `domain` only; get repositories through injected context.
- `presentation`: components. Import `view-models` only, never `data`/`domain`.
- `src/composition` + `src/app`: wire `data` into providers. Only place `data` is imported.
- AI keys live in Supabase edge functions only.
- Every use case has a unit test (`*.test.ts` beside it).

## Data and wiring
- `src/composition/Providers.tsx` builds repositories after mount (client only) so "today" is never frozen at build time. Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set (the key is the publishable key), otherwise in-memory seeded repos.
- Migrations in `supabase/migrations`. Every table needs RLS policies AND `grant ... to authenticated`, or requests fail with `permission denied`.
- Anonymous sign-in is on until an auth screen exists.
- Playwright runs on port 3100 with Supabase vars blanked: e2e never touches the real project. Stop `next dev` on 3000 first (one dev server per directory).

## Feed (server-driven Home)
- `domain/feed`: the contract (`Feed`, `FeedItem` by `kind`, `schemaVersion`), `FeedEvent`, `summarizeEvents`/`kindBoost` (14-day window, boost capped at +-20, dismissals weigh more) and `buildFeed` (rule-based ranking; deterministic). No AI yet on purpose: the user does not want the Claude API for now. A model can later replace the ranking by choosing among the same candidates, without changing the contract.
- The feed decides which posts, in what order and why. Live data inside a post (chart, pantry, eaten) stays bound on the client. Clients drop unknown kinds and schema versions.
- Desktop renders the same items in `presentation/home/feed/FeedGrid` as dashboard cards (wide kinds take 7 of 12 columns, the rest 5; the feed's order decides placement) and records the same events. Option chosen: one feed engine, two renderers.
- Mobile renders it in `presentation/home/feed` (`Feed` kind registry, `Tracked` impressions after 1s at 50% visible, `Post`). Events are batched by `useFeedTracker` (4s, tab hide, pagehide) into `LocalFeedEventRepository` (localStorage, last 500). Stats are read once per visit so the feed never reshuffles while scrolling.
- Stories: `Feed.stories` (optional, so old feeds still parse) built by `buildStories`: one per planned meal in day order, then pantry and plan when they apply. Fixed order, never reranked by engagement. `presentation/home/stories`: `Stories` row (unseen ring, grey when seen or eaten, check badge on eaten meals) and `StoryViewer` (full screen on mobile, centred card on desktop; CSS-driven progress bars that pause on hold or hover; arrows, Escape, tap zones; no autoplay under reduced motion). Seen ids live in localStorage and carry the date. Events use kind `story`.
- Migration `0004_feed_events.sql` and `SupabaseFeedEventRepository` exist but are not applied or wired: that comes with the real-data phase.
- Presentation cannot import the domain: feed types reach it through `view-models/feed/types.ts`.

## Domain notes
- `domain/pantry`: pantry items, voice add (hear, then confirm), recipe depletion, running-low shopping list.
- `domain/nutrition`: meal logs (cook or photo only), target range (default 1800 to 2100 until set), seed rule (15 seeds, in range only), `weekSeries` returns null for unlogged days, `rankUpNext`.
- Home is a feed on mobile (`presentation/home/feed`: `Post` = header with coloured icon, media, Like and Save, caption; posts are Up next, Your day with the chart, Pantry alert) and a dashboard from `lg` up. `HomeScreen` renders one layout via `useMediaQuery`, never both. Like and Save are local only; Comment and Share are out (social). Home is three things on purpose: the next meal to cook (`NextMealHero`, taps through to the recipe, "Then" links for the rest of today), one Chart.js card holding today, 7 days and 30 days (`MacroChart` with the `TodayLine` strip), and the pantry nudge. Do not add cards back without asking: the user wants it compact. Out of v1: household, chores, chat, spend, streak, social feed (likes, comments, share).
- Demo data: `data/dashboard/demo.ts` (30 days of history, what was eaten today, how often each recipe was eaten) and `data/recipes/demo.ts` (recipes). Today is built from the meals marked eaten.
- `domain/planning`: `planWeek` picks meals per day toward calorie and protein goals (history bonus, repeat penalty, adapts as the day fills); `weekBalance` gives per-day status and plain-words notes.
- Plan page shows ONE day at a time: today is open, a day strip (`role=tablist`, arrow keys, Home/End) jumps to another, and a small "This week" card holds the averages and notes. Do not list all seven days at once: the user found that overwhelming.
- Routes: `/` Home, `/recipes`, `/recipes/[id]` (static params from the demo recipe ids), `/plan`, `/pantry`.
- `domain/dashboard`: chart stats, macro shares, `dayFromRecipes`.

## Layout
- Mobile is the design. `presentation/shell/AppShell` wraps every screen: bottom nav below `lg`, sidebar from `lg` up (nav items Today, Pantry, Recipes only; Chores, Shopping, Insights and the roommates card are out of v1). Screens add `lg:` classes for the desktop grid.
- E2E runs two Playwright projects: `mobile` (Pixel 7) and `desktop` (1440x900).

## Motion
- Keyframes and helpers live in `globals.css`: `.rise` (staggered entrance, `--i` sets delay), `.grow-x` (bars), `.reveal` (chart paths), `.fade-in`. All buttons get press feedback; add `data-nopress` to opt out, `hoverable` for a hover border.
- Numbers tween with `presentation/shared/AnimatedNumber`. Everything honors `prefers-reduced-motion` (global CSS rule, plus a check in the tween).
- The calories and macros chart uses Chart.js (same interaction settings as the cashflow_with_ml project: index mode, non-intersecting hover, animated tooltip, 350ms morph between ranges). `useHome` supplies pre-formatted day points; `MacroChart` only draws. Chart.js can't read CSS variables, so `presentation/shared/chartTokens.ts` resolves them once. The wrapper is a `role="slider"` (arrow keys, Home/End) with an sr-only live readout, since the canvas tooltip isn't in the DOM.

## Style
- Light theme first, tokens in `:root`. Palette: mint, rose, sky, lavender, butter, peach. IBM Plex Sans, thin strokes, black only on small accents.
- 44px min touch targets (`touch` utility). Respect `prefers-reduced-motion` (global rule).
- Seeds: only a day with logged intake inside target range earns. No bonus below target. Unlogged days are gaps in charts, never zero.

## Commands
`npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`.
After each slice run typecheck, lint, tests.

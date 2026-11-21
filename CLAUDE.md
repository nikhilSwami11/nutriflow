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

## Domain notes
- `domain/pantry`: pantry items, voice add (hear, then confirm), recipe depletion, running-low shopping list.
- `domain/nutrition`: meal logs (cook or photo only), target range (default 1800 to 2100 until set), seed rule (15 seeds, in range only), `weekSeries` returns null for unlogged days, `rankUpNext`.
- Home is a feed on mobile (`presentation/home/feed`: `Post` = header with coloured icon, media, Like and Save, caption; posts are Up next, Your day with the chart, Pantry alert) and a dashboard from `lg` up. `HomeScreen` renders one layout via `useMediaQuery`, never both. Like and Save are local only; Comment and Share are out (social). Home is three things on purpose: the next meal to cook (`NextMealHero`, taps through to the recipe, "Then" links for the rest of today), one Chart.js card holding today, 7 days and 30 days (`MacroChart` with the `TodayLine` strip), and the pantry nudge. Do not add cards back without asking: the user wants it compact. Out of v1: household, chores, chat, spend, streak, social feed (likes, comments, share).
- Demo data: `data/dashboard/demo.ts` (30 days of history, what was eaten today, how often each recipe was eaten) and `data/recipes/demo.ts` (recipes). Today is built from the meals marked eaten.
- `domain/planning`: `planWeek` picks meals per day toward calorie and protein goals (history bonus, repeat penalty, adapts as the day fills); `weekBalance` gives per-day status and plain-words notes.
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

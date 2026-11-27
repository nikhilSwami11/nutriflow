# NutriFlow redesign plan

Written 2026-11-27 from an Impeccable critique (design review plus detector and measurements, run against the offline demo data on phone 412x915 and desktop 1440x900). Read `CLAUDE.md` and `PRODUCT.md` first. This file is the work order; where it conflicts with `CLAUDE.md`, this file wins for the items below, and `CLAUDE.md` must be updated as each item ships.

## Goal

Bring the app back to the original idea: the app decides, the next step is one tap, the screen is compact. Home and Eat still do this. Most screens added later (Profile, Pantry, Shopping, Chores, Plan, Recipes, the cook screen) are forms and lists the person has to manage. The critique scored the app 26/40. The automated detector found almost nothing, so this is a product-discipline problem, not a visual-bug problem.

## Rules for the whole redesign

- One main action per screen state. It is the only black pill. Everything else is quiet (text link, icon button, or behind a More menu).
- Selection stays pastel (mint with dark text). No new colours, radii or font sizes beyond the design system in `CLAUDE.md` (text 12px minimum, 44px touch targets, 20px gutter, card radius 20px).
- Do not invent copy or features that are not on the Design canvas (https://claude.ai/artifact/LRpDujJG56m3BrezNnrzCs) or listed here. If something is missing, ask.
- Layers stay as in `CLAUDE.md` (presentation, view-models, domain, data). Every new use case gets a unit test. After each item run `npm run typecheck`, `npm run lint`, `npm test`, and the affected Playwright specs (stop `next dev` first: one dev server per directory).
- Update `CLAUDE.md` and `docs/features.md` as each item ships.

## Already done (2026-11-27)

- Home next-meal card (phone post and desktop card): picture, title, one status line, one big button and a round More button. More holds Cook anyway, I have some of these, Mark eaten, Pick something else. The "Then" chips were removed.
- Cook Wash tile no longer lists powders, pastes, seeds or juice.
- `neededForPlan` skips kitchen basics (salt, oil, water, common spices) unless the pantry has them at 0.
- Pantry rows say "Out" at 0, "Low" otherwise.
- Profile has the "Use with Claude or ChatGPT" card. Profile calories are now three goal chips plus Custom, the weekly bar chart is gone, and Save sticks above the phone nav.
- Chores: one add row (repeat chips appear once you type), neutral wording instead of "Late".
- Pantry: the Running-low card shows only on the Running low tab; rows without a picture show a letter badge.
- Plan: meals show the dish picture; one line explains Balanced vs High protein.
- Cook: Ingredients and Recipe views sit behind a Views (three dots) button.
- Stories: labels wrap to two lines; the `.pop` easing no longer overshoots.

## Decisions the owner still has to make (ask before building the item they affect)

1. Like and Save on Home posts: remove, or keep as local bookmarks? (`CLAUDE.md` is mixed: it keeps them, and also lists likes as out of v1.) Affects item 2.
2. Recipes tab: remove from Food, or keep? It is empty by default and its button points back to Eat. Affects item 6.
3. Home primary action when ingredients are missing: today it is "Add N to shopping". The critique argues the primary should be "Cook now" with swaps pre-chosen, and shopping should be secondary. Changing it changes how the app decides, so this needs a yes. Affects item 1.
4. What else Home should show as posts besides next meal, your day and pantry alert. The owner said they will work this out; do not add post kinds until they decide.

## Work items, in order

### 1. Home: one decision (P0)
- Confirm decision 3 above. If yes, the primary button is "Cook now" whenever the dish can be made with swaps or skips; "Add N to shopping" moves into More.
- First day with an empty pantry must not say "You are missing 6 things". When the pantry is not set up (`cookability` state `unknown`), the status line asks nothing and the primary is "Start cooking"; the "Do you have these?" sheet opens when cooking starts, not on Home.
- Status line: one short line ("Ready to cook", "Missing 3 things"). No second line.

### 2. Home mobile: fewer things before the fold (P1)
- Decide Like and Save (decision 1). If removed, delete the toggles from `presentation/home/feed/Post.tsx`, the `like`/`save` feed events from the tracker, and the e2e test that likes a post. The `feed_events.action` check does not need a migration to stop sending them.
- Stories row: keep "Eat next" and "Prep". Chore stories stay only if a chore is due today. Fix truncated story labels at 412px (two lines, or shorter names).
- Home chart (Your day): show the one line "450 of 1,900 kcal" first, with the 7/30-day chart one tap away. (Ask before removing the chart outright: `CLAUDE.md` says Home is three things on purpose, and the chart is one of them.)
- Desktop Home: the right column is nearly empty. Let the Pantry alert and Plan cards fill it, or let the meal card take the full row. No new cards.

### 3. Profile: a preference screen, not a report (P1)
- Remove the weekly bar chart and its `useIntakeWeek` call from `ProfileScreen`.
- Calorie goal: three presets (Lose, Maintain, Gain) as chips with the number shown, plus "Custom" that reveals From and To. The preset names already exist in onboarding (`GOALS` in `view-models/profile`).
- Diet as four chips, foods to skip as one input, Save sticky above the phone nav so it is never hidden.
- Keep the Connect card and Account section. Add a Disconnect button on the Connect card using `supabase.auth.oauth.revokeGrant({ clientId })` (needs the client id added to `ConnectedApp`).

- Future (owner, 2026-11-27): Profile should feel like a profile, not an edit page or a settings page. Today it is a form (goal, diet, skip list, account, connector). Design a real profile: who you are at the top (name or email, how long you have used it), what the app has learned (your usual servings, foods you eat most, your goal in one line), and settings tucked into one quiet section below. Not on the Design canvas: shape it first (`/impeccable shape`), then build.

### 4. Shopping: what you need now (P2)
- Split the list into "For tonight" (what the next meal needs) and "For the week". The list items do not remember which meal needed them, so add a nullable `needed_for` text column on `shopping_list_items` (new migration `0016`, with RLS and `grant ... to authenticated`), set by `neededForPlan` and by "Add N to shopping" on Home. Items added by hand or from running-low go in "For the week".
- Replace the brick progress bar with one text line ("2 of 8 shopped") and keep tap-to-see-shopped.
- "Choose a store" stays a quiet text button.
- Already done: kitchen basics no longer land on the list.

### 5. Cook screen: focus mode (P2)
- Show only the current action: its animation, its tasks, the timer, and the one big button. Large type for the hands-busy cook.
- The action strip becomes small progress dots plus the current action name. Ingredients and Recipe views move behind a More icon. Parallel, Tip and Ask stay as quiet buttons.
- Announce the voice commands once on screen ("Say next").
- Checkbox visual size 22px is too small with wet hands: make the whole task row the tap target.
- Add the voice orb to the cook screen header so voice is visible where it matters.

### 6. Food and Kitchen navigation (P2)
- Decision 2: if Recipes is removed from the Food pills, move "Saved recipes" into Eat as a list under the picks, and update `SECTION_PAGES`, `pages.ts`, `CommandMenu`, the e2e specs and `docs/features.md`.
- Make the page title position consistent: title first, section pills below, on every screen that has pills.
- Eat: 4 pills plus 4 wish chips plus 3 cards is too many entry points. Keep the wish chips; cut the section pills on Eat to the Food switch only.
- Make the Home title the same on phone and desktop.

### 7. Pantry, Chores, Plan (P1/P3)
- Pantry: remove the separate "Running low" card (the tab already shows it). Rows without a picture show a letter badge in the pastel square.
- Chores: a plain tick list; "Add a chore" becomes a trailing row, not a form above the list. Late chores use neutral wording, not a red "Late" count.
- Plan: give each meal its own colour (today Breakfast and Dinner share blue), explain the Balanced / High protein switch in one line, and drop the "This week" averages card unless the owner wants it kept.

### 8. Polish and checks
- Replace the `cubic-bezier(0.3, 1.4, 0.5, 1)` overshoot curve at `src/app/globals.css:224` with a non-overshooting ease (the detector flagged it).
- Re-run `/impeccable critique` on Home, Eat, Cook, Profile, Pantry and Shopping and compare the score (26/40 today). Then `/impeccable polish` on the screens that changed.
- Fix the React warning "two children with the same key `Salt` / `Water`" seen in e2e (likely duplicate names in the "Do you have these?" list).

## Not in scope

Household, garden, marketplace, social features, new post kinds (owner is deciding), per-store prices, a real vision model, multi-user.

## Verification

Run the app offline with seeded data: `NEXT_PUBLIC_SUPABASE_URL= NEXT_PUBLIC_SUPABASE_ANON_KEY= npx next dev -p 3100`, then screenshot each changed screen at 412x915 and 1440x900. Playwright runs on port 3100 the same way, so stop the dev server before `npm run test:e2e`.

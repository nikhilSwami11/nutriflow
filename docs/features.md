g# NutriFlow features and requirements (v1, personal)

What each screen must do, how it differs on phone and desktop, and how to check it by hand.
Tick a box when you have tried it yourself. Write what felt wrong under "Notes" for that screen; that list becomes the next work.

Status words: **Built** (code exists), **Auto** (an e2e test covers it), **Hand** (you have tried it).

## How to test

- Offline (no Supabase): remove or blank `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, run `npm run dev`. Seeded demo data, always a guest.
- Real account: keep the Supabase vars, `npm run dev`, or use https://nutriflow-neon.vercel.app.
- Brand-new person: in the browser console `localStorage.clear(); localStorage.setItem("nutriflow.fresh","1")`, reload (offline only).
- Phone: Chrome devtools device mode (Pixel 7) or open the Vercel URL on your phone. Desktop: a window 1440 wide.
- Automated: `npm run test:e2e` (stop `next dev` on 3000 first). Runs every test on a phone and a desktop.

## Product rules (apply to every screen)

1. The app decides: each screen shows one next step with one main (black) button.
2. Nothing invented: when the app does not know (pantry not set up, AI failed), it says so or asks.
3. AI never blocks a screen: every AI feature has a rule-based fallback and a timeout.
4. Unlogged days are gaps, never zero.
5. Design system: text 12px or larger, cards 20px corners, every tap target 44x44, 20px phone gutter, contrast 4.5:1, pastel mint for selection.
6. Reduced motion: nothing moves on its own; fades only.

---

## 1. Sign-in and first run (`/signin`, onboarding sheet)

Goal: get a person in with no friction and learn three things once.

Must:
- Sessionless visitors land on `/signin`. "Get started" starts a guest. "Continue with Google" keeps a guest's data (links the identity).
- Email sign-in works.
- First run (no profile, empty pantry): three questions (diet, goal, what is always at home), Skip allowed, never asked again.

Phone / desktop: same screen, centred on desktop.

Test by hand:
- [ ] Fresh browser: lands on `/signin`.
- [ ] Get started -> Home, onboarding asks three questions; Skip works; reload does not ask again.
- [ ] As a guest, log a meal, then Continue with Google from Profile: the meal is still there.
- [ ] Sign out (Profile) asks to confirm for a guest.
- [ ] Profile > Use with Claude or ChatGPT: Copy puts `<app>/mcp` on the clipboard; after connecting in Claude, coming back shows "Connected since".

Auto: `auth.spec.ts`, `fresh.spec.ts`. Notes:

## 2. Home (`/`)

Goal: three things only: the next meal, one chart, the pantry nudge. Plus stories and the chat orb.

Must:
- Up next: the meal picked by the clock (first uneaten meal whose time has not passed, else tomorrow's first).
- One plain line ("Ready to cook" or "You are missing 5 things") and ONE main action: Start cooking, or Add 5 to shopping.
- When the app is unsure (pantry not set up) the main button is still "Start cooking"; "Check what I have" sits in More and opens the "Do you have these?" sheet.
- Mark eaten logs one serving and moves Up next on; unmark removes the log.
- Chart: today, 7 days, 30 days; tap or hover picks a day; keyboard works (arrows, Home/End).
- Pantry nudge puts running-low items on the shopping list.
- Stories row: Eat next, Prep (when jobs exist), chores, pantry, plan. Fixed order.
- Chat orb opens a small chat; with Supabase it uses the model, else the rule router.

Phone: a feed of posts (Like, Save), stories on top, bottom nav.
Desktop: dashboard cards (meal and chart in the wide column, pantry and plan beside), sidebar.

Test by hand:
- [ ] At different hours, Up next shows the right meal.
- [ ] A meal with missing items: one tap puts them on Shopping.
- [ ] Mark eaten: chart and Up next update without reload.
- [ ] Chart: tap a bar on the phone shows that day. (Known failing in e2e on mobile.)
- [ ] Stories: open, tap zones, hold to pause, Escape closes, seen ring turns grey after reload.
- [ ] Prep story: tick a job, reload, still ticked.
- [ ] Chat: "I'm hungry", "I have 2 onions", "start cooking" each give one button that works.
- [ ] Desktop: nothing overlaps at 1280 and 1440 wide.

Auto: `home.spec.ts`, `stories.spec.ts`. Notes:

## 3. What to eat (`/eat`)

Goal: answer "what should I eat now" with one pick.

Must:
- Wish chips (quick, light, high protein, use what I have).
- One Best pick with picture and one action (Start cooking, or Add N to shopping plus Cook anyway), two other ideas.
- With Supabase the pick is written by AI ("Written for you", nutrition marked estimate); after 15 s or a failure, the rules pick from built-ins.
- Respects diet and foods to skip.

Test by hand:
- [ ] Set diet vegetarian in Profile: no meat suggested.
- [ ] Each chip changes the pick.
- [ ] Turn wifi off mid-load: a pick still appears.

Auto: `eat.spec.ts`. Notes:

## 4. Recipes (`/recipes`, `/recipes/[id]`)

Goal: the person's own saved recipes, and a page to cook from.

Must:
- List shows only saved recipes (Save button, or saved after cooking). Empty state at first. Filters and search.
- Detail: picture, servings stepper, pantry status per ingredient ("I have it"), gram weights in grey, steps, Start cooking.
- Edit: a built-in becomes the person's own copy; their own is edited in place.
- Ask AI (Supabase only): chips like "No onion", result is unsaved until bookmarked.

Test by hand:
- [ ] Save a recipe from Eat; it appears in Recipes.
- [ ] Change servings: amounts and weights scale.
- [ ] Edit a built-in, save: a copy appears, the original is unchanged.
- [ ] Ask AI "No onion": the new version has no onion.

Auto: `recipes.spec.ts`. Notes:

## 5. Cook (`/cook/[id]?servings=n`)

Goal: hands-busy cooking. One screen, actions not steps.

Must:
- Action strip (Wash, Chop, Boil...) always on screen; current in mint, done ones ticked.
- Card: animation, tasks that tick one by one, Look for, Tip, big timer on timed tasks, Meanwhile (what can run at the same time), Ask.
- Swipe or arrows move between actions; main button ticks and moves on; Finish on the last.
- Views: Ingredients (tick list with stand-ins), Recipe (whole recipe by part).
- Timer keeps true time when the phone sleeps; screen stays awake; optional voice ("next", "start timer").
- Finish: servings eaten (starts from the usual), logs the meal FIRST, then uses up the pantry. Works offline (queued).

Test by hand:
- [ ] Cook a real dish start to finish on the phone, propped on the counter.
- [ ] Lock the phone during a timer, unlock: time is right.
- [ ] Voice: "next" and "start timer" work hands-free.
- [ ] Ask: "what if I have no ginger" gives a stand-in from the recipe.
- [ ] Airplane mode at Finish: meal still appears on Home, syncs later.

Auto: `cook.spec.ts`. Notes:

## 6. Plan (`/plan`)

Goal: the week, one day at a time.

Must:
- Today open; day strip (arrows, Home/End) jumps to another day; "This week" card with averages and notes.
- Balanced / High protein switch rebuilds from today.
- Stored per account: the same week on phone, desktop and in chat.
- Respects diet and foods to skip; prefers what the pantry can cook.

Test by hand:
- [ ] Phone and desktop show the same week.
- [ ] Switch to High protein: protein average does not drop.
- [ ] Add a dislike in Profile: that dish leaves the plan.

Auto: `plan.spec.ts`. Notes:

## 7. Pantry (`/pantry`)

Goal: know what is at home, with little typing.

Must:
- One flat list, counts on top, plus and minus (stops at 0), running-low filter.
- Voice add: hear, confirm, then update.
- Add manually: tiles with select, search, Copy list, Email, Image, Add N to pantry.
- Cooking uses it up; buying fills it.

Test by hand:
- [ ] Say "I have 6 eggs and a litre of milk": both added after confirm.
- [ ] Cook a dish: used items go down.
- [ ] Add manually: pick 3, Copy list pastes correctly.

Auto: `pantry.spec.ts`. Notes:

## 8. Shopping (`/shopping`)

Goal: the list fills itself; shopping is one tap per item.

Must:
- Opening it adds what the next 3 days of meals need and the pantry lacks (once per visit). Not when the pantry is empty.
- Each row: name, amount with stepper (unit set by the app, not the person), tap to mark bought (green, then folds away).
- Brick bar counts shopped; tap it for the shopped list with Undo (kept 12 hours). Bought items go into the pantry.
- Type a line to add an item.
- Optional store (Walmart, Aldi, Costco) + ZIP: each row links to that store's search.

Test by hand:
- [ ] Open Shopping with a real pantry: the list makes sense for the plan.
- [ ] Tick an item, Undo: back on the list, pantry back.
- [ ] Type "dark chocolate", Add: it appears.
- [ ] Pick Walmart: the arrow opens a Walmart search for that item.
- [ ] Real trip: shop from the phone in the store.

Auto: `shopping.spec.ts`. Notes:

## 9. Chores (`/chores`)

Goal: personal chores that repeat.

Must:
- Add (daily, weekly on a day, once), tick done today, untick, remove.
- Due today ones show as stories on Home (Start doing timer, Mark complete, Undo).

Test by hand:
- [ ] Add a weekly chore today: due today, not tomorrow, due again next week.

Auto: `chores.spec.ts`. Notes:

## 10. Camera and voice capture, meal photo (`/photo`)

Goal: log a meal without typing.

Must:
- Camera button opens the sheet: Camera (meal only; shelf and receipt disabled) and Voice tabs.
- Photo flow: detect (include or leave out items, add a missed one), estimate (kcal plus-minus 12%, macros, amounts), log with Undo.
- Says clearly it is an example until a vision model exists.

Test by hand:
- [ ] Take a real photo on the phone; flow reaches Logged; Undo works.

Auto: `capture.spec.ts`. Notes:

## 11. History (`/history`) and Profile (`/profile`)

Must:
- History: month calendar, Monday first, dish pictures per day, tint in or out of range, tap a day for its meals; no future months.
- Profile: account, diet, calorie range, foods to skip; saved to the account.

Test by hand:
- [ ] After a week of logging, the calendar matches what you ate.
- [ ] Change calorie range: Home chart range and History tints follow.

Auto: `history.spec.ts`, `profile.spec.ts`. Notes:

## 12. Shell (both)

Must:
- Phone: bottom bar Today, Food, camera, Kitchen, Chores; Profile from the Home header.
- Desktop: sidebar with the same sections; Cmd/Ctrl+K jumps to the 8 main screens.
- Food and Kitchen pages have a pill switch at the top.

Auto: `shell.spec.ts`, `command-menu.spec.ts`, `design-system.spec.ts`. Notes:

## 13. Claude and ChatGPT connector (`/mcp`)

Goal: the same account from Claude or ChatGPT; same answers as the app.

Must:
- Sign in through the consent screen; every tool runs as that person.
- One question, one tool, one card (today_next, what_to_eat, eat_next, week_plan, week_shopping, shopping_list, my_targets).
- Changes made in chat show in the open app within about a second (Supabase Realtime, migration 0015).

Test by hand:
- [ ] Add the connector in Claude, sign in once end to end.
- [ ] Ask "what should I eat", "log dal for lunch": the app shows the log.
- [ ] Ask "what's my plan this week": same week as the Plan screen.

Auto: none end to end (needs a real sign-in). Planned: a 100-question routing test (see NEXT.md). Notes:

## 14. AI week plan (planned, decided 2026-11-25)

Goal: one week planned around cook sessions, so one thing cooked feeds several meals (chicken tikka -> butter chicken with the same base -> paneer butter masala), with one shopping list.

Decided:
- Ask, then one plan: a small card asks the aim (Least effort, Cheapest, Healthiest, Balanced), which days you cook, how many people. One AI call, one plan.
- Both doors: in the app OpenAI writes it (edge function); in Claude or ChatGPT the person's assistant writes it with a plan tool. Same check, same storage (`meal_plans`).
- One week at a time, with "Plan next week" and "Repeat this week".

Must:
- Plan has two layers: cook sessions (day, what is made, portions) and meals (day, slot, recipe, which session it uses).
- Checked before it is shown: each day inside the calorie range, protein toward the goal, diet and foods to skip, cooked food eaten within 3 days (fridge) unless marked frozen.
- Shopping list for the whole week minus the pantry (`week_shopping`).
- "Cheapest" means fewer distinct ingredients and more reuse: there are no real store prices.
- AI fails or is slow -> today's rule planner (`planWeek`) fills the week; the Plan page is never empty.
- Made once, then kept: the stored plan is read, never rebuilt on its own (not on opening Plan, not on another device, not in chat). It changes only when the person asks: swap one meal, Plan next week, Repeat this week, or Redo. If diet or foods to skip change, the meals that no longer fit are flagged with a Swap button, not silently replaced.
- Groceries from the kept plan: one tap puts the whole week on the shopping list (minus the pantry); buying fills the pantry, so later checks know it is at home.

Test by hand:
- [ ] Least effort with 2 cook days: no day asks for more than one session.
- [ ] Every session is used by at least two meals.
- [ ] The shopping list has no item twice and nothing the pantry already has.

Notes:

---

## Next to build (from NEXT.md)

Live refresh is built and migration 0015 is applied. Test it: open the app on desktop, log a meal from Claude, the chart moves within a second or two without a reload.

Next: fill the Notes under each screen while testing; those become the next builds.

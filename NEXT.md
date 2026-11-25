# What is next (saved 2026-11-23)

Plan of record. Edit as things ship. Product feel: the app decides and makes the next step one tap; sleek, pastel selection, no big circles.

## Just built (2026-11-24)
- Chat dock on Home (rule router, see CLAUDE.md "Chat dock"); chart sits right under the next meal.
- Gram weights on ingredients (dry / soaked / canned), recipe page and cook checklist.
- Minimal cook screen: step text and timer in the centre, small verb loop, Tip on tap.
- Real chat built (2026-11-24): model in edge function `chat`, tools run in the app (CLAUDE.md "Chat dock"). Needs `supabase functions deploy chat`.
- Next: chat on every screen, fill the empty space on short cook steps, more foods in the weight table, weights in shopping and ask answers.

## Just built (2026-11-23)
- Stories: one "Eat next" story (no meal names), chosen by the clock (`eatNextIndex`), with Start cooking / Add N to shopping and Mark eaten; a "Prep" story with tickable jobs (`prepTasks`: soak tonight, set overnight oats, marinate now). Home's Up next uses the same clock rule.
- Week plan is always built and keeps to the profile's diet and dislikes (`fitsPrefs`), preferring dishes the pantry can cook (pantry snapshotted once per visit).
- Positioning (user, 2026-11-23): personal first, then multi-user. The unique part is the household loop: plan + calorie tracking + cook together + chores. Competitors: Honeydew, Deglaze (has an MCP server), CookNest (recipe savers); Eat This Much, MyFitnessPal, FoodNoms (has MCP) (plan + tracking); Cozi, FamilyWall (family lists, no nutrition or cooking).

## Just built (2026-11-22)
- Chore stories: one story per chore for today (due or done today), after the meal stories. "Start doing" starts a timer and holds the slide, "Mark complete" ticks it, Undo after. Feed events reuse `open` (start) and `mark-eaten` (complete) because `feed_events.action` has a fixed check; add real `start`/`complete` actions with a migration if wanted.
- Sign out for guests too (Profile), with a confirm because a guest cannot get back in.
- Shopping: brick progress bar (one brick per item, fills as you shop; tap it for the shopped list). Old header chip removed.
- Cook screen: the timer is a small card at the top right of the animation tile.

## Just built / building
- Profile (`/profile`): diet, calorie range, dislikes, account (Google sign-in / sign out).
- "I need to eat something" (`/eat`): ranks recipes by pantry, calories left, time of day, diet, dislikes, and a typed wish ("quick", "light", "protein").
- Login: `/signin` (Google + guest) already works once the dashboard setup below is done.

## You do (dashboards, I cannot)
- ChatGPT / Claude connector (built 2026-11-23, see CLAUDE.md "Connector"):
  a. Apply migration `0010_chat_meal_source.sql` (`supabase db push`), or chat logs fail the `source` check.
  b. Supabase > Authentication > OAuth Server: enable it, Authorization Path `/oauth/consent`, allow dynamic client registration. Site URL must be where the app runs (consent page = Site URL + path).
  c. A public HTTPS URL for the app (deploy to Vercel, or a tunnel to localhost:3000). ChatGPT and claude.ai call `/mcp` from their servers, so localhost only works for Claude Code / Claude Desktop.
  d. Add the connector: Claude > Settings > Connectors > Add custom connector, URL `<app>/mcp`. ChatGPT > Settings > Connectors (developer mode on), same URL.
- Written meals (built 2026-11-23): apply migration `0011_my_recipes.sql` and deploy the edge function `write-recipe` (uses the existing `OPENAI_API_KEY`). Until then Eat falls back to the built-in recipes and Save does nothing.
  e. Untested end to end: no real OAuth sign-in has run yet. The 2026 MCP spec prefers client metadata documents over dynamic registration; if a client fails to register, check whether Supabase supports that yet.
1. Google sign-in: Google Cloud OAuth client (redirect `https://idfkhfkxspbxxfeilsar.supabase.co/auth/v1/callback`), then Supabase Auth: Google provider on, "Allow manual linking" on, add `http://localhost:3000/**` to Redirect URLs.
2. Revoke the Supabase access token that was pasted in chat (Account > Access Tokens).
3. `.env` line 3 is not `KEY=value`: it breaks the Supabase CLI. Name it or delete it.

## Done on production
- Live 2026-11-24: app on Vercel at https://nutriflow-neon.vercel.app (env `NEXT_PUBLIC_APP_URL` set; `.vercelignore` keeps `.env*` out of uploads). Migrations 0001 to 0014 applied; all edge functions deployed incl. `chat`, `adapt-recipe`, `write-recipe`. Left: Supabase OAuth server on, Site URL, connector added, one real sign-in.
- Migrations 0001 to 0009 are applied; edge functions `parse-pantry-utterance`, `suggest-buy-units`, `text-search`, `text-index` are deployed; secrets `OPENAI_API_KEY`, `INDEX_SECRET` are set.

## NEXT: two front doors, one brain (planned 2026-11-23)
The user picks how to use NutriFlow: the app (phone feed + desktop dashboard), Claude (connector), or ChatGPT (app). Same account, same data, same answers. Personal only for now.

Rule: every use case lives once in `domain` (mostly `domain/assistant`); the app's view-models and the MCP tools both call it. Nothing an answer depends on may live only in the browser or be computed differently per door.

Steps, in order:
1. Go live first (blocks everything): commit; apply `0010`, `0011`; deploy `write-recipe`; deploy the app to a public HTTPS URL (Vercel); Supabase OAuth server on (see "You do"); add the connector in Claude and ChatGPT and run one real sign-in end to end.
2. DONE 2026-11-23 (needs migration 0012 applied). One plan for both doors: the week plan is computed in the browser today (`usePlanData`), from a pantry snapshot, so chat could get a different week. Store it: table `meal_plans` (user, date, meal, recipe_id; RLS + grant), built by `planWeek` when a day is missing, rebuilt only when asked ("redo my week") or when diet/dislikes change. App and MCP both read the stored plan.
3. DONE 2026-11-23 (needs migrations 0013, 0014 applied). Move browser-only state the chat must see into the account: prep ticks (`nutriflow.prepDone`), shopping prefs and bought history. Stories seen, likes and feed events can stay local.
4. Tool parity (MCP has 14 tools today: today, log_meal, undo_log, what_to_eat, find_recipes, recipe, pantry, add_to_pantry, shopping_list, add_to_shopping_list, mark_bought, chores_today, set_chore_done, add_chore). Added 2026-11-23: `eat_next`, `prep_today`, `set_prep_done`, `week_plan`. Added 2026-11-24: `swap_meal`, `profile`, `set_profile` (`keep_recipe` already covers save). Still to add: `cooked` (log + use up pantry, like the Finish screen). `what_to_eat` should use the AI writer (`whatToEat`) with the rules fallback, same as `/eat`. Every tool keeps taking the person's local `date` (and now `hour`).
5. DONE (cards in `composition/mcpCards.ts`: eat_next, week_plan, shopping, today, week_shopping, meal ideas, profile). Was: UI in chat: MCP Apps cards (Claude; `ui://` resource, `text/html;profile=mcp-app`, `_meta.ui.resourceUri`) for `eat_next` (dish picture + one main button), `week_plan` (7-day strip), `shopping_list` (tick to buy). ChatGPT: check if it renders MCP Apps; if not, the Apps SDK widget with the same HTML. Every tool still returns plain JSON text, so a client without UI works.
6. Pick your door: a "Use with Claude or ChatGPT" screen (from Profile and the sidebar): the connector URL with a copy button, three steps per assistant, and "Connected" once a token from that client has been used. NOT on the Design canvas: ask before building, or build from the design system on the user's say-so.
7. DONE 2026-11-25 (migration 0015 applied): `data/live/watch.ts` refetches on Supabase Realtime changes. Was: The dashboard shows chat changes without a reload: refetch on focus already happens; add Supabase Realtime on meal logs, pantry, shopping and chores so a meal logged in ChatGPT moves the chart while the app is open.
8. Then multi-user (item 9 below).

Open questions for the user: should the Claude/ChatGPT doors be free or paid; should the chat be able to change the plan without confirming.

## Next builds (in order)
- AI week plan around cook sessions: see docs/features.md section 14 (decided 2026-11-25).
- Connector routing test (later): about 100 real questions ("do I have a plan", "what did I eat", "add milk", "how long to boil eggs"...), each with the expected answer (which card tool, which action tool, plain text, or a question back). A script sends each one to a model with the real tool list and INSTRUCTIONS and scores: right tool, one call only, no extra profile or pantry calls. Run it after every change to INSTRUCTIONS or a tool description.
- Connector cards: what_to_eat tiles expand (image, name, kcal, time, ingredients, Pick this on every tile); log_meal toast with Undo that folds to one line.
-1. Recipe art: put originals (white background, named `<slug>.jpeg`) in `art-src/recipes/` (gitignored), run `node scripts/prepare-recipe-images.mjs` (cuts the white out, 512px webp, about 30 KB each into `public/recipes/`), then add the slug to `WITH_IMAGE` in `src/data/recipes/demo.ts` and add the recipe. 10 breakfast recipes are done. `RecipeArt` shows the image on the recipe tint, else the drawn bowl. Then move images to Supabase Storage with an `image_url` column.
0. Unknown dishes (decided 2026-11-22): the user does not search. Voice ask -> look at the pantry -> own recipe first; if none fits, the LLM writes one (our format, our 14 animation verbs; macros marked estimated). Image: image search API (Brave Search images, free tier, or Serper) for the dish name, in an edge function; show the first result by URL with "Photo from site.com", never copy or store the file, drawn bowl if it fails to load; own card style so it reads as external. Save recipe + image URL to a `recipes` table once per dish. Needs Supabase secret `SEARCH_API_KEY`. Dishes asked for often get our own illustration later.
0. Recipes: 148 to cover, list and image prompts in `docs/recipe-images.md` (you generate images over 2 days; then each needs steps, ingredients, `image_url`). Review the list first.
0. Cook loops: Serve now plates the recipe's own picture (drops onto the tint, steam, sparkles), also on the Finish screen; recipes without a picture keep the drawn mound.
0b. Tests: done 2026-11-23 (chore story e2e, brick bar checks, stale "eaten"->"done" story labels, breakfast 450 kcal). Mobile "tapping the chart on touch" passes again (5 of 5, 2026-11-25).
0c. Shopping bricks: on long lists (15+) the bricks get thin; cap or switch to a continuous fill. Unfilled brick colour is `line2`.
1. Stories: each story is a friend or a task, opens like a story, asks for input. Open questions: what is a "friend" story in a personal-only v1; what input does a task story ask for (tap, number, photo)?
2. Chores on Home (new feed kind + migration widening `feed_events.kind`).
3. DONE (c75df94): manual add on the shopping list (one input line, e2e "add an item by typing it").
4. Real data: dashboard history and recipes from Supabase instead of demo; ingredient-level nutrition table.
5. Vision model for the photo flow (`MealDetector`), then Pantry shelf and Receipt capture.
6. Store carts: Instacart Developer Platform link (needs a developer key), Walmart add-to-cart link (needs real Walmart item ids from a product search).
7. Vector DB next steps: richer recipe text, index the cooking guide and foods, search the pantry by meaning, and more `kind`s.
8. Use AI for the "what should I eat" answer wording and cooking guide (OpenAI key is in Supabase secrets; `suggest-buy-units` is the pattern).
9. Roommates group (later): household, shared chores, cook together, expenses. Needs `household_id` on chores, pantry, shopping first. Plan is personal AND group (decided 2026-11-23): the household shares one plan and cooks together, but every person logs what they ate themselves (3 people eat dinner = 3 logs, each with their own servings, like the Finish screen already asks).

## Known gaps
- Recipe units like "3 cups milk" are turned into buy amounts by the model only when Supabase is on.
- Shopping history (12h) and shopping prefs live in the browser, not the account.
- No sign-out or way back to `/signin` for guests except the Profile screen (new).

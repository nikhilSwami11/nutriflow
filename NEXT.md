# What is next (saved 2026-11-22)

Plan of record. Edit as things ship. Product feel: the app decides and makes the next step one tap; sleek, pastel selection, no big circles.

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
1. Google sign-in: Google Cloud OAuth client (redirect `https://idfkhfkxspbxxfeilsar.supabase.co/auth/v1/callback`), then Supabase Auth: Google provider on, "Allow manual linking" on, add `http://localhost:3000/**` to Redirect URLs.
2. Revoke the Supabase access token that was pasted in chat (Account > Access Tokens).
3. `.env` line 3 is not `KEY=value`: it breaks the Supabase CLI. Name it or delete it.

## Done on production
- Migrations 0001 to 0009 are applied; edge functions `parse-pantry-utterance`, `suggest-buy-units`, `text-search`, `text-index` are deployed; secrets `OPENAI_API_KEY`, `INDEX_SECRET` are set.

## Next builds (in order)
0. Cook "Serve" loop: 16 steps use verb Serve and have no animation (static bowl). Draw a plated dish in the recipe's `tint` with steam and a garnish drop, use it on Serve steps and on the Finish screen. Later add Boil, Bake, Whisk, Fry loops.
0b. Tests: e2e for chore stories and the shopping bricks; run the shopping, cook and design-system specs (stop `next dev` on 3000 first). `tests/e2e/stories.spec.ts` may need counts updated for chore stories.
0c. Shopping bricks: on long lists (15+) the bricks get thin; cap or switch to a continuous fill. Unfilled brick colour is `line2`.
0d. `scripts/index-recipes.ts` has a typecheck error (header `x-index-secret` can be undefined).
1. Stories: each story is a friend or a task, opens like a story, asks for input. Open questions: what is a "friend" story in a personal-only v1; what input does a task story ask for (tap, number, photo)?
2. Chores on Home (new feed kind + migration widening `feed_events.kind`).
3. Manual add on the shopping list (one input line).
4. Real data: dashboard history and recipes from Supabase instead of demo; ingredient-level nutrition table.
5. Vision model for the photo flow (`MealDetector`), then Pantry shelf and Receipt capture.
6. Store carts: Instacart Developer Platform link (needs a developer key), Walmart add-to-cart link (needs real Walmart item ids from a product search).
7. Vector DB next steps: richer recipe text, index the cooking guide and foods, search the pantry by meaning, and more `kind`s.
8. Use AI for the "what should I eat" answer wording and cooking guide (OpenAI key is in Supabase secrets; `suggest-buy-units` is the pattern).
9. Roommates group (later): household, shared chores, cook together, expenses. Needs `household_id` on chores, pantry, shopping first.

## Known gaps
- Recipe units like "3 cups milk" are turned into buy amounts by the model only when Supabase is on.
- Shopping history (12h) and shopping prefs live in the browser, not the account.
- No sign-out or way back to `/signin` for guests except the Profile screen (new).

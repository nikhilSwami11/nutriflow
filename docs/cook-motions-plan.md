# Plan: 10 more cooking-step animations

Goal: every step verb in the demo recipes gets a loop, so no cook step falls back to the static bowl.

## Today
- 4 loops in `src/presentation/cook/CookMotion.tsx` (Chop, Stir, Simmer, Sauté; Mix reuses Stir). CSS in `src/app/cook-motions.css`, every rule scoped under `.cook-motion`.
- How often each verb is used in `src/data/recipes/demo.ts`: Serve 32, Mix 30, Sauté 27, Chop 21, Stir 20, Simmer 14, Toast 3, Bake 3, Chill 1, Blend 1. Serve, Toast, Bake, Chill and Blend have no loop.
- Several steps are tagged with a near verb because no better one existed. For example, "Whisk the eggs" is tagged Mix, "Fry the eggs" Sauté, "Boil the pasta" Simmer, "Mash the bananas" Mix, and "Grate the zucchini" Chop.

## The 10 new loops

The style must match the existing four:
- `viewBox="0 0 200 200"`, `width="100%"`, and `style={{ display: "block", color: "var(--ink)" }}`.
- Outlines use `stroke="currentColor"` at 2.2 to 2.5 width, with round caps and joins.
- Fills are the pastel hexes already in use: butter `#F4E3A1`, rose `#F2A3A9`, peach `#F7C9BB`, mint `#8FD3C0`, sky `#9EC8F3` and lavender `#B9A7EE`. Neutral surfaces use `var(--panel)` and `var(--bg)`.
- Each loop has a soft floor shadow: an `ellipse` with `opacity=".06"`.
- Each loop has an `aria-label` that says what it shows, for example "Whisk beating eggs in a bowl".
- Loops last 0.8 to 2.4 seconds and run `infinite`.
- Class names are short and prefixed per loop, as Chop uses `ch-`. Use `sv- bk- ts- bl- cl- wh- fr- bo- ms- gr-`.
- Each loop's frame at 0% must read clearly as a still picture, because reduced motion stops every animation. Effect-only parts (sparks, bubbles, frost, steam) go in the existing reduced-motion rule as `opacity:0`.
- `.wisp` steam is reusable: the `wisp w1` and `wisp w2` classes already animate.

| # | Verb | Picture | Motion |
|---|------|---------|--------|
| 1 | Serve | A plate on the table, a spoon above it, and a mound of food in the recipe tint | The spoon tips and the mound drops in with a small squash and settle. A garnish leaf (mint) falls on top, then two steam wisps rise. About 2.2s. |
| 2 | Bake | An oven front with a glass window and a loaf (peach) inside | The loaf rises slowly (scaleY from the base, 0.85 to 1). The window glow (butter rect) pulses its opacity, and short heat lines move up over the oven. About 2.4s. |
| 3 | Toast | A toaster (sky) with two slices of bread (butter) in its slots | Both slices sit low, then pop up with a small overshoot, then drop back. The lever moves down while they are in. About 1.8s. |
| 4 | Blend | A blender jar on its base, with liquid inside (rose) | The liquid's top swirls (reuse the `.swirl` rotate in a flattened group, as Stir does). The jar shakes a little (±1.5px translateX). The blade rotates fast. About 0.9s. |
| 5 | Chill | An open fridge shelf, or a jar with a lid, with cold lines | 3 snowflake or frost dots (sky) drift down and fade. The jar gives a tiny shiver. It is a calm, slow loop, about 2.4s. |
| 6 | Whisk | A bowl with a whisk in it (balloon wires drawn as 3 to 4 paths) | The whisk swings left and right quickly, rotating about ±14deg around its handle top. Small bubbles (white circles) pop at the surface. About 0.6s alternate. |
| 7 | Fry | A shallow pan with oil, and an egg (white with a butter yolk) | The oil bubbles scale up and fade. Spatter dots jump out of the pan. Sizzle marks (like Sauté's `.zz`) flash. The pan stays still. About 1.2s. |
| 8 | Boil | An open pot on a flame (reuse Simmer's flame shapes and `.fl` classes) | Big bubbles rise from the bottom of the water, then pop at the top, with three staggered delays. The water line wobbles. Steam uses `wisp`. It is faster and rougher than Simmer, about 1.4s. |
| 9 | Mash | A bowl of potato or banana (butter) with a masher | The masher presses down. The food squashes (scaleY 1 to 0.8 from the bottom of the bowl, then back). Two small chunks pop up at the sides. About 1.2s. |
| 10 | Grate | A box grater standing on a board, with a block (peach, like the carrot in Chop) | The block slides down and up the grater face. Shreds (thin peach strokes) fall and pile at the base, then fade. About 1s. |

## Code changes
1. `src/presentation/cook/CookMotion.tsx`
   - Add the 10 loop components.
   - Extend `BY_VERB` with `Serve`, `Bake`, `Toast`, `Blend`, `Chill`, `Whisk`, `Fry`, `Boil`, `Mash` and `Grate`. Keep `Mix: Stir`. Map `Knead: Mash` and `Roll: Mash`, which are good enough for now.
   - Serve takes the recipe tint. Change the signature to `CookMotion({ verb, tint }: { verb: string; tint?: string })`, then pass `tint` to Serve. Its default is `#F4E3A1`.
   - Update the file's first comment: the file now has 14 loops.
2. `src/presentation/cook/CookScreen.tsx`: change the call to `<CookMotion verb={s.verb} tint={c.recipe.tint} />`. If `CookModel.recipe` lacks `tint`, read it the way the screen already reads `c.recipe.name`.
3. `src/app/cook-motions.css`:
   - Add the keyframes and rules, all under `.cook-motion`.
   - Use `transform-box:fill-box;transform-origin:center` only where a part rotates or scales about its own centre (as `.swirl` and `.rot` do). Otherwise set an explicit `transform-origin` in px.
   - Add the new effect classes to the `prefers-reduced-motion` rule's `opacity:0` list.
4. `src/domain/guide/generic.ts`: add `VERB_GUIDE` entries (look + tip, plain words, one sentence each) for Bake, Toast, Blend, Chill, Whisk, Fry, Boil, Mash, Grate, Knead and Roll.
5. `src/domain/guide/guide.test.ts:25` uses `"Whisk"` as the example of an unknown verb. Change it to a verb that stays unknown, for example `"Flambé"`.
6. `src/data/recipes/demo.ts`: retag steps whose text starts with the verb.
   - "Whisk ..." becomes Whisk.
   - "Mash ..." becomes Mash, including "Mash and stir in the tomatoes".
   - "Grate ..." becomes Grate.
   - "Fry ..." becomes Fry.
   - "Boil ..." becomes Boil. Keep the time for "Boil the dal until soft": the `st` helper only defaults minutes for Simmer, so pass `10` explicitly.
   - "Knead ..." becomes Knead.
   - Only change the verb argument. Do not change the text, minutes or anything else.

## Checks
- `npm run typecheck` (the known `scripts/index-recipes.ts` error is pre-existing), `npm run lint`, and `npm test`. The demo test "every step has something to look for and a tip" must still pass.
- Do not run e2e: the user's `next dev` holds port 3000.
- Optional visual check: a scratch HTML page or Playwright screenshot of `/cook/<id>` against the running dev server on 3000, stepping to each verb. Do not start a second dev server.

## Out of scope
- The Finish-screen dish.
- Parametric "food engine" colours per dish.
- Any UI change beyond the tint prop.

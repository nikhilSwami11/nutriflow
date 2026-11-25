import { createMcpHandler, getPublicOrigin, metadataCorsOptionsRequestHandler, protectedResourceHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { CARD_MIME, EAT_NEXT_URI, SHOPPING_URI, TODAY_URI, WEEK_PLAN_URI, WEEK_SHOP_URI, MEALS_URI, mealStoriesHtml, PROFILE_URI, profileHtml, cardMeta, eatNextHtml, shoppingHtml, todayHtml, weekPlanHtml, weekShoppingHtml } from "./mcpCards";
import { clientForToken, verifyAccessToken } from "@/data/auth/token";
import { SupabaseChoreRepository } from "@/data/chores/supabase";
import { SupabaseMealPlanRepository } from "@/data/planning/supabase";
import { SupabasePrepDoneRepository } from "@/data/planning/prep";
import { SupabaseMealLogRepository, SupabaseProfileRepository } from "@/data/nutrition/supabase";
import { SupabasePantryRepository, SupabaseShoppingListRepository } from "@/data/pantry/supabase";
import { DemoRecipeRepository } from "@/data/recipes/demo";
import { SupabaseServingHabitRepository } from "@/data/cooking/habits";
import { CombinedRecipeRepository, SupabaseMyRecipeRepository } from "@/data/recipes/mine";
import * as A from "@/domain/assistant";
import { toDateKey } from "@/domain/nutrition";
import { COOK_VERBS } from "@/domain/recipes";
import { SHOP_UNIT_IDS } from "@/domain/pantry/types";

// The ChatGPT / Claude connector: an MCP server over the same use cases the app uses, as the signed-in person.
// Sign-in is Supabase Auth's OAuth 2.1 server (beta); the consent screen is /oauth/consent in this app.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Supabase Auth is the authorization server; its issuer is the project's /auth/v1. */
const ISSUER = `${URL}/auth/v1`;

const depsFor = (token: string): A.AssistantDeps => {
  const db = clientForToken(URL, KEY, token);
  const mine = new SupabaseMyRecipeRepository(db);
  return {
    logs: new SupabaseMealLogRepository(db),
    profile: new SupabaseProfileRepository(db),
    pantry: new SupabasePantryRepository(db),
    list: new SupabaseShoppingListRepository(db),
    chores: new SupabaseChoreRepository(db),
    plans: new SupabaseMealPlanRepository(db),
    prep: new SupabasePrepDoneRepository(db),
    habits: new SupabaseServingHabitRepository(db),
    // No writer here: in the connector the person's own Claude or ChatGPT writes dishes (write_recipe), on their tokens.
    recipes: new CombinedRecipeRepository(new DemoRecipeRepository(), mine),
    mine,
    newId: () => crypto.randomUUID(),
  };
};

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .optional()
  .describe("The person's local date, YYYY-MM-DD. Pass it: the server's clock may be in another time zone.");
const slot = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const meal = z.enum(["Breakfast", "Lunch", "Snack", "Dinner"]);
const dayOf = (d?: string) => d ?? toDateKey(new Date());

const INSTRUCTIONS = `NutriFlow is one person's food loop: what they ate, their pantry, shopping list, recipes and chores.
ONE CALL, ONE CARD. Simple questions are answered by exactly one tool, with no other calls before or after:
- today, how am I doing, insights, what next, what should I do -> today_next
- what to eat, what can I cook (now / with what I have) , meal or recipe ideas -> what_to_eat
- my next meal -> eat_next
- my plan, this week's meals -> week_plan
- what to buy (this week, for the plan) -> week_shopping
- my shopping list -> shopping_list
- calorie target, range, goal, diet -> my_targets
Do not check profile or pantry first for these; the tool already uses them. The card is the answer: one short line at most.
Log only what the person says they ate, for themselves. If several people ate, each logs their own in their own account.
Prefer a recipe id (find_recipes) so calories come from the recipe. For anything else give your best kcal estimate and say it is an estimate.
Always pass the person's local date. Keep answers short: the next step, not a report.
For ANY question about today (how am I doing, insights, summary, what next, what should I do) call today_next ONCE and nothing else: its card shows calories against the range and the few things that matter, and asks and saves in place. Do not call other tools to build a report.
For what to buy (this week, for the plan) call week_shopping ONCE; never sum recipes yourself.
Answer with one tool when one tool answers it; reach for several only when the person asks for something that needs them.
Never write reports. Never mention empty or zero things (no chores, nothing due, 0 g protein) and never comment on how little they log.
When a tool shows a card, the card is the answer: add at most one short line. Never paste links or ids. Never search the web for photos and never build your own page, widget or cooking session; use the tools and their cards.
When the person wants a recipe, write it yourself with write_recipe, show it, and keep_recipe only if they like it. Make it adaptive: use profile (diet, foods to skip) and pantry, and adapt an existing recipe by writing a new version with basedOn. Write it like a cook: salt and a cooking fat with amounts, aromatics (onion, garlic, ginger), spices with amounts added in the right order (whole spices into hot oil first, then aromatics, then ground spices, then liquid), and a last step that tastes and balances salt, sourness, heat and sweetness. Check profile first for diet and foods to skip.`;

type Ctx = { http?: { authInfo?: { token: string } } };
type Out = { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

/** Runs a use case as the caller and returns its result as JSON text; a thrown error becomes a readable tool error. */
// Said first in the text of every tool with a card: the person already sees the answer, so the chat must not repeat it.
export const CARD_NOTE = "SHOWN TO THE PERSON IN A CARD. Do not repeat, list, tabulate or summarise it. Reply with one short line at most (or nothing), e.g. an offer of the next step. Data for follow-ups:";

/** Runs a use case as the caller. `card`: the answer is drawn in a card, so the text tells the chat not to repeat it. */
const run = <I>(fn: (deps: A.AssistantDeps, input: I) => Promise<unknown>, card = false) =>
  async (input: I, ctx: Ctx): Promise<Out> => {
    const token = ctx.http?.authInfo?.token;
    if (!token) return { isError: true, content: [{ type: "text", text: "Not signed in." }] };
    try {
      const result = await fn(depsFor(token), input);
      // Cards read structuredContent; it must be an object, so a list goes in as { items }.
      const data = Array.isArray(result) ? { items: result } : result;
      const structured = data && typeof data === "object" ? { structuredContent: data as Record<string, unknown> } : {};
      const text = JSON.stringify(result ?? { ok: true });
      return { content: [{ type: "text", text: card ? `${CARD_NOTE} ${text}` : text }], ...structured };
    } catch (e) {
      return { isError: true, content: [{ type: "text", text: e instanceof Error ? e.message : "Something went wrong." }] };
    }
  };

const read = { readOnlyHint: true, openWorldHint: false };
const write = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };

/** Exported for the tool-list test; the app serves only `mcpHandler`. */
export const mcp = createMcpHandler(
  (server) => {
    server.registerTool("today", {
      title: "Today so far",
      description: "Raw numbers for one day: meals logged, calories against the range, macros. For questions about today, use today_next instead.",
      inputSchema: z.object({ date }), annotations: read,
    }, run((d, i) => A.daySummary(d, dayOf(i.date))));

    server.registerTool("log_meal", {
      title: "Log a meal",
      description: "Log what the person ate. Use recipe_id and servings for a NutriFlow recipe, else name and kcal (your estimate is fine).",
      inputSchema: z.object({
        date, slot,
        recipe_id: z.string().optional(),
        servings: z.number().positive().max(20).optional().describe("Servings this person ate; default 1"),
        name: z.string().max(120).optional(),
        kcal: z.number().min(0).max(10000).optional(),
        protein: z.number().min(0).max(1000).optional(),
        carbs: z.number().min(0).max(2000).optional(),
        fat: z.number().min(0).max(1000).optional(),
      }),
      annotations: write,
    }, run((d, i) => A.logEaten(d, { ...i, date: dayOf(i.date), recipeId: i.recipe_id })));

    server.registerTool("undo_log", {
      title: "Remove a logged meal",
      description: "Remove one logged meal by its id (from today or log_meal).",
      inputSchema: z.object({ id: z.string() }), annotations: { ...write, destructiveHint: true },
    }, run(async (d, i) => (await A.removeLog(d, i.id), { removed: i.id })));

    server.registerResource("meal-stories-card", MEALS_URI, { title: "Meal ideas", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: mealStoriesHtml(), _meta: cardMeta() }],
    }));

    server.registerTool("what_to_eat", {
      title: "What should I eat?",
      _meta: { ui: { resourceUri: MEALS_URI }, "ui/resourceUri": MEALS_URI },
      description: "Use for what to eat, what can I cook, or recipe ideas. Instant: picks from the person's recipes by pantry, diet, dislikes, calories left and time of day, shown as swipeable stories. For 'what can I cook now', 'with what I have' or 'from my pantry' ALWAYS pass wish 'use what I have'. If they want something new or none fit, write it yourself with write_recipe from forWriting (diet, dislikes, pantry, kcalLeft; with 'use what I have' only pantry items plus salt, oil, water and spices).",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23"), wish: z.string().max(200).optional().describe("quick, light, high protein, use what I have; or the person's own words") }),
      annotations: write,
    }, run((d, i) => A.whatToEatNow(d, { date: dayOf(i.date), hour: i.hour, wish: i.wish }), true));

    server.registerTool("cooked", {
      title: "I cooked it",
      description: "The person cooked and ate a NutriFlow recipe: logs the meal, uses up what it took from the pantry and learns their usual serving size. Leave servings_eaten out to use their usual. Prefer this over log_meal when they cooked a recipe from the app.",
      inputSchema: z.object({
        date, recipe_id: z.string().max(80),
        servings_made: z.number().positive().max(20).optional().describe("How many servings the pot made; default the recipe's"),
        servings_eaten: z.number().positive().max(20).optional().describe("Servings this person ate; default their usual"),
      }), annotations: write,
    }, run((d, i) => A.cooked(d, { date: dayOf(i.date), recipeId: i.recipe_id, servingsMade: i.servings_made, servingsEaten: i.servings_eaten })));

    server.registerResource("eat-next-card", EAT_NEXT_URI, { title: "Eat next card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: eatNextHtml(), _meta: cardMeta() }],
    }));

    server.registerResource("week-plan-card", WEEK_PLAN_URI, { title: "Week plan card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: weekPlanHtml(), _meta: cardMeta() }],
    }));
    server.registerResource("shopping-card", SHOPPING_URI, { title: "Shopping list card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: shoppingHtml(), _meta: cardMeta() }],
    }));

    server.registerResource("today-card", TODAY_URI, { title: "Today card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: todayHtml(), _meta: cardMeta() }],
    }));

    server.registerResource("week-shopping-card", WEEK_SHOP_URI, { title: "Week shopping card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: weekShoppingHtml(), _meta: cardMeta() }],
    }));

    server.registerTool("week_shopping", {
      title: "What to buy for the week",
      _meta: { ui: { resourceUri: WEEK_SHOP_URI }, "ui/resourceUri": WEEK_SHOP_URI },
      description: "Use for any question about what to buy for the week or the plan. One call: everything the week's plan needs that the pantry lacks and the list does not have yet, with amounts. Its card lets the person untick what they have and add the rest. Do not read recipes or the pantry yourself to work this out.",
      inputSchema: z.object({ date }), annotations: read,
    }, run((d, i) => A.weekShopping(d, dayOf(i.date)), true));

    server.registerTool("today_next", {
      title: "What to do next",
      _meta: { ui: { resourceUri: TODAY_URI }, "ui/resourceUri": TODAY_URI },
      description: "Use for any question about the person's day (insights, how am I doing, what next). Shows calories against their range, then the few things that matter right now, at most four: set up the profile (first use only), the next meal (with what to check they have), prep due, chores due, the shopping list. Empty parts are left out: do not mention them. The card asks and saves in place (I have it, Mark eaten, Done).",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23") }), annotations: read,
    }, run((d, i) => A.todayNext(d, { date: dayOf(i.date), hour: i.hour }), true));

    server.registerTool("eat_next", {
      title: "Eat next",
      _meta: { ui: { resourceUri: EAT_NEXT_URI }, "ui/resourceUri": EAT_NEXT_URI },
      description: "The one planned meal to eat next by the person's clock, what to buy, swap or skip to cook it, and the rest of today. Same answer as the app's Home.",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23") }), annotations: read,
    }, run((d, i) => A.eatNextNow(d, { date: dayOf(i.date), hour: i.hour }), true));

    server.registerTool("week_plan", {
      title: "Week plan",
      _meta: { ui: { resourceUri: WEEK_PLAN_URI }, "ui/resourceUri": WEEK_PLAN_URI },
      description: "The person's stored plan for the next 7 days from date: meals with calories and protein. The app shows the same week.",
      inputSchema: z.object({ date }), annotations: read,
    }, run((d, i) => A.weekPlan(d, dayOf(i.date)), true));

    server.registerTool("swap_meal", {
      title: "Swap a planned meal",
      description: "Replace one planned meal (a date and meal) with another recipe. Get ids with find_recipes using the same meal; it must fit their diet and dislikes.",
      inputSchema: z.object({ date, meal, recipe_id: z.string().max(80) }), annotations: write,
    }, run((d, i) => A.swapMeal(d, { date: dayOf(i.date), meal: i.meal, recipeId: i.recipe_id })));

    server.registerResource("profile-card", PROFILE_URI, { title: "Your calories", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: profileHtml(), _meta: cardMeta() }],
    }));

    server.registerTool("my_targets", {
      _meta: { ui: { resourceUri: PROFILE_URI }, "ui/resourceUri": PROFILE_URI },
      title: "Calorie target and diet",
      description: "Use when the person asks about or wants to change their calorie target, daily range, goal or diet. Its card shows the range with steppers and diet chips and saves in place. The range is the same every day of the week.",
      inputSchema: z.object({}), annotations: read,
    }, run((d) => A.profileInfo(d), true));

    server.registerTool("profile", {
      title: "Profile",
      description: "The person's diet, daily calorie range and foods to skip, as data. Check it quietly before suggesting or writing food; to show or change targets use my_targets.",
      inputSchema: z.object({}), annotations: read,
    }, run((d) => A.profileInfo(d)));

    server.registerTool("set_profile", {
      title: "Change profile",
      description: "Change diet, calorie range or foods to skip. Only the fields given change. Changing diet or foods to skip re-plans days that no longer fit.",
      inputSchema: z.object({
        kcal_min: z.number().int().min(800).max(6000).optional(), kcal_max: z.number().int().min(900).max(7000).optional(),
        diet: z.enum(["anything", "vegetarian", "eggetarian", "vegan"]).optional(),
        dislikes: z.array(z.string().min(1).max(40)).max(30).optional().describe("Replaces the whole list"),
      }), annotations: write,
    }, run((d, i) => A.updateProfile(d, { kcalMin: i.kcal_min, kcalMax: i.kcal_max, diet: i.diet, dislikes: i.dislikes })));

    server.registerTool("prep_today", {
      title: "Prep today",
      description: "Prep jobs for the meals still ahead today and tomorrow's that need it tonight (soak, marinate, overnight oats), with which are done.",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23") }), annotations: read,
    }, run((d, i) => A.prepToday(d, { date: dayOf(i.date), hour: i.hour })));

    server.registerTool("set_prep_done", {
      title: "Tick a prep job",
      description: "Mark a prep job done, or not done (done: false). Use an id from prep_today.",
      inputSchema: z.object({ id: z.string().max(200), done: z.boolean().default(true) }), annotations: write,
    }, run((d, i) => A.setPrepDone(d, i.id, i.done)));

    server.registerTool("write_recipe", {
      title: "Write a recipe for this person",
      description: `Write a recipe for this person and show it to them; it opens in their NutriFlow app (cook screen). It is NOT saved to their Recipes until they like it: ask, then call keep_recipe. You write it, this checks it. Adapt it to them: call profile (diet, foods to skip) and pantry (what they have) first, and prefer what they already have. To adapt a recipe they already have (no onion, for 2, vegan), write the adapted version and pass the original id as basedOn so it keeps the picture.
Write it like a real cook: salt, a cooking fat (oil, ghee or butter), aromatics (onion, garlic, ginger), spices with amounts, and the order things go in the pan (whole spices in hot oil, then aromatics, then ground spices, then tomatoes or liquid). The last step must taste and balance (adjust salt, sourness, heat, sweetness). Ingredient amounts are for the whole recipe; nutrition is per serving and may be a fair estimate. Each step's verb must be one of: ${COOK_VERBS.join(", ")}. Give minutes only for steps that wait (simmering, boiling, baking). Add a short "look" (what it looks, smells or sounds like when right) and a "tip" to each step when you can.
Make it complete. A dish with parts (chicken tikka masala = marinade + masala gravy; biryani = rice + masala) gets every part with its own ingredients and steps, tagged with "group". Pastes and spice mixes are ingredients with amounts (ginger-garlic paste, garam masala, kasuri methi), and "swaps" says what to do without each (grate fresh ginger and garlic, mix your own masala), so "I don't have it" is never a dead end. "fixes" covers too salty, too sour, too thick, watery, bland, burnt. If the result lists problems, fix them and call again.`,
      inputSchema: z.object({
        meal,
        basedOn: z.string().max(80).optional().describe("The id of the recipe this adapts (from find_recipes or recipe)."),
        recipe: z.object({
          name: z.string().min(1).max(80),
          blurb: z.string().max(200).describe("One line: what it tastes like."),
          minutes: z.number().min(1).max(360),
          servings: z.number().min(1).max(12),
          kcal: z.number().min(30).max(2500),
          protein: z.number().min(0).max(300),
          carbs: z.number().min(0).max(500),
          fat: z.number().min(0).max(300),
          ingredients: z.array(z.object({ name: z.string().max(80).describe("Plain grocery name: Onion, Basmati rice, Ginger-garlic paste"), qty: z.number().positive(), unit: z.string().max(20).describe("g, ml, pcs, cups, tbsp, tsp, cloves"), group: z.string().max(40).optional().describe("The part of the dish: Marinade, Masala, Rice") })).min(2).max(60),
          steps: z.array(z.object({ text: z.string().max(400), verb: z.string().max(20), minutes: z.number().min(1).max(240).optional(), look: z.string().max(240).optional(), tip: z.string().max(240).optional(), group: z.string().max(40).optional().describe("Same names as the ingredients' groups") })).min(2).max(40),
          swaps: z.array(z.object({ ingredient: z.string().max(60), use: z.string().max(200), note: z.string().max(240).optional() })).max(20).optional().describe("What to use when the person does not have an ingredient, or how to make it (paste, spice mix). Cover every non-staple ingredient."),
          fixes: z.array(z.object({ problem: z.string().max(40), fix: z.string().max(240) })).max(20).optional().describe("What can go wrong and how to fix it: too salty, too sour, too thick, watery, bland, burnt."),
          prep: z.array(z.string().max(160)).max(12).optional().describe("What to set out and prepare before the first step."),
        }),
      }), annotations: write,
    }, run(async (d, i) => {
      const out = await A.writeRecipe(d, i);
      const origin = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
      return { ...out, ...(origin ? { link: `${origin}/recipes/${out.id}` } : {}), next: "Show the person the recipe (the link opens it) and ask if they want to keep it. Only then call keep_recipe." };
    }));

    server.registerTool("keep_recipe", {
      title: "Keep a recipe in their Recipes",
      description: "The person liked a recipe you wrote with write_recipe: save it to their Recipes tab. keep: false takes it back out.",
      inputSchema: z.object({ id: z.string().max(80), keep: z.boolean().default(true) }), annotations: write,
    }, run((d, i) => A.keepRecipe(d, i.id, i.keep)));

    server.registerTool("find_recipes", {
      title: "Find recipes",
      description: "NutriFlow recipes by words and meal, with how many ingredients the pantry lacks.",
      inputSchema: z.object({ query: z.string().max(100).optional(), meal: meal.optional() }), annotations: read,
    }, run((d, i) => A.findRecipes(d, i.query, i.meal)));

    server.registerTool("recipe", {
      title: "Recipe details",
      description: "One recipe: ingredients (with what is in the pantry), steps, per-serving nutrition.",
      inputSchema: z.object({ id: z.string() }), annotations: read,
    }, run((d, i) => A.recipeDetails(d, i.id)));

    server.registerTool("pantry", {
      title: "Pantry", description: "Everything in the pantry, with what is running low.",
      inputSchema: z.object({}), annotations: read,
    }, run((d) => A.pantryList(d)));

    server.registerTool("add_to_pantry", {
      title: "Add to pantry",
      description: "Add things the person has. An item already there gains the amount.",
      inputSchema: z.object({
        items: z.array(z.object({
          name: z.string().min(1).max(60),
          qty: z.number().positive().max(1000),
          unit: z.enum(["pcs", "cloves", "packs", "jar", "cups"]).optional(),
          group: z.enum(["Produce", "Dairy", "Dry goods"]).optional(),
        })).min(1).max(30),
      }),
      annotations: write,
    }, run((d, i) => A.addToPantry(d, i.items)));

    server.registerTool("shopping_list", {
      title: "Shopping list",
      _meta: { ui: { resourceUri: SHOPPING_URI }, "ui/resourceUri": SHOPPING_URI },
      description: "What is on the shopping list, with amounts.",
      inputSchema: z.object({}), annotations: read,
    }, run((d) => A.shoppingList(d), true));

    server.registerTool("add_to_shopping_list", {
      title: "Add to shopping list",
      description: "Put things on the shopping list. Something already on it keeps its amount.",
      inputSchema: z.object({
        items: z.array(z.object({ name: z.string().min(1).max(60), qty: z.number().positive().max(1000).optional(), unit: z.enum(SHOP_UNIT_IDS).optional() })).min(1).max(30),
      }),
      annotations: write,
    }, run(async (d, i) => ({ added: await A.addToShopping(d, i.items) })));

    server.registerTool("mark_bought", {
      title: "Mark bought",
      description: "Things the person bought: they leave the list and go into the pantry.",
      inputSchema: z.object({ names: z.array(z.string().min(1).max(60)).min(1).max(30) }), annotations: write,
    }, run((d, i) => A.boughtItems(d, i.names)));

    server.registerTool("chores_today", {
      title: "Chores today", description: "Chores due today or already done today.",
      inputSchema: z.object({ date }), annotations: read,
    }, run((d, i) => A.choresToday(d, dayOf(i.date))));

    server.registerTool("set_chore_done", {
      title: "Tick a chore", description: "Mark a chore done today, or not done (done: false).",
      inputSchema: z.object({ id: z.string(), done: z.boolean().default(true), date }), annotations: write,
    }, run((d, i) => A.setChoreDone(d, i.id, dayOf(i.date), i.done)));

    server.registerTool("add_chore", {
      title: "Add a chore",
      description: "A new chore: daily, weekly (repeats on today's weekday) or once.",
      inputSchema: z.object({ title: z.string().min(1).max(80), repeat: z.enum(["daily", "weekly", "once"]), date }), annotations: write,
    }, run((d, i) => A.newChore(d, i.title, i.repeat, dayOf(i.date))));
  },
  { serverInfo: { name: "nutriflow", version: "0.1.0" }, instructions: INSTRUCTIONS },
);

/** The MCP endpoint: every request needs a valid Supabase access token; a 401 points clients at the metadata to sign in. */
const authed = withMcpAuth(
  mcp,
  async (_req, token) => {
    if (!token || !URL) return undefined;
    const v = await verifyAccessToken(URL, KEY, token);
    return v ? { token, clientId: v.clientId, scopes: v.scopes, expiresAt: v.expiresAt, extra: { userId: v.userId } } : undefined;
  },
  { required: true },
);

/** The MCP endpoint, timed: `vercel logs` shows each call's method, tool and milliseconds on our side (sign-in check included, the chat's own thinking not). */
export const mcpHandler = async (req: Request) => {
  const started = Date.now();
  const body = req.method === "POST" ? await req.clone().json().catch(() => null) : null;
  const res = await authed(req);
  if (body?.method) console.log(JSON.stringify({ mcp: body.method, tool: body.params?.name, status: res.status, ms: Date.now() - started }));
  return res;
};

/** RFC 9728 metadata: tells MCP clients to sign in with Supabase Auth. */
export const resourceMetadata = (req: Request) =>
  protectedResourceHandler({ authServerUrls: [ISSUER], resourceUrl: `${getPublicOrigin(req)}/mcp` })(req);

/** Browser-based MCP clients preflight the metadata. */
export const metadataOptions = metadataCorsOptionsRequestHandler();

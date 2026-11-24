import { createMcpHandler, getPublicOrigin, metadataCorsOptionsRequestHandler, protectedResourceHandler, withMcpAuth } from "mcp-handler";
import { z } from "zod";
import { CARD_MIME, EAT_NEXT_URI, eatNextHtml } from "./mcpCards";
import { clientForToken, verifyAccessToken } from "@/data/auth/token";
import { SupabaseChoreRepository } from "@/data/chores/supabase";
import { SupabaseMealPlanRepository } from "@/data/planning/supabase";
import { SupabasePrepDoneRepository } from "@/data/planning/prep";
import { SupabaseMealLogRepository, SupabaseProfileRepository } from "@/data/nutrition/supabase";
import { SupabasePantryRepository, SupabaseShoppingListRepository } from "@/data/pantry/supabase";
import { DemoRecipeRepository } from "@/data/recipes/demo";
import { CombinedRecipeRepository, SupabaseMyRecipeRepository } from "@/data/recipes/mine";
import * as A from "@/domain/assistant";
import { toDateKey } from "@/domain/nutrition";
import { SHOP_UNIT_IDS } from "@/domain/pantry/types";

// The ChatGPT / Claude connector: an MCP server over the same use cases the app uses, as the signed-in person.
// Sign-in is Supabase Auth's OAuth 2.1 server (beta); the consent screen is /oauth/consent in this app.

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
/** Supabase Auth is the authorization server; its issuer is the project's /auth/v1. */
const ISSUER = `${URL}/auth/v1`;

const depsFor = (token: string): A.AssistantDeps => {
  const db = clientForToken(URL, KEY, token);
  return {
    logs: new SupabaseMealLogRepository(db),
    profile: new SupabaseProfileRepository(db),
    pantry: new SupabasePantryRepository(db),
    list: new SupabaseShoppingListRepository(db),
    chores: new SupabaseChoreRepository(db),
    plans: new SupabaseMealPlanRepository(db),
    prep: new SupabasePrepDoneRepository(db),
    recipes: new CombinedRecipeRepository(new DemoRecipeRepository(), new SupabaseMyRecipeRepository(db)),
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
Log only what the person says they ate, for themselves. If several people ate, each logs their own in their own account.
Prefer a recipe id (find_recipes) so calories come from the recipe. For anything else give your best kcal estimate and say it is an estimate.
Always pass the person's local date. Keep answers short: the next step, not a report.`;

type Ctx = { http?: { authInfo?: { token: string } } };
type Out = { content: { type: "text"; text: string }[]; isError?: boolean };

/** Runs a use case as the caller and returns its result as JSON text; a thrown error becomes a readable tool error. */
const run = <I>(fn: (deps: A.AssistantDeps, input: I) => Promise<unknown>) =>
  async (input: I, ctx: Ctx): Promise<Out> => {
    const token = ctx.http?.authInfo?.token;
    if (!token) return { isError: true, content: [{ type: "text", text: "Not signed in." }] };
    try {
      const result = await fn(depsFor(token), input);
      return { content: [{ type: "text", text: JSON.stringify(result ?? { ok: true }) }] };
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
      description: "What the person ate on a day, calories against their range, calories left and macros.",
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

    server.registerTool("what_to_eat", {
      title: "What should I eat?",
      description: "The app's best three meals for now: diet, dislikes, pantry, calories left, time of day and an optional wish (quick, light, high protein, use what I have).",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23"), wish: z.string().max(200).optional() }),
      annotations: read,
    }, run((d, i) => A.suggestNow(d, { date: dayOf(i.date), hour: i.hour, wish: i.wish })));

    server.registerResource("eat-next-card", EAT_NEXT_URI, { title: "Eat next card", mimeType: CARD_MIME }, async (uri) => ({
      contents: [{ uri: uri.href, mimeType: CARD_MIME, text: eatNextHtml() }],
    }));

    server.registerTool("eat_next", {
      title: "Eat next",
      _meta: { ui: { resourceUri: EAT_NEXT_URI }, "ui/resourceUri": EAT_NEXT_URI },
      description: "The one planned meal to eat next by the person's clock, what to buy, swap or skip to cook it, and the rest of today. Same answer as the app's Home.",
      inputSchema: z.object({ date, hour: z.number().int().min(0).max(23).describe("Local hour, 0-23") }), annotations: read,
    }, run((d, i) => A.eatNextNow(d, { date: dayOf(i.date), hour: i.hour })));

    server.registerTool("week_plan", {
      title: "Week plan",
      description: "The person's stored plan for the next 7 days from date: meals with calories and protein. The app shows the same week.",
      inputSchema: z.object({ date }), annotations: read,
    }, run((d, i) => A.weekPlan(d, dayOf(i.date))));

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
      title: "Shopping list", description: "What is on the shopping list, with amounts.",
      inputSchema: z.object({}), annotations: read,
    }, run((d) => A.shoppingList(d)));

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
export const mcpHandler = withMcpAuth(
  mcp,
  async (_req, token) => {
    if (!token || !URL) return undefined;
    const v = await verifyAccessToken(URL, KEY, token);
    return v ? { token, clientId: v.clientId, scopes: v.scopes, expiresAt: v.expiresAt, extra: { userId: v.userId } } : undefined;
  },
  { required: true },
);

/** RFC 9728 metadata: tells MCP clients to sign in with Supabase Auth. */
export const resourceMetadata = (req: Request) =>
  protectedResourceHandler({ authServerUrls: [ISSUER], resourceUrl: `${getPublicOrigin(req)}/mcp` })(req);

/** Browser-based MCP clients preflight the metadata. */
export const metadataOptions = metadataCorsOptionsRequestHandler();

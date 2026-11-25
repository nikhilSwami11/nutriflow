import { z } from "zod";
import * as A from "@/domain/assistant";
import { toDateKey } from "@/domain/nutrition";
import { SHOP_UNIT_IDS } from "@/domain/pantry/types";

// The in-app chat's tools: the same use cases as the MCP connector (composition/mcp.ts), minus the date and hour, which
// the app fills from the device clock so the model cannot get them wrong.
// shortcut: descriptions and schemas are copied from mcp.ts, not shared; share one table if the two drift.

const slot = z.enum(["breakfast", "lunch", "dinner", "snack"]);
const meal = z.enum(["Breakfast", "Lunch", "Snack", "Dinner"]);
const now = () => ({ date: toDateKey(new Date()), hour: new Date().getHours() });

const tool = <S extends z.ZodType>(name: string, description: string, schema: S, fn: (i: z.infer<S>) => Promise<unknown>): A.ChatTool => {
  const parameters = z.toJSONSchema(schema) as Record<string, unknown>;
  delete parameters.$schema;
  return { name, description, parameters, run: async (args) => fn(schema.parse(args)) };
};
const none = z.object({});

export function chatTools(d: A.AssistantDeps): A.ChatTool[] {
  return [
    tool("today", "What the person ate today, calories against their range, calories left and macros.", none, () => A.daySummary(d, now().date)),
    tool("eat_next", "The one meal to eat next by the clock, and what to buy, swap or skip to cook it.", none, () => A.eatNextNow(d, now())),
    tool("what_to_eat", "One meal for right now written for this person, plus two ideas. Optional wish: quick, light, high protein, use what I have.",
      z.object({ wish: z.string().max(200).optional() }), (i) => A.whatToEatNow(d, { ...now(), wish: i.wish })),
    tool("cooked", "The person cooked and ate a recipe: logs it, uses up the pantry, learns their serving size. Leave servings_eaten out to use their usual.",
      z.object({ recipe_id: z.string().max(80), servings_made: z.number().positive().max(20).optional(), servings_eaten: z.number().positive().max(20).optional() }),
      (i) => A.cooked(d, { date: now().date, recipeId: i.recipe_id, servingsMade: i.servings_made, servingsEaten: i.servings_eaten })),
    tool("log_meal", "Log what the person ate. Use recipe_id and servings for a recipe, else name and kcal (say it is an estimate).",
      z.object({
        slot, recipe_id: z.string().optional(), servings: z.number().positive().max(20).optional(),
        name: z.string().max(120).optional(), kcal: z.number().min(0).max(10000).optional(),
        protein: z.number().min(0).max(1000).optional(), carbs: z.number().min(0).max(2000).optional(), fat: z.number().min(0).max(1000).optional(),
      }),
      (i) => A.logEaten(d, { ...i, date: now().date, recipeId: i.recipe_id })),
    tool("undo_log", "Remove one logged meal by its id (from today or log_meal).", z.object({ id: z.string() }), async (i) => (await A.removeLog(d, i.id), { removed: i.id })),
    tool("find_recipes", "Recipes by words and meal, with what the pantry lacks.", z.object({ query: z.string().max(100).optional(), meal: meal.optional() }), (i) => A.findRecipes(d, i.query, i.meal)),
    tool("recipe", "One recipe: ingredients, steps, per-serving nutrition.", z.object({ id: z.string() }), (i) => A.recipeDetails(d, i.id)),
    tool("week_plan", "The stored week plan: seven days of meals.", none, () => A.weekPlan(d, now().date)),
    tool("prep_today", "Prep to do now or tonight (soak, marinate, overnight oats), with what is done.", none, () => A.prepToday(d, now())),
    tool("set_prep_done", "Tick a prep job done or not done. Ids come from prep_today.", z.object({ id: z.string().max(200), done: z.boolean().default(true) }), (i) => A.setPrepDone(d, i.id, i.done)),
    tool("pantry", "Everything in the pantry, with what is running low.", none, () => A.pantryList(d)),
    tool("add_to_pantry", "Add things the person says they have. An item already there gains the amount.",
      z.object({ items: z.array(z.object({ name: z.string().min(1).max(60), qty: z.number().positive().max(1000), unit: z.enum(["pcs", "cloves", "packs", "jar", "cups"]).optional() })).min(1).max(30) }),
      (i) => A.addToPantry(d, i.items)),
    tool("shopping_list", "What is on the shopping list, with amounts.", none, () => A.shoppingList(d)),
    tool("add_to_shopping_list", "Put things on the shopping list. Something already on it keeps its amount.",
      z.object({ items: z.array(z.object({ name: z.string().min(1).max(60), qty: z.number().positive().max(1000).optional(), unit: z.enum(SHOP_UNIT_IDS).optional() })).min(1).max(30) }),
      async (i) => ({ added: await A.addToShopping(d, i.items) })),
    tool("mark_bought", "Things the person bought: they leave the list and go into the pantry.", z.object({ names: z.array(z.string().min(1).max(60)).min(1).max(30) }), (i) => A.boughtItems(d, i.names)),
    tool("chores_today", "Chores due or done today.", none, () => A.choresToday(d, now().date)),
    tool("set_chore_done", "Tick a chore done today, or untick it. Ids come from chores_today.", z.object({ id: z.string(), done: z.boolean().default(true) }), (i) => A.setChoreDone(d, i.id, now().date, i.done)),
  ];
}

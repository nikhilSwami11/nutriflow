import { foodKey as norm } from "../pantry/foodKey";
import { addChore, isDue, markChore, type Chore, type ChoreRepository, type Repeat } from "../chores";
import { finishCooking, suggestedServings, type ServingHabitRepository } from "../cooking";
import { logRecipeEaten } from "../cooking/logRecipe";
import { parseWants, suggestMeals, whatToEat, type RecipeWriter } from "../eat";
import {
  DEFAULT_RANGE,
  dayTotal,
  saveProfile,
  type Diet,
  intakeStatus,
  kcalLeft,
  logMeal,
  logsForDay,
  type DateKey,
  type MealLog,
  type MealLogRepository,
  type MealSlot,
  type ProfileRepository,
} from "../nutrition";
import { addNamesToShoppingList, addParsedItems, isLow, type PantryRepository, type ShoppingListRepository } from "../pantry";
import { DEFAULT_AMOUNT, type Need, type ParsedItem } from "../pantry/types";
import { readiness, recipeProblems, type MealName, type MyRecipeRepository, type Recipe, type RecipeRepository } from "../recipes";
import { toRecipe, type DraftRecipe } from "../eat/write";
import { markBought } from "../shopping";
import { dashboardFromLogs } from "../dashboard/fromLogs";
import { lastNDays, nextNDays } from "../nutrition/dates";
import { eatNext, ensurePlan, plannableRecipes, prepTasks, upcomingMeals, type MealPlanRepository, type PrepDoneRepository } from "../planning";

/**
 * What an assistant (ChatGPT, Claude) can do for one person through the MCP connector. Every answer is plain data the
 * assistant words itself. The rules are the app's own use cases; nothing here guesses on the person's behalf.
 */
export interface AssistantDeps {
  logs: MealLogRepository;
  profile: ProfileRepository;
  pantry: PantryRepository;
  list: ShoppingListRepository;
  chores: ChoreRepository;
  recipes: RecipeRepository;
  /** Where recipes the assistant writes for the person are kept. */
  mine: MyRecipeRepository;
  plans: MealPlanRepository;
  prep: PrepDoneRepository;
  /** Usual servings per recipe, updated when a cook is finished. */
  habits: ServingHabitRepository;
  /** The AI that writes a meal. Absent: what_to_eat uses the app's rules over the built-in recipes. */
  writer?: RecipeWriter;
  newId: () => string;
}


/** What was eaten on a day against the calorie range. */
export async function daySummary(deps: AssistantDeps, date: DateKey) {
  const [logs, profile] = await Promise.all([deps.logs.listBetween(date, date), deps.profile.get()]);
  const range = profile?.range ?? DEFAULT_RANGE;
  const total = dayTotal(logs, date);
  const day = logsForDay(logs, date);
  const sum = (k: "protein" | "carbs" | "fat") => Math.round(day.reduce((s, l) => s + (l[k] ?? 0), 0));
  return {
    date,
    kcalEaten: total ?? 0,
    range,
    kcalLeft: kcalLeft(total, range),
    status: total === null ? "nothing logged" : intakeStatus(total, range),
    macros: { protein: sum("protein"), carbs: sum("carbs"), fat: sum("fat") },
    meals: day.map((l) => ({ id: l.id, slot: l.slot, name: l.name, kcal: l.kcal, servings: l.servings })),
  };
}

export interface EatenInput {
  date: DateKey;
  slot: MealSlot;
  /** From the recipe list: calories and macros come from the recipe, times the servings eaten. */
  recipeId?: string;
  servings?: number;
  /** Anything else: the name and calories the person (or the assistant, from what they said) gave. */
  name?: string;
  kcal?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

/** Logs what this one person ate. Three people eating one dinner log it three times, each with their own servings. */
export async function logEaten(deps: AssistantDeps, input: EatenInput): Promise<MealLog> {
  const base = { id: deps.newId(), date: input.date, slot: input.slot, source: "chat" as const };
  if (input.recipeId) {
    const recipe = (await deps.recipes.list()).find((r) => r.id === input.recipeId);
    if (!recipe) throw new Error(`No recipe with id ${input.recipeId}. Use find_recipes to get ids.`);
    return logRecipeEaten(deps.logs, { ...base, recipe, servings: input.servings });
  }
  const name = input.name?.trim();
  if (!name) throw new Error("Give a recipe id, or a name and kcal.");
  if (input.kcal === undefined) throw new Error(`How many calories was ${name}? Give kcal.`);
  return logMeal(deps.logs, { ...base, name, kcal: Math.round(input.kcal), protein: input.protein, carbs: input.carbs, fat: input.fat });
}

/** Undo a log. Removing an id that is not there is not an error. */
export const removeLog = (deps: AssistantDeps, id: string) => deps.logs.remove(id);

/** Recipes by words in the name or blurb, optionally one meal. Short rows; ask for one recipe for its steps. */
export async function findRecipes(deps: AssistantDeps, query?: string, meal?: MealName) {
  const words = (query ?? "").toLowerCase().split(/\s+/).filter(Boolean).map(norm);
  const pantry = await deps.pantry.list();
  return (await deps.recipes.list())
    .filter((r) => !meal || r.meal === meal)
    .filter((r) => words.every((w) => `${r.name} ${r.blurb}`.toLowerCase().includes(w)))
    .map((r) => ({
      id: r.id, name: r.name, meal: r.meal, minutes: r.minutes, kcalPerServing: r.kcal, protein: r.protein,
      missingFromPantry: readiness(r, pantry).missing,
    }));
}

/** One recipe in full, with what the pantry lacks. */
export async function recipeDetails(deps: AssistantDeps, id: string) {
  const [recipes, pantry] = await Promise.all([deps.recipes.list(), deps.pantry.list()]);
  const r = recipes.find((x) => x.id === id);
  if (!r) throw new Error(`No recipe with id ${id}.`);
  const has = (n: string) => pantry.some((p) => p.qty > 0 && norm(p.name) === norm(n));
  return {
    id: r.id, name: r.name, blurb: r.blurb, meal: r.meal, minutes: r.minutes, servings: r.servings,
    perServing: { kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat },
    ingredients: r.ingredients.map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, inPantry: has(i.name) })),
    steps: r.steps.map((s) => (s.minutes ? `${s.text} (${s.minutes} min)` : s.text)),
  };
}

/** What to eat now: the app's own ranking (diet, dislikes, pantry, calories left, time of day, wishes). */
export async function suggestNow(deps: AssistantDeps, input: { date: DateKey; hour: number; wish?: string }) {
  const [recipes, pantry, profile, day] = await Promise.all([
    deps.recipes.list(), deps.pantry.list(), deps.profile.get(), daySummary(deps, input.date),
  ]);
  return suggestMeals({
    recipes, pantry, diet: profile?.diet, dislikes: profile?.dislikes, kcalLeft: day.kcalLeft, hour: input.hour,
    wants: parseWants(input.wish ?? ""),
  }).map((s) => ({ id: s.recipe.id, name: s.recipe.name, kcalPerServing: s.recipe.kcal, minutes: s.recipe.minutes, ready: s.ready, reasons: s.reasons }));
}

export async function pantryList(deps: AssistantDeps) {
  return (await deps.pantry.list()).map((i) => ({ name: i.name, qty: i.qty, unit: i.unit, low: isLow(i) }));
}

/** Adds what the person says they have; an item already there gains the amount. */
export async function addToPantry(deps: AssistantDeps, items: ParsedItem[]) {
  return (await addParsedItems({ repo: deps.pantry, newId: deps.newId }, items)).map((i) => ({ name: i.name, qty: i.qty, unit: i.unit }));
}

export async function shoppingList(deps: AssistantDeps) {
  const [ids, amounts, items] = await Promise.all([deps.list.list(), deps.list.amounts(), deps.pantry.list()]);
  return ids.flatMap((id) => {
    const item = items.find((i) => i.id === id);
    if (!item) return [];
    const a = amounts[id] ?? DEFAULT_AMOUNT;
    return [{ name: item.name, qty: a.qty, unit: a.unit }];
  });
}

export const addToShopping = (deps: AssistantDeps, needs: Need[]) => addNamesToShoppingList({ pantry: deps.pantry, list: deps.list, newId: deps.newId }, needs);

/** Bought: the amount goes into the pantry and leaves the list. Names that are not on the list come back in `notOnList`. */
export async function boughtItems(deps: AssistantDeps, names: string[]) {
  const [ids, items] = await Promise.all([deps.list.list(), deps.pantry.list()]);
  const done: string[] = [];
  const notOnList: string[] = [];
  for (const name of names) {
    const item = items.find((i) => ids.includes(i.id) && norm(i.name) === norm(name));
    if (!item) notOnList.push(name);
    else {
      await markBought(deps, item.id);
      done.push(item.name);
    }
  }
  return { bought: done, notOnList };
}

/** Chores due today or already done today. */
export async function choresToday(deps: AssistantDeps, date: DateKey) {
  return (await deps.chores.list())
    .filter((c) => isDue(c, date) || c.lastDone === date)
    .map((c) => ({ id: c.id, title: c.title, repeat: c.repeat, done: c.lastDone === date }));
}

/** Done today, or not done after all (clears it). */
export async function setChoreDone(deps: AssistantDeps, id: string, date: DateKey, done: boolean) {
  const chore = (await deps.chores.list()).find((c) => c.id === id);
  if (!chore) throw new Error(`No chore with id ${id}. Use chores_today to get ids.`);
  await markChore(deps.chores, id, done ? date : null);
  return { title: chore.title, done };
}

export async function newChore(deps: AssistantDeps, title: string, repeat: Repeat, date: DateKey): Promise<Chore> {
  const c = await addChore({ repo: deps.chores, newId: deps.newId }, { title, repeat, day: repeat === "weekly" ? new Date(`${date}T12:00:00`).getDay() : undefined });
  if (!c) throw new Error("A chore needs a title.");
  return c;
}

/** Noon on the person's local date, so day maths never slips across midnight. */
const noon = (date: DateKey) => new Date(`${date}T12:00:00`);

/** The stored week from this date, planned now for any day missing: the same week the app shows. */
async function storedWeek(deps: AssistantDeps, date: DateKey) {
  const past = lastNDays(30, noon(date));
  const [recipes, profile, pantry, logs] = await Promise.all([deps.recipes.list(), deps.profile.get(), deps.pantry.list(), deps.logs.listBetween(past[0], date)]);
  const dash = dashboardFromLogs(logs, noon(date), profile?.range ?? DEFAULT_RANGE);
  const plan = await ensurePlan(deps.plans, {
    recipes: plannableRecipes(recipes, profile),
    goals: { calories: dash.goals.calories, protein: dash.goals.protein },
    history: dash.history,
    dates: nextNDays(7, noon(date)),
    pantry,
  });
  return { plan, recipes, pantry, eatenToday: dash.eatenToday };
}

/** The week plan: seven days of meals with calories and protein. */
export async function weekPlan(deps: AssistantDeps, date: DateKey) {
  const { plan, recipes } = await storedWeek(deps, date);
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return plan.map((d) => ({
    date: d.date,
    focus: d.focus,
    meals: d.meals.flatMap((m) => {
      const r = byId.get(m.recipeId);
      return r ? [{ meal: m.meal, recipeId: r.id, name: r.name, kcal: r.kcal, protein: r.protein }] : [];
    }),
  }));
}

/** Day i of the plan as meals with their recipes. */
const mealsOf = (plan: { meals: { meal: MealName; recipeId: string }[] }[], recipes: Recipe[]) => (i: number) => {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return (plan[i]?.meals ?? []).flatMap((m) => (byId.has(m.recipeId) ? [{ meal: m.meal, recipe: byId.get(m.recipeId)! }] : []));
};

/** The one meal to eat next by the clock, and what to buy, swap or skip to cook it. Same rule as the app's Home. */
export async function eatNextNow(deps: AssistantDeps, input: { date: DateKey; hour: number }) {
  const { plan, recipes, pantry, eatenToday } = await storedWeek(deps, input.date);
  const day = mealsOf(plan, recipes);
  const n = eatNext({ today: day(0), tomorrow: day(1), eaten: eatenToday, hour: input.hour, pantry });
  if (!n) return { next: null };
  return {
    next: { meal: n.meal, recipeId: n.recipe.id, name: n.recipe.name, minutes: n.recipe.minutes, kcalPerServing: n.recipe.kcal, tomorrow: n.tomorrow },
    canCook: n.cook.canCook,
    toBuy: n.cook.needed.map((i) => i.name),
    // The pantry is not set up, so these are not known to be missing: ask.
    unknown: n.cook.unknown.map((i) => i.name),
    swaps: n.cook.swaps,
    canSkip: n.cook.skips,
    thenToday: n.then.map((m) => ({ meal: m.meal, name: m.recipe.name })),
  };
}

/** Prep to do now or tonight for the meals still ahead (soak, marinate, overnight oats), with what is ticked done. */
export async function prepToday(deps: AssistantDeps, input: { date: DateKey; hour: number }) {
  const { plan, recipes, eatenToday } = await storedWeek(deps, input.date);
  const day = mealsOf(plan, recipes);
  const open = upcomingMeals(day(0), eatenToday, input.hour).map((m) => m.recipe);
  const [tasks, done] = await Promise.all([Promise.resolve(prepTasks(input.date, open, day(1).map((m) => m.recipe))), deps.prep.doneOn(input.date)]);
  return tasks.map((t) => ({ id: t.id, action: t.action, dish: t.dish, due: t.due, forDay: t.forDay, done: done.includes(t.id) }));
}

/** Tick a prep job done, or not done. Ids come from prep_today. */
export async function setPrepDone(deps: AssistantDeps, id: string, done: boolean) {
  if (!/^\d{4}-\d{2}-\d{2}:/.test(id)) throw new Error("Use an id from prep_today.");
  await deps.prep.set(id, done);
  return { id, done };
}


/**
 * The assistant (Claude, ChatGPT) writes a recipe with its own model; this checks it and keeps it for the person to look at.
 * It is not saved to their Recipes until they like it (keepRecipe). `basedOn` makes it an adapted version of a recipe they
 * already have: it takes that recipe's picture. Problems come back as an error the assistant can read, fix and send again.
 */
export async function writeRecipe(deps: AssistantDeps, input: { meal: MealName; recipe: DraftRecipe; basedOn?: string }) {
  const [profile, builtins] = await Promise.all([deps.profile.get(), deps.recipes.list()]);
  const recipe = toRecipe(input.recipe, `ai-${deps.newId()}`, input.meal, { diet: profile?.diet, dislikes: profile?.dislikes ?? [] }, builtins);
  if (!recipe) {
    throw new Error("The recipe was not accepted: it needs a name, sane numbers, at least 2 ingredients and 2 steps, and it must fit the person's diet and dislikes (see profile).");
  }
  const problems = recipeProblems(recipe);
  if (problems.length) throw new Error(`Not saved yet. Fix these and send it again:\n- ${problems.join("\n- ")}`);
  const base = input.basedOn ? builtins.find((b) => b.id === input.basedOn) : undefined;
  if (base) {
    recipe.image ??= base.image;
    if (base.image) recipe.tint = base.tint;
  }
  await deps.mine.put(recipe, false);
  return { id: recipe.id, name: recipe.name, saved: false, hasPicture: !!recipe.image };
}

/** The person liked it: keep it in their Recipes (or take it back out with keep: false). */
export async function keepRecipe(deps: AssistantDeps, id: string, keep: boolean) {
  const found = (await deps.mine.list()).find((m) => m.recipe.id === id);
  if (!found) throw new Error("That recipe is not one you wrote for this person. Use an id from write_recipe.");
  await deps.mine.put(found.recipe, keep);
  return { id, name: found.recipe.name, saved: keep };
}

/** Diet, calorie range and foods to skip: what write_recipe and what_to_eat must respect. `saved` is false until the person sets it once. */
export async function profileInfo(deps: AssistantDeps) {
  const p = await deps.profile.get();
  return { saved: p !== null, kcalMin: (p?.range ?? DEFAULT_RANGE).min, kcalMax: (p?.range ?? DEFAULT_RANGE).max, diet: p?.diet ?? "anything", dislikes: p?.dislikes ?? [] };
}

/** Changes only the fields given; the rest stay as saved. */
export async function updateProfile(deps: AssistantDeps, patch: { kcalMin?: number; kcalMax?: number; diet?: Diet; dislikes?: string[] }) {
  const now = await profileInfo(deps);
  const saved = await saveProfile(deps.profile, {
    range: { min: patch.kcalMin ?? now.kcalMin, max: patch.kcalMax ?? now.kcalMax },
    diet: patch.diet ?? (now.diet as Diet),
    dislikes: patch.dislikes ?? now.dislikes,
  });
  return { saved: true, kcalMin: saved.range.min, kcalMax: saved.range.max, diet: saved.diet, dislikes: saved.dislikes };
}

/**
 * Puts another recipe into one slot of a planned day. The recipe must be one the plan may use (diet, dislikes) and be the
 * same meal. Later days are kept as they are.
 */
export async function swapMeal(deps: AssistantDeps, input: { date: DateKey; meal: MealName; recipeId: string }) {
  const { plan, recipes } = await storedWeek(deps, input.date);
  const day = plan.find((d) => d.date === input.date);
  if (!day) throw new Error("That date is not in the next 7 days of the plan.");
  const slot = day.meals.find((m) => m.meal === input.meal);
  if (!slot) throw new Error(`There is no ${input.meal} planned on ${input.date}.`);
  const profile = await deps.profile.get();
  const next = plannableRecipes(recipes, profile).find((r) => r.id === input.recipeId && r.meal === input.meal);
  if (!next) throw new Error(`Recipe ${input.recipeId} cannot replace a ${input.meal}: use find_recipes with meal ${input.meal} (it must fit their diet and dislikes).`);
  const changed = plan.filter((d) => d.date >= input.date).map((d) => (d === day ? { ...d, meals: d.meals.map((m) => (m === slot ? { ...m, recipeId: next.id } : m)) } : d));
  await deps.plans.clearFrom(input.date);
  await deps.plans.add(changed);
  return { date: input.date, meal: input.meal, was: recipes.find((r) => r.id === slot.recipeId)?.name, now: next.name };
}

/**
 * What to eat now, the way the app's Eat screen answers: one meal written for this person (kept unsaved, opens by id),
 * plus two ideas; when the writer is missing, slow or wrong, the rules pick from the built-in recipes.
 */
export async function whatToEatNow(deps: AssistantDeps, input: { date: DateKey; hour: number; wish?: string }) {
  const [all, pantry, profile, day] = await Promise.all([deps.recipes.list(), deps.pantry.list(), deps.profile.get(), daySummary(deps, input.date)]);
  const meal = await whatToEat(
    { writer: deps.writer, mine: deps.mine, newId: deps.newId },
    {
      builtins: all.filter((r) => !r.written), pantry, diet: profile?.diet, dislikes: profile?.dislikes, dayMax: day.range.max,
      kcalLeft: day.kcalLeft ?? undefined, hour: input.hour, wants: parseWants(input.wish ?? ""),
    },
  );
  const r = meal.best;
  return {
    source: meal.source === "ai" ? "written for you now (nutrition is an estimate)" : "picked from the app's recipes",
    best: { id: r.id, name: r.name, blurb: r.blurb, minutes: r.minutes, kcalPerServing: r.kcal, protein: r.protein, missingFromPantry: readiness(r, pantry).missing },
    ideas: meal.ideas.map((i) => ({ name: i.name, blurb: i.blurb, ...(i.recipeId ? { id: i.recipeId } : {}) })),
  };
}

/**
 * The person cooked and ate it: logs the meal (never lost), uses up the pantry and learns their usual serving size, the
 * same as the cook screen's Finish. Servings eaten default to their usual.
 */
export async function cooked(deps: AssistantDeps, input: { date: DateKey; recipeId: string; servingsMade?: number; servingsEaten?: number }) {
  const recipe = (await deps.recipes.list()).find((r) => r.id === input.recipeId);
  if (!recipe) throw new Error(`No recipe with id ${input.recipeId}. Use find_recipes to get ids.`);
  const eaten = input.servingsEaten ?? suggestedServings(await deps.habits.get(recipe.id).catch(() => null));
  const made = Math.max(input.servingsMade ?? recipe.servings, eaten);
  const out = await finishCooking(
    { pantry: deps.pantry, logs: deps.logs, habits: deps.habits, newId: deps.newId },
    { recipe, servingsMade: made, servingsEaten: eaten, date: input.date },
  );
  return {
    logged: { id: out.log.id, name: out.log.name, kcal: out.log.kcal, servings: eaten },
    pantryUsedUp: out.depleted.map((i) => i.name),
    notEnoughInPantry: out.shortfalls,
    warnings: out.warnings,
  };
}

export type NextItem =
  | { kind: "profile" }
  | {
      kind: "meal"; meal: MealName; recipeId: string; name: string; minutes: number; kcalPerServing: number; tomorrow: boolean;
      canCook: boolean;
      /** Ask "Do you have it?" for these: the pantry does not know them, or records them as out. */
      ask: string[];
    }
  | { kind: "prep"; id: string; action: string; dish: string; due: string }
  | { kind: "chore"; id: string; title: string }
  | { kind: "shopping"; count: number; names: string[] };

// A glance, not a report: past this the rest waits for the next look.
const MAX_ITEMS = 4;

/**
 * The day at a glance (calories against the range) and what to do now, the few things that matter, in order: set up the profile (first use only), the next meal, prep due,
 * chores due, the shopping list. Empty parts are left out, never mentioned. Same rules as the app's Home.
 */
export async function todayNext(deps: AssistantDeps, input: { date: DateKey; hour: number }) {
  const [profile, next, prep, chores, list, summary] = await Promise.all([
    deps.profile.get(), eatNextNow(deps, input), prepToday(deps, input), choresToday(deps, input.date), shoppingList(deps), daySummary(deps, input.date),
  ]);
  // The day in one line: calories against the range, macros only once something is logged.
  const day = { kcalEaten: summary.kcalEaten, range: summary.range, logged: summary.meals.length > 0, ...(summary.meals.length ? { macros: summary.macros } : {}) };
  const items: NextItem[] = [];
  if (!profile) items.push({ kind: "profile" });
  if (next.next) {
    const ask = [...next.toBuy, ...next.unknown];
    items.push({ kind: "meal", ...next.next, canCook: next.canCook, ask });
  }
  for (const p of prep.filter((t) => !t.done)) items.push({ kind: "prep", id: p.id, action: p.action, dish: p.dish, due: p.due });
  for (const c of chores.filter((c) => !c.done)) items.push({ kind: "chore", id: c.id, title: c.title });
  if (list.length) items.push({ kind: "shopping", count: list.length, names: list.slice(0, 3).map((i) => i.name) });
  return { day, items: items.slice(0, MAX_ITEMS) };
}

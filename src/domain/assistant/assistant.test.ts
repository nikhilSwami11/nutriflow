import { describe, expect, it } from "vitest";
import type { Chore } from "../chores";
import type { MealLog, Profile } from "../nutrition";
import { fakeList, fakePantry, item } from "../pantry/testing";
import type { Recipe } from "../recipes";
import type { StoredDay } from "../planning";
import {
  addToPantry,
  addToShopping,
  boughtItems,
  choresToday,
  daySummary,
  findRecipes,
  logEaten,
  newChore,
  recipeDetails,
  removeLog,
  setChoreDone,
  shoppingList,
  suggestNow,
  eatNextNow,
  writeRecipe,
  keepRecipe,
  prepToday,
  setPrepDone,
  weekPlan,
  swapMeal,
  cooked,
  whatToEatNow,
  profileInfo,
  updateProfile,
  todayNext,
  weekShopping,
  type AssistantDeps,
} from "./assistant";

const recipe = (o: Partial<Recipe> & { id: string }): Recipe => ({
  name: o.id, blurb: "", minutes: 20, servings: 2, meal: "Dinner", kcal: 500, protein: 20, carbs: 50, fat: 15, tint: "#fff",
  ingredients: [], steps: [{ text: "Cook it", verb: "stir" }], ...o,
});

function deps(o: { profile?: Profile; logs?: MealLog[]; chores?: Chore[]; extra?: Recipe[]; writer?: AssistantDeps["writer"] } = {}) {
  let logs = [...(o.logs ?? [])];
  let chores = [...(o.chores ?? [])];
  const saved: { recipe: Recipe; saved: boolean }[] = [];
  let n = 0;
  let days: StoredDay[] = [];
  let ticks: string[] = [];
  let prof = o.profile ?? null;
  const habits = new Map<string, { recipeId: string; count: number; avg: number }>();
  const d: AssistantDeps = {
    habits: { get: async (id) => habits.get(id) ?? null, save: async (h) => void habits.set(h.recipeId, h) },
    writer: o.writer,
    prep: { doneOn: async (date) => ticks.filter((t) => t.startsWith(date)), set: async (id, done) => void (ticks = done ? [...ticks, id] : ticks.filter((t) => t !== id)) },
    plans: {
      list: async (a, b) => days.filter((x) => x.date >= a && x.date <= b),
      add: async (xs) => void (days = [...days, ...xs.filter((x) => !days.some((y) => y.date === x.date))]),
      clearFrom: async (date) => void (days = days.filter((x) => x.date < date)),
    },
    logs: {
      listBetween: async (a, b) => logs.filter((l) => l.date >= a && l.date <= b),
      add: async (l) => void logs.push(l),
      remove: async (id) => void (logs = logs.filter((l) => l.id !== id)),
    },
    profile: { get: async () => prof, save: async (p) => void (prof = p) },
    pantry: fakePantry([item({ id: "p1", name: "Onion", qty: 3 }), item({ id: "p2", name: "Rice", qty: 0, unit: "cups" })]),
    list: fakeList(),
    chores: {
      list: async () => chores,
      save: async (c) => void (chores = [...chores.filter((x) => x.id !== c.id), c]),
      remove: async (id) => void (chores = chores.filter((c) => c.id !== id)),
    },
    recipes: {
      list: async () => [
        recipe({ id: "dal", name: "Dal tadka", blurb: "Yellow lentils", ingredients: [{ name: "Onion", qty: 1, unit: "pcs" }, { name: "Rice", qty: 1, unit: "cups" }] }),
        recipe({ id: "oats", name: "Oats", meal: "Breakfast", kcal: 300, minutes: 10 }),
        ...(o.extra ?? []),
      ],
    },
    mine: { list: async () => saved, put: async (r, kept) => void saved.push({ recipe: r, saved: kept }) },
    newId: () => `id${++n}`,
  };
  return { d, logs: () => logs, saved: () => saved };
}

const D = "2026-11-23";

describe("assistant", () => {
  it("logs a recipe meal from its per-serving numbers, as chat, and the day adds it up", async () => {
    const { d } = deps();
    const log = await logEaten(d, { date: D, slot: "dinner", recipeId: "dal", servings: 1.5 });
    expect(log).toMatchObject({ source: "chat", name: "Dal tadka", kcal: 750, protein: 30, servings: 1.5 });
    const s = await daySummary(d, D);
    expect(s).toMatchObject({ kcalEaten: 750, kcalLeft: 1350, status: "below", macros: { protein: 30 } });
  });

  it("logs a free meal by name and kcal, and asks for kcal when missing", async () => {
    const { d } = deps();
    await expect(logEaten(d, { date: D, slot: "lunch", name: "Pizza slice" })).rejects.toThrow(/kcal/);
    await expect(logEaten(d, { date: D, slot: "lunch", recipeId: "nope" })).rejects.toThrow(/find_recipes/);
    const log = await logEaten(d, { date: D, slot: "lunch", name: " Pizza slice ", kcal: 284.6 });
    expect(log).toMatchObject({ name: "Pizza slice", kcal: 285, source: "chat" });
  });

  it("each person logs their own: undo removes only that log", async () => {
    const { d, logs } = deps();
    const a = await logEaten(d, { date: D, slot: "dinner", recipeId: "dal" });
    await logEaten(d, { date: D, slot: "snack", name: "Apple", kcal: 95 });
    await removeLog(d, a.id);
    expect(logs().map((l) => l.name)).toEqual(["Apple"]);
  });

  it("a day with nothing logged says so instead of a zero status", async () => {
    const { d } = deps({ profile: { range: { min: 1500, max: 1800 } } });
    expect(await daySummary(d, D)).toMatchObject({ kcalEaten: 0, kcalLeft: 1800, status: "nothing logged", meals: [] });
  });

  it("finds recipes by words and meal, with what the pantry lacks; details list ingredients and steps", async () => {
    const { d } = deps();
    expect((await findRecipes(d, "lentils")).map((r) => r.id)).toEqual(["dal"]);
    expect((await findRecipes(d, undefined, "Breakfast")).map((r) => r.id)).toEqual(["oats"]);
    expect((await findRecipes(d, "dal"))[0].missingFromPantry).toBe(1); // rice is at 0
    const r = await recipeDetails(d, "dal");
    expect(r.ingredients).toEqual([
      { name: "Onion", qty: 1, unit: "pcs", inPantry: true },
      { name: "Rice", qty: 1, unit: "cups", inPantry: false },
    ]);
    expect(r.steps).toEqual(["Cook it"]);
  });

  it("suggests with the app's own ranking: a breakfast in the morning", async () => {
    const { d } = deps();
    const s = await suggestNow(d, { date: D, hour: 8, wish: "something quick" });
    expect(s[0]).toMatchObject({ id: "oats" });
  });

  it("pantry adds merge by name; shopping adds, lists and buys by name", async () => {
    const { d } = deps();
    expect(await addToPantry(d, [{ name: "onions", qty: 2 }])).toEqual([{ name: "Onion", qty: 5, unit: "pcs" }]);
    expect(await addToShopping(d, [{ name: "Rice", qty: 1, unit: "kg" }, { name: "Milk" }])).toBe(2);
    expect(await shoppingList(d)).toEqual([{ name: "Rice", qty: 1, unit: "kg" }, { name: "Milk", qty: 1, unit: "pcs" }]);
    expect(await boughtItems(d, ["milk", "Bread"])).toEqual({ bought: ["Milk"], notOnList: ["Bread"] });
    expect((await shoppingList(d)).map((x) => x.name)).toEqual(["Rice"]);
  });

  it("chores: today's list, tick and untick, and a new weekly chore repeats on today's weekday", async () => {
    const { d } = deps({ chores: [{ id: "c1", title: "Dishes", repeat: "daily", lastDone: null }] });
    expect(await choresToday(d, D)).toEqual([{ id: "c1", title: "Dishes", repeat: "daily", done: false }]);
    await setChoreDone(d, "c1", D, true);
    expect((await choresToday(d, D))[0].done).toBe(true);
    await setChoreDone(d, "c1", D, false);
    expect((await choresToday(d, D))[0].done).toBe(false);
    await expect(setChoreDone(d, "x", D, true)).rejects.toThrow(/chores_today/);
    expect(await newChore(d, "Bins", "weekly", D)).toMatchObject({ title: "Bins", day: 1 }); // 2026-11-23 is a Monday
    await expect(newChore(d, "  ", "daily", D)).rejects.toThrow();
  });
});

describe("week plan and eat next (the chat's view of the app's plan)", () => {
  it("plans and stores 7 days once, then reads the same week", async () => {
    const { d } = deps();
    const first = await weekPlan(d, "2026-11-23");
    expect(first).toHaveLength(7);
    expect(first[0].meals.length).toBeGreaterThan(0);
    expect(await weekPlan(d, "2026-11-23")).toEqual(first);
  });

  it("eat next goes by the clock and lists what to buy", async () => {
    const { d } = deps();
    const morning = await eatNextNow(d, { date: "2026-11-23", hour: 8 });
    expect(morning.next).toMatchObject({ meal: "Breakfast", name: "Oats", tomorrow: false });
    const night = await eatNextNow(d, { date: "2026-11-23", hour: 19 });
    expect(night.next).toMatchObject({ meal: "Dinner", name: "Dal tadka" });
    expect(night.toBuy).toEqual(["Rice"]); // rice is at 0 in the pantry
  });
});

describe("prep (shared with the app's Prep story)", () => {
  it("ticks only real prep ids and reads them back for the day", async () => {
    const { d } = deps();
    await expect(setPrepDone(d, "soak", true)).rejects.toThrow("prep_today");
    await setPrepDone(d, "2026-11-23:today:rajma:soak", true);
    expect(await d.prep.doneOn("2026-11-23")).toEqual(["2026-11-23:today:rajma:soak"]);
    expect(Array.isArray(await prepToday(d, { date: "2026-11-23", hour: 9 }))).toBe(true);
  });

  it("saves a recipe the assistant wrote, and sends back what is missing from a thin one", async () => {
    const { d, saved } = deps();
    const thin = { name: "Roasted chana", blurb: "Crunchy", minutes: 20, servings: 2, kcal: 200, protein: 9, carbs: 27, fat: 5,
      ingredients: [{ name: "Chickpeas", qty: 2, unit: "cups" }, { name: "Cumin seeds", qty: 1, unit: "tsp" }],
      steps: [{ text: "Dry the chickpeas", verb: "Mix" }, { text: "Roast with cumin", verb: "Roast" }] };
    await expect(writeRecipe(d, { meal: "Snack", recipe: thin })).rejects.toThrow(/salt[\s\S]*fat[\s\S]*aromatics[\s\S]*tastes and balances/);
    expect(saved()).toHaveLength(0);
    const good = { ...thin, ingredients: [...thin.ingredients, { name: "Salt", qty: 1, unit: "tsp" }, { name: "Olive oil", qty: 1, unit: "tbsp" }, { name: "Onion", qty: 1, unit: "pcs" }, { name: "Red chilli powder", qty: 0.5, unit: "tsp" }],
      steps: [...thin.steps, { text: "Taste, then adjust salt, heat and a squeeze of lemon", verb: "Toss", look: "Crisp and golden", tip: "Shake the tray halfway" }] };
    const out = await writeRecipe(d, { meal: "Snack", recipe: good });
    expect(out).toMatchObject({ name: "Roasted chana", saved: false });
    expect(out.id).toMatch(/^ai-/);
    expect(saved()[0].saved).toBe(false); // shown first, not kept
    await keepRecipe(d, out.id, true);
    expect(saved().at(-1)!.saved).toBe(true);
    await expect(keepRecipe(d, "ai-nope", true)).rejects.toThrow(/not one you wrote/);
    expect(saved()[0].recipe.steps[2]).toMatchObject({ look: "Crisp and golden", tip: "Shake the tray halfway" });
  });

  it("keeps the parts, swaps, fixes and prep of a full recipe, so the guide can answer from them", async () => {
    const { d, saved } = deps();
    const tikka = { name: "Chicken tikka masala", blurb: "Smoky, creamy, tangy", minutes: 60, servings: 4, kcal: 520, protein: 38, carbs: 22, fat: 30,
      ingredients: [
        { name: "Chicken", qty: 500, unit: "g", group: "Marinade" }, { name: "Yogurt", qty: 0.5, unit: "cup", group: "Marinade" }, { name: "Salt", qty: 1, unit: "tsp", group: "Marinade" },
        { name: "Ghee", qty: 2, unit: "tbsp", group: "Masala" }, { name: "Onion", qty: 2, unit: "pcs", group: "Masala" }, { name: "Ginger-garlic paste", qty: 1, unit: "tbsp", group: "Masala" },
        { name: "Garam masala", qty: 1, unit: "tsp", group: "Masala" }, { name: "Lemon", qty: 1, unit: "pcs", group: "Masala" },
      ],
      steps: [
        { text: "Mix the chicken with the yogurt and salt, rest 30 minutes", verb: "Mix", group: "Marinade" },
        { text: "Roast the chicken until charred at the edges", verb: "Roast", minutes: 15, group: "Marinade" },
        { text: "Fry the onion in ghee until golden, add the paste and cook until the raw smell goes", verb: "Sauté", group: "Masala" },
        { text: "Simmer with the chicken, then taste and adjust salt, lemon and heat", verb: "Simmer", minutes: 10, group: "Masala" },
      ],
      swaps: [{ ingredient: "Ginger-garlic paste", use: "1/2 tbsp grated ginger and 3 crushed garlic cloves" }],
      fixes: [{ problem: "Too Sour", fix: "Add a pinch of sugar and a spoon of cream." }],
      prep: ["Soak nothing: just set the marinade out first"] };
    await writeRecipe(d, { meal: "Dinner", recipe: tikka });
    const r = saved()[0].recipe;
    expect(r.ingredients.map((i) => i.group)).toEqual(["Marinade", "Marinade", "Marinade", "Masala", "Masala", "Masala", "Masala", "Masala"]);
    expect(r.steps[2].group).toBe("Masala");
    expect(r.swaps).toEqual([{ ingredient: "Ginger-garlic paste", use: "1/2 tbsp grated ginger and 3 crushed garlic cloves" }]);
    expect(r.fixes).toEqual([{ problem: "too sour", fix: "Add a pinch of sugar and a spoon of cream." }]);
    expect(r.prep).toHaveLength(1);
  });

  it("profile starts unsaved with the default range; set_profile changes only the fields given", async () => {
    const { d } = deps();
    expect(await profileInfo(d)).toMatchObject({ saved: false, diet: "anything", dislikes: [] });
    await updateProfile(d, { kcalMin: 2800, kcalMax: 3100 });
    await updateProfile(d, { dislikes: [" Mushroom ", "mushroom"] });
    expect(await profileInfo(d)).toEqual({ saved: true, kcalMin: 2800, kcalMax: 3100, diet: "anything", dislikes: ["mushroom"] });
    await expect(updateProfile(d, { kcalMin: 3200 })).rejects.toThrow(/min < max/);
  });

  it("swaps one planned meal for another of the same meal and keeps the other days", async () => {
    const { d } = deps({ extra: [recipe({ id: "eggs", name: "Egg toast", meal: "Breakfast", kcal: 350, minutes: 10 })] });
    const before = await weekPlan(d, D);
    const pick = before[0].meals.find((m) => m.meal === "Breakfast")!.recipeId === "oats" ? "eggs" : "oats";
    const out = await swapMeal(d, { date: D, meal: "Breakfast", recipeId: pick });
    expect(out.now).toBe(pick === "eggs" ? "Egg toast" : "Oats");
    const after = await weekPlan(d, D);
    expect(after[0].meals.find((m) => m.meal === "Breakfast")!.recipeId).toBe(pick);
    expect(after.slice(1)).toEqual(before.slice(1));
    await expect(swapMeal(d, { date: D, meal: "Breakfast", recipeId: "dal" })).rejects.toThrow(/find_recipes/);
    await expect(swapMeal(d, { date: D, meal: "Lunch", recipeId: pick })).rejects.toThrow(/no Lunch planned/);
  });

  it("cooked logs the meal as a cook, uses up the pantry and learns the serving size", async () => {
    const { d, logs } = deps();
    const out = await cooked(d, { date: D, recipeId: "dal", servingsEaten: 2 });
    expect(out.logged).toMatchObject({ name: "Dal tadka", kcal: 1000, servings: 2 });
    expect(logs()[0]).toMatchObject({ source: "cook", recipeId: "dal" });
    expect(out.pantryUsedUp).toEqual(["Rice"]);
    expect(out.notEnoughInPantry).toHaveLength(1); // the pantry had none
    expect((await d.habits.get("dal"))?.avg).toBe(2);
    expect((await cooked(d, { date: D, recipeId: "dal" })).logged.servings).toBe(2); // usual
    await expect(cooked(d, { date: D, recipeId: "nope" })).rejects.toThrow(/find_recipes/);
  });

  it("what to eat: one written meal when the writer works, the app's rules when it does not", async () => {
    const draft = { name: "Egg bhurji", blurb: "Soft eggs", minutes: 15, servings: 1, kcal: 400, protein: 25, carbs: 10, fat: 20,
      ingredients: [{ name: "Eggs", qty: 3, unit: "pcs" }, { name: "Onion", qty: 1, unit: "pcs" }], steps: [{ text: "Fry onion", verb: "Fry" }, { text: "Scramble eggs", verb: "Stir" }] };
    const ai = deps({ writer: { write: async () => ({ recipe: draft, ideas: [{ name: "Poha", blurb: "Light" }] }) } });
    const a = await whatToEatNow(ai.d, { date: D, hour: 8 });
    expect(a).toMatchObject({ best: { name: "Egg bhurji" }, ideas: [{ name: "Poha" }] });
    expect(a.best.id).toMatch(/^ai-/);
    expect(ai.saved()).toHaveLength(1);
    const rules = await whatToEatNow(deps({ writer: { write: async () => { throw new Error("down"); } } }).d, { date: D, hour: 8 });
    expect(rules.source).toMatch(/app's recipes/);
    expect(rules.best.name).toBe("Oats");
  });
});

describe("today next (the chat's glance at the day)", () => {
  it("lists only what matters: profile on first use, the meal with what to ask, open chores, the list; no empty parts", async () => {
    const { d } = deps({ chores: [{ id: "c1", title: "Dishes", repeat: "daily", lastDone: null }, { id: "c2", title: "Bins", repeat: "daily", lastDone: D }] });
    await addToShopping(d, [{ name: "Milk" }]);
    const { items, day } = await todayNext(d, { date: D, hour: 19 });
    expect(day).toEqual({ kcalEaten: 0, range: { min: 1800, max: 2100 }, logged: false });
    expect(items.map((i) => i.kind)).toEqual(["profile", "meal", "chore", "shopping"]);
    expect(items[1]).toMatchObject({ kind: "meal", name: "Dal tadka", ask: ["Rice"] });
    expect(items[2]).toEqual({ kind: "chore", id: "c1", title: "Dishes" }); // Bins is done today: not shown
  });

  it("says nothing about chores or shopping when there are none, and caps the glance at four", async () => {
    const { d } = deps({ profile: { range: { min: 1800, max: 2100 } } as Profile });
    expect((await todayNext(d, { date: D, hour: 19 })).items.map((i) => i.kind)).toEqual(["meal"]);
    const many = deps({ chores: Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, title: `C${i}`, repeat: "daily" as const, lastDone: null })) });
    expect((await todayNext(many.d, { date: D, hour: 19 })).items).toHaveLength(4);
  });
});

describe("week shopping (one call for the week's list)", () => {
  it("sums what the week's plan lacks and leaves out what is already on the list", async () => {
    const { d } = deps();
    const first = await weekShopping(d, D);
    expect(first.toAdd.map((n) => n.name)).toContain("Rice");
    expect(first.alreadyOnList).toBe(0);
    await addToShopping(d, [{ name: "Rice" }]);
    const again = await weekShopping(d, D);
    expect(again.toAdd.map((n) => n.name)).not.toContain("Rice");
    expect(again.alreadyOnList).toBe(1);
  });
});

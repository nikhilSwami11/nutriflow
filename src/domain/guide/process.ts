import { foodKey } from "../pantry/foodKey";
import { scaleQty } from "../recipes/pantryMatch";
import type { Ingredient, Recipe } from "../recipes/types";
import { weightOf } from "../recipes/weight";
import { fmtQuarters } from "./guide";

export interface ProcessItem {
  name: string;
  /** "2 cups · ≈ 400 g dry" */
  amount: string;
}
/** One thing to do inside an action, with a tick: a step of the recipe, or one item to rinse or wash. */
export interface ProcessTask {
  id: string;
  text: string;
  /** The recipe step it comes from (0-based). Absent for washing, which happens before step 1. */
  stepIndex?: number;
  minutes?: number;
}

export interface ProcessTile {
  /** A cooking verb, or "Wash" for the rinsing before step 1. */
  verb: string;
  /** Step numbers (1-based) this action covers. Empty for Wash: it happens before step 1. */
  steps: number[];
  /** What is worked on: the recipe's ingredients named in those steps. */
  items: ProcessItem[];
  /** What to do and tick off: the steps of this action, or the items to wash. */
  tasks: ProcessTask[];
  /** What the steps say, shown when no ingredient is named in them. */
  lines: string[];
  note?: string;
  /** Minutes the action takes by itself (a timed step: boil, simmer, bake). Hands are free meanwhile. */
  minutes?: number;
  /** Other actions that can run at the same time, and why: a timed action leaves your hands free for them. */
  alongside: { verb: string; label: string; minutes?: number }[];
}

// Only prep and a second pan can overlap with a timed action. Stirring things together, topping and serving need the rest done first.
// shortcut: by action name only, it cannot tell that a "Sauté" feeds the dal; the cook decides.
const OVERLAPS = new Set(["Chop", "Slice", "Grate", "Mash", "Mix", "Whisk", "Knead", "Roll", "Sauté", "Fry", "Sear", "Toast"]);

const RINSE = /rice|dal|lentil|chickpea|bean|quinoa|poha|oats?\b/;
const WASH = /tomato|spinach|palak|coriander|cilantro|mint|parsley|cucumber|lettuce|potato|carrot|pepper|capsicum|cauliflower|broccoli|cabbage|berr|okra|eggplant|brinjal|baingan|zucchini|apple|lemon|lime|beet|radish|celery|kale|peas|corn|mushroom/;

/** Does this ingredient need washing or rinsing first, and how? Rice, dal and beans are rinsed until clear; produce is washed. */
const washKind = (i: Ingredient): "rinse" | "wash" | null => {
  const n = i.name.toLowerCase();
  if (RINSE.test(n) && !/oats|rolled/.test(n)) return "rinse";
  return WASH.test(n) ? "wash" : null;
};

const named = (text: string, name: string) => {
  const t = text.toLowerCase();
  const last = foodKey(name.trim().split(/\s+/).pop() ?? "");
  // The whole name, or its last word ("dal" for "Toor dal"). shortcut: a generic last word can match a step that means something else.
  return t.includes(foodKey(name)) || t.includes(name.toLowerCase()) || (last.length >= 3 && new RegExp(`\\b${last}`).test(t));
};

/**
 * The whole cook as tiles by action, in the order the actions first happen: Wash, then Chop, Boil, and so on.
 * Each tile lists the ingredients its steps name, with the amount for the servings, so "Chop" shows everything to chop.
 * Plain rules, no model. shortcut: an ingredient is tied to a step only when the step's text names it.
 */
export function processTiles(recipe: Recipe, servings: number): ProcessTile[] {
  const item = (i: Ingredient): ProcessItem => {
    const qty = scaleQty(i.qty, recipe.servings, servings);
    const w = weightOf(i, qty);
    return { name: i.name, amount: `${fmtQuarters(qty)}${i.unit ? ` ${i.unit}` : ""}${w ? ` · ≈ ${w}` : ""}`.trim() };
  };

  const tiles: ProcessTile[] = [];
  const washed = recipe.ingredients.filter((i) => !i.optional && washKind(i));
  if (washed.length) {
    const rinse = washed.some((i) => washKind(i) === "rinse");
    tiles.push({
      verb: "Wash",
      steps: [],
      items: washed.map(item),
      tasks: washed.map((i) => ({ id: `w:${i.name}`, text: `${washKind(i) === "rinse" ? "Rinse" : "Wash"} ${i.name.toLowerCase()}` })),
      lines: [],
      alongside: [],
      note: rinse ? "Rinse dal, rice and beans until the water runs clear. Wash the rest under cold water." : "Wash under cold water and pat dry.",
    });
  }

  const order: string[] = [];
  for (const s of recipe.steps) if (!order.includes(s.verb)) order.push(s.verb);
  for (const verb of order) {
    const idx = recipe.steps.flatMap((s, n) => (s.verb === verb ? [n] : []));
    const texts = idx.map((n) => recipe.steps[n].text);
    const items = recipe.ingredients.filter((i) => texts.some((t) => named(t, i.name))).map(item);
    const minutes = idx.reduce((m, n) => m + (recipe.steps[n].minutes ?? 0), 0);
    const tasks = idx.map((n) => ({ id: `s:${n}`, text: recipe.steps[n].text, stepIndex: n, ...(recipe.steps[n].minutes ? { minutes: recipe.steps[n].minutes } : {}) }));
    tiles.push({ verb, steps: idx.map((n) => n + 1), items, tasks, lines: items.length ? [] : texts, alongside: [], ...(minutes ? { minutes } : {}) });
  }

  // Parallel work: while a timed action runs, hands-on actions that do not use the same food can go ahead.
  const label = (t: ProcessTile) => (t.items.length ? t.items.map((i) => i.name.toLowerCase()).join(", ") : t.lines[0] ?? t.verb.toLowerCase());
  const free = (t: ProcessTile, by: ProcessTile) => t.verb !== "Wash" && !t.minutes && OVERLAPS.has(t.verb) && !t.items.some((i) => by.items.some((j) => j.name === i.name));
  for (const timed of tiles.filter((t) => t.minutes)) {
    for (const other of tiles.filter((t) => t !== timed && free(t, timed))) {
      timed.alongside.push({ verb: other.verb, label: label(other) });
      other.alongside.push({ verb: timed.verb, label: label(timed), minutes: timed.minutes });
    }
  }
  return tiles;
}

export interface RecipeSection {
  /** "Marinade", "Masala"; "The dish" when the recipe has no parts. */
  title: string;
  ingredients: ProcessItem[];
  /** Steps of this part, numbered as in the whole recipe (1-based). */
  steps: { number: number; text: string; verb: string; minutes?: number }[];
}

/**
 * The whole recipe in one list, split by part (marinade, masala, rice...) when the recipe has parts, else one part.
 * Ingredients carry the amount for the servings and their weight; steps keep their number in the full order.
 */
export function recipeSections(recipe: Recipe, servings: number): RecipeSection[] {
  const amount = (i: Ingredient): ProcessItem => {
    const qty = scaleQty(i.qty, recipe.servings, servings);
    const w = weightOf(i, qty);
    return { name: i.name, amount: `${fmtQuarters(qty)}${i.unit ? ` ${i.unit}` : ""}${w ? ` · ≈ ${w}` : ""}`.trim() };
  };
  const titles: string[] = [];
  for (const g of [...recipe.ingredients.map((i) => i.group), ...recipe.steps.map((s) => s.group)]) {
    const t = g?.trim() || "";
    if (!titles.includes(t)) titles.push(t);
  }
  // Ungrouped things sit under the first part when there are parts, so nothing is lost.
  const main = titles.includes("") ? "" : (titles[0] ?? "");
  return (titles.length ? titles : [""]).map((t) => ({
    title: t || (titles.length > 1 ? "The dish" : "The dish"),
    ingredients: recipe.ingredients.filter((i) => (i.group?.trim() || "") === t).map(amount),
    steps: recipe.steps.flatMap((s, n) => ((s.group?.trim() || "") === t ? [{ number: n + 1, text: s.text, verb: s.verb, ...(s.minutes ? { minutes: s.minutes } : {}) }] : [])),
  })).filter((s) => s.ingredients.length || s.steps.length || main === "");
}

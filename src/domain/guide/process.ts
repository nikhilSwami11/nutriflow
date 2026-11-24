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
export interface ProcessTile {
  /** A cooking verb, or "Wash" for the rinsing before step 1. */
  verb: string;
  /** Step numbers (1-based) this action covers. Empty for Wash: it happens before step 1. */
  steps: number[];
  /** What is worked on: the recipe's ingredients named in those steps. */
  items: ProcessItem[];
  /** What the steps say, shown when no ingredient is named in them. */
  lines: string[];
  note?: string;
}

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
      lines: [],
      note: rinse ? "Rinse dal, rice and beans until the water runs clear. Wash the rest under cold water." : "Wash under cold water and pat dry.",
    });
  }

  const order: string[] = [];
  for (const s of recipe.steps) if (!order.includes(s.verb)) order.push(s.verb);
  for (const verb of order) {
    const idx = recipe.steps.flatMap((s, n) => (s.verb === verb ? [n] : []));
    const texts = idx.map((n) => recipe.steps[n].text);
    const items = recipe.ingredients.filter((i) => texts.some((t) => named(t, i.name))).map(item);
    tiles.push({ verb, steps: idx.map((n) => n + 1), items, lines: items.length ? [] : texts });
  }
  return tiles;
}

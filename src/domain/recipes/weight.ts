import { foodKey } from "../pantry/foodKey";
import type { Ingredient, IngredientForm } from "./types";

type Grams = Partial<Record<IngredientForm | "plain", number>>;
interface Food {
  /** Found in the lowercase ingredient name. More specific words come first. */
  key: string;
  /** The state assumed when the recipe does not say. */
  def: IngredientForm | "plain";
  cup?: Grams;
  tbsp?: number;
  tsp?: number;
  /** One piece, one can (drained) or one clove. */
  each?: Grams;
}

/**
 * Typical weights, rounded: US cup of 240 ml, USDA-style values. A cup of anything loose varies by brand and packing,
 * so every weight is shown as "about". shortcut: a short list of foods the demo recipes use; a food not here shows no weight.
 */
const FOODS: Food[] = [
  { key: "chickpea", def: "dry", cup: { dry: 200, soaked: 180, cooked: 165 }, each: { canned: 240 } },
  { key: "kidney bean", def: "dry", cup: { dry: 180, soaked: 170, cooked: 175 }, each: { canned: 240 } },
  { key: "black bean", def: "dry", cup: { dry: 190, soaked: 175, cooked: 170 }, each: { canned: 240 } },
  { key: "dal", def: "dry", cup: { dry: 200, cooked: 200 } },
  { key: "lentil", def: "dry", cup: { dry: 195, cooked: 200 } },
  { key: "rice", def: "dry", cup: { dry: 185, cooked: 160 } },
  { key: "quinoa", def: "dry", cup: { dry: 170, cooked: 185 } },
  { key: "rolled oat", def: "plain", cup: { plain: 80 } },
  { key: "flour", def: "plain", cup: { plain: 125 } },
  { key: "sugar", def: "plain", cup: { plain: 200 }, tbsp: 12, tsp: 4 },
  { key: "breadcrumb", def: "plain", cup: { plain: 110 } },
  { key: "milk", def: "plain", cup: { plain: 245 } },
  { key: "water", def: "plain", cup: { plain: 237 } },
  { key: "stock", def: "plain", cup: { plain: 240 } },
  { key: "cream", def: "plain", cup: { plain: 240 } },
  { key: "yogurt", def: "plain", cup: { plain: 245 }, tbsp: 15 },
  { key: "sour cream", def: "plain", cup: { plain: 230 } },
  { key: "paneer", def: "plain", cup: { plain: 150 } },
  { key: "cheddar", def: "plain", cup: { plain: 115 } },
  { key: "mozzarella", def: "plain", cup: { plain: 115 } },
  { key: "parmesan", def: "plain", cup: { plain: 100 } },
  { key: "feta", def: "plain", cup: { plain: 150 } },
  { key: "peas", def: "plain", cup: { plain: 145 } },
  { key: "corn", def: "plain", cup: { plain: 165 } },
  { key: "spinach", def: "plain", cup: { plain: 30 } },
  { key: "berries", def: "plain", cup: { plain: 150 } },
  { key: "salsa", def: "plain", cup: { plain: 260 } },
  { key: "marinara", def: "plain", cup: { plain: 250 } },
  { key: "crushed tomato", def: "plain", each: { plain: 400 } },
  { key: "ghee", def: "plain", tbsp: 14, tsp: 5 },
  { key: "butter", def: "plain", tbsp: 14, tsp: 5 },
  { key: "oil", def: "plain", tbsp: 14, tsp: 5 },
  { key: "tahini", def: "plain", tbsp: 15 },
  { key: "salt", def: "plain", tsp: 6 },
  { key: "cumin", def: "plain", tbsp: 6, tsp: 2 },
  { key: "masala", def: "plain", tbsp: 6, tsp: 2 },
  { key: "onion", def: "plain", each: { plain: 110 } },
  { key: "tomato", def: "plain", each: { plain: 120 } },
  { key: "banana", def: "plain", each: { plain: 120 } },
  { key: "lemon", def: "plain", each: { plain: 60 } },
  { key: "cucumber", def: "plain", each: { plain: 200 } },
  { key: "potato", def: "plain", each: { plain: 170 } },
  { key: "egg", def: "plain", each: { plain: 50 } },
];

const NAMED_FORM = /\b(soaked|cooked|canned)\b/;

const round = (g: number) => (g >= 50 ? Math.round(g / 5) * 5 : Math.round(g));
const show = (g: number) => (g >= 1000 ? `${Math.round(g / 100) / 10} kg` : `${round(g)} g`);

/**
 * About how much an ingredient weighs, in grams, and in what state ("dry", "soaked"): "400 g dry".
 * Null when the food or unit is not known: it never invents a weight. `qty` is the scaled amount for the servings.
 */
export function weightOf(i: Ingredient, qty: number): string | null {
  const name = i.name.toLowerCase();
  const food = FOODS.find((f) => name.includes(f.key) || foodKey(name).includes(f.key));
  if (!food || qty <= 0) return null;
  const unit = i.unit.trim().toLowerCase().replace(/s$/, "");
  const named = name.match(NAMED_FORM)?.[1] as IngredientForm | undefined;
  const form: IngredientForm | "plain" = i.form ?? named ?? (unit === "can" ? "canned" : food.def);

  let per: number | undefined;
  if (unit === "cup") per = food.cup?.[form];
  else if (unit === "tbsp") per = food.tbsp;
  else if (unit === "tsp") per = food.tsp;
  else if (unit === "can") per = food.each?.canned ?? food.each?.plain;
  else if (unit === "" || unit === "pc" || unit === "pcs" || unit === "piece") per = food.each?.[form] ?? food.each?.plain;
  if (!per) return null;
  return `${show(per * qty)}${form === "plain" ? "" : ` ${form}`}`;
}

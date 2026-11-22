import type { Diet } from "../nutrition/types";
import type { Recipe } from "../recipes/types";

export type RecipeDiet = "vegan" | "vegetarian" | "egg" | "nonveg";

const MEAT = /\b(chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|salmon|tuna|meat|bacon|keema|turkey|ham|sausage|pepperoni|anchov(y|ies))\b/i;
const EGG = /\begg/i;
const DAIRY = /\b(milk|ghee|butter|paneer|curd|yogurt|yoghurt|cheese|cream|honey)\b/i;

/** Read from the ingredient names, so every recipe has one without hand tagging. shortcut: English words only. */
export function dietOf(recipe: Recipe): RecipeDiet {
  const names = recipe.ingredients.map((i) => i.name);
  if (names.some((n) => MEAT.test(n))) return "nonveg";
  if (names.some((n) => EGG.test(n))) return "egg";
  return names.some((n) => DAIRY.test(n)) ? "vegetarian" : "vegan";
}

const OK: Record<Diet, RecipeDiet[]> = {
  anything: ["vegan", "vegetarian", "egg", "nonveg"],
  eggetarian: ["vegan", "vegetarian", "egg"],
  vegetarian: ["vegan", "vegetarian"],
  vegan: ["vegan"],
};

export const dietAllows = (diet: Diet | undefined, recipe: Recipe): boolean => OK[diet ?? "anything"].includes(dietOf(recipe));

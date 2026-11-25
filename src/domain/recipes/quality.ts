// A recipe written by an assistant (or by us) has to read like a cook wrote it: salt, a fat to cook in, aromatics, seasoning
// with amounts, and a last step that tastes and balances. This lists what is missing, in words the writer can act on.

const HEAT = new Set(["Sauté", "Fry", "Sear", "Roast", "Bake", "Simmer", "Boil", "Toast"]);
/** Sweet or raw breakfast-style dishes: no aromatics or spices expected. */
const SWEET = /smoothie|shake|oats|pancake|cake|pudding|dessert|halwa|kheer|fruit|parfait|muffin|ice cream|yogurt with|toast with/i;
const FAT = /\b(oil|ghee|butter|cream|coconut milk)\b/;
const AROMATIC = /onion|garlic|ginger|shallot|scallion|leek|chilli|chili/;
const SEASONING = /cumin|turmeric|chil|masala|pepper|paprika|oregano|cinnamon|mustard|cardamom|clove|garam|curry|thyme|basil|rosemary|za'atar|sumac|coriander|cilantro|parsley|mint|lemon|lime|vinegar|tamarind|dill|amchur|fenugreek|hing|asafoetida/;

export interface RecipeShape {
  name: string;
  ingredients: { name: string }[];
  steps: { text: string; verb: string }[];
}

/** What a recipe lacks to read like a real one. Empty when it passes. */
export function recipeProblems(r: RecipeShape): string[] {
  const names = r.ingredients.map((i) => i.name.toLowerCase());
  const has = (re: RegExp) => names.some((n) => re.test(n));
  const cooked = r.steps.some((s) => HEAT.has(s.verb));
  const sweet = SWEET.test(r.name);
  const out: string[] = [];
  if (!has(/\bsalt\b/)) out.push("Add salt as an ingredient with an amount (for example 1 tsp) and say in the steps when it goes in.");
  if (cooked && !has(FAT)) out.push("Add the cooking fat (oil, ghee or butter) with an amount.");
  if (cooked && !sweet && !has(AROMATIC)) out.push("Add the aromatics (onion, garlic, ginger or chilli) and say when they cook.");
  if (!sweet && !has(SEASONING)) out.push("Add seasoning with amounts: spices, fresh herbs, or something sour like lemon or vinegar.");
  if (!r.steps.some((s) => /taste|adjust|balance/i.test(s.text))) out.push("End with a step that tastes and balances the dish: adjust salt, sourness, heat and sweetness.");
  return out;
}

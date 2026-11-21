import type { PantryItem } from "../pantry/types";
import { scaleQty } from "../recipes/pantryMatch";
import type { Recipe, Step, Swap } from "../recipes/types";
import { FALLBACK_GUIDE, GENERIC_FIXES, GENERIC_SWAPS, VERB_GUIDE } from "./generic";

// Same plural fold the pantry uses. shortcut: English only.
const norm = (s: string) => s.trim().toLowerCase().replace(/(es|s)$/, "");

/** What to look for and a tip for one step: the step's own words, else the verb's. */
export function stepGuide(step: Step): { look: string; tip: string } {
  const v = VERB_GUIDE[step.verb] ?? FALLBACK_GUIDE;
  return { look: step.look ?? v.look, tip: step.tip ?? v.tip };
}

const fmt = (v: number) => {
  const w = Math.floor(v), f = v - w;
  const frac = f === 0.25 ? "¼" : f === 0.5 ? "½" : f === 0.75 ? "¾" : "";
  return `${w || ""}${frac}` || "0";
};

export interface PrepItem {
  id: string;
  text: string;
}

/** What to set out first. Authored for guided recipes; otherwise every ingredient, scaled to the servings. */
export function prepList(recipe: Recipe, servings: number): PrepItem[] {
  if (recipe.prep?.length) return recipe.prep.map((text, i) => ({ id: `p${i}`, text }));
  return recipe.ingredients.map((i, n) => ({ id: `p${n}`, text: `${fmt(scaleQty(i.qty, recipe.servings, servings))}${i.unit ? ` ${i.unit}` : ""} ${i.name.toLowerCase()}`.trim() }));
}

/** Stand-ins for an ingredient: this recipe's own first, then the common ones. */
export function swapsFor(recipe: Recipe, ingredient: string): Swap[] {
  const n = norm(ingredient);
  const own = (recipe.swaps ?? []).filter((s) => norm(s.ingredient) === n);
  const generic = GENERIC_SWAPS.filter((s) => n.includes(norm(s.ingredient)) || norm(s.ingredient).includes(n));
  return [...own, ...generic.filter((g) => !own.some((o) => o.use === g.use))];
}

export interface Answer {
  text: string;
  topic: "swap" | "time" | "done" | "amount" | "fix" | "next" | "repeat" | "tip" | "help";
}

export interface AnswerContext {
  recipe: Recipe;
  stepIndex: number;
  servings: number;
  pantry: PantryItem[];
}

const mentions = (q: string, name: string) => q.includes(norm(name)) || q.includes(name.toLowerCase());

/**
 * Answers a cook's question from the written guidance: this step, the ingredient list, the swaps and the fixes.
 * Plain keyword rules, no model: it only ever says what the recipe and the guide say. Anything else gets the list of what it can help with.
 */
export function answerQuestion(question: string, { recipe, stepIndex, servings, pantry }: AnswerContext): Answer {
  const q = question.trim().toLowerCase();
  const step = recipe.steps[stepIndex];
  const guide = stepGuide(step);
  const ingredient = recipe.ingredients.find((i) => mentions(q, i.name));

  // 1. a problem: "it is too salty", "burnt"
  const fixes = [...(recipe.fixes ?? []), ...GENERIC_FIXES];
  const fix = fixes.find((f) => q.includes(f.problem) || (f.problem === "burnt" && /\bburn/.test(q)) || (f.problem === "watery" && /\b(thin|runny)\b/.test(q)) || (f.problem === "sticking" && /\bstick/.test(q)));
  if (fix) return { topic: "fix", text: fix.fix };

  // 2. stand-ins: "I don't have butter", "what can I use instead of ghee"
  if (/\b(instead|substitut|replace|swap|alternative|don'?t have|do not have|out of|no more|run out|ran out|without)\b/.test(q)) {
    const name = ingredient?.name ?? GENERIC_SWAPS.map((s) => s.ingredient).find((n) => mentions(q, n));
    if (!name) return { topic: "swap", text: "Tell me which ingredient you are missing, for example: what can I use instead of butter?" };
    const swaps = swapsFor(recipe, name);
    if (!swaps.length) return { topic: "swap", text: `I do not have a stand-in for ${name.toLowerCase()}. It is best to leave it out or ask someone who has cooked this.` };
    const first = swaps[0];
    const have = pantry.find((p) => p.qty > 0 && norm(first.use).split(/ or |, /).some((u) => mentions(u, p.name)));
    return { topic: "swap", text: `Use ${first.use}.${first.note ? ` ${first.note}` : ""}${have ? ` You have ${have.name.toLowerCase()} in your pantry.` : ""}` };
  }

  // 3. how much of something
  if (/\b(how much|how many|quantity|amount)\b/.test(q)) {
    if (!ingredient) return { topic: "amount", text: "Tell me which ingredient, for example: how much garlic?" };
    const amt = scaleQty(ingredient.qty, recipe.servings, servings);
    return { topic: "amount", text: `${fmt(amt)}${ingredient.unit ? ` ${ingredient.unit}` : ""} ${ingredient.name.toLowerCase()} for ${servings} servings.` };
  }

  // 4. timing
  if (/\b(how long|how many minutes|how much time|minutes|timer|time)\b/.test(q)) {
    return { topic: "time", text: step.minutes ? `About ${step.minutes} minutes. There is a timer on this step.` : `This step has no fixed time. ${guide.look} The whole recipe takes about ${recipe.minutes} minutes.` };
  }

  // 5. doneness
  if (/\b(done|ready|cooked|enough|how (do|will|can) i know|when)\b/.test(q)) return { topic: "done", text: guide.look };

  if (/\b(tip|trick|advice|help me)\b/.test(q)) return { topic: "tip", text: guide.tip };

  // 6. navigation
  if (/\b(what'?s next|what is next|next step|after this|then what)\b/.test(q)) {
    const next = recipe.steps[stepIndex + 1];
    return { topic: "next", text: next ? `Next: ${next.text}.` : "That was the last step. Finish to log your meal." };
  }
  if (/\b(repeat|again|say that|read)\b/.test(q)) return { topic: "repeat", text: `${step.text}.` };

  return { topic: "help", text: "I can help with this step: how long it takes, how to tell it is done, how much of an ingredient, what to use instead of something, or what to do if it goes wrong." };
}

/** Questions worth offering for this step. */
export function suggestedQuestions(recipe: Recipe, stepIndex: number): string[] {
  const step = recipe.steps[stepIndex];
  return ["How do I know it is done?", step.minutes ? "How long does it take?" : "Any tips for this step?", "What can I use instead of butter?", "It is too salty"].slice(0, 4);
}

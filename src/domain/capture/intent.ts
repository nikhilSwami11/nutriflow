export type Intent =
  | { type: "pantry-add"; text: string }
  | { type: "eat" }
  | { type: "suggest" }
  | { type: "cook" }
  | { type: "unknown" };

/** What did the user mean by something said into the mic? A few plain phrases; anything else is "unknown". */
export function parseIntent(said: string): Intent {
  const t = said.trim().toLowerCase().replace(/[.!?]+$/, "");
  if (!t) return { type: "unknown" };
  if (/\bhungry\b|\bneed to eat\b|\bsomething to eat\b|\bfeed me\b|\bwhat should i eat\b/.test(t)) return { type: "eat" };
  if (/\bwhat (can|could|should) i (make|cook|eat)\b|\bwhat'?s for (dinner|lunch|breakfast|tonight)\b|\bsuggest\b/.test(t)) return { type: "suggest" };
  if (/\b(start|begin|let'?s)\b.*\bcook(ing)?\b/.test(t)) return { type: "cook" };
  if (/^(i (have|got|bought|picked up)|we have|add|bought)\b/.test(t)) return { type: "pantry-add", text: said.trim() };
  return { type: "unknown" };
}

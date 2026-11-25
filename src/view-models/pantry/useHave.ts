"use client";
import { usePantry } from "./usePantry";

export interface AskItem {
  name: string;
  qty: number;
  unit: string;
  /** What to use instead, with how much, when we know one ("fresh ginger and garlic... For 1 tbsp paste use..."). */
  swap?: string | null;
}

/** "I have it" puts the amount in the pantry; "Don't have" puts it on the shopping list (and the pantry now knows it is out). */
export function useHave() {
  const pantry = usePantry();
  return {
    have: (i: AskItem) => pantry.addHeard([{ name: i.name.toLowerCase(), qty: Math.max(1, Math.ceil(i.qty)) }]),
    dont: (i: AskItem) => pantry.addNames([{ name: i.name, qty: Math.max(1, Math.ceil(i.qty)) }]),
  };
}

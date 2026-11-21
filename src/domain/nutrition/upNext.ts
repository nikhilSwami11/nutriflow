import type { MealSlot } from "./types";

export type UpNextTask =
  | { id: string; kind: "log-meal"; slot: Exclude<MealSlot, "snack"> }
  | { id: "buy-low"; kind: "buy-low"; names: string[] };

const SLOT_HOUR = { breakfast: 8, lunch: 13, dinner: 19 } as const;
const SLOTS = ["breakfast", "lunch", "dinner"] as const;
const BUY_SCORE = 3.5;

export interface UpNextInput {
  /** Local hour 0-23. */
  hour: number;
  loggedSlots: MealSlot[];
  lowItemNames: string[];
}

/**
 * Ranks personal tasks, most relevant first. Lowest score wins:
 * a meal that is due (within an hour of its time or past it) scores its distance from now,
 * a meal still ahead scores 10 + hours to go, and running-low shopping sits at 3.5.
 */
export function rankUpNext({ hour, loggedSlots, lowItemNames }: UpNextInput): UpNextTask[] {
  const scored: { score: number; task: UpNextTask }[] = [];
  for (const slot of SLOTS) {
    if (loggedSlots.includes(slot)) continue;
    const t = SLOT_HOUR[slot];
    const score = hour >= t - 1 ? Math.abs(hour - t) : 10 + (t - hour);
    scored.push({ score, task: { id: `log-${slot}`, kind: "log-meal", slot } });
  }
  if (lowItemNames.length) scored.push({ score: BUY_SCORE, task: { id: "buy-low", kind: "buy-low", names: lowItemNames } });
  return scored.sort((a, b) => a.score - b.score).map((s) => s.task);
}

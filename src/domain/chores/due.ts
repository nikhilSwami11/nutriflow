import type { Chore, DateKey } from "./types";

const key = (d: Date): DateKey => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const at = (k: DateKey) => {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** The latest day a chore was meant to be done, on or before `today`. Once chores have none. */
export function lastDueDay(chore: Chore, today: DateKey): DateKey | null {
  if (chore.repeat === "daily") return today;
  if (chore.repeat === "once") return null;
  const t = at(today);
  const back = (t.getDay() - (chore.day ?? t.getDay()) + 7) % 7;
  return key(new Date(t.getFullYear(), t.getMonth(), t.getDate() - back));
}

/** Still to do: never done, or done before the latest day it was due. A once chore is due until done. */
export function isDue(chore: Chore, today: DateKey): boolean {
  if (chore.repeat === "once") return chore.lastDone === null;
  const due = lastDueDay(chore, today)!;
  return chore.lastDone === null || chore.lastDone < due;
}

/** Due for longer than today: a weekly chore whose day has passed. */
export const isOverdue = (chore: Chore, today: DateKey): boolean =>
  chore.repeat === "weekly" && isDue(chore, today) && lastDueDay(chore, today)! < today;

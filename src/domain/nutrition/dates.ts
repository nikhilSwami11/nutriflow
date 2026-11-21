import type { DateKey } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateKey = (d: Date): DateKey => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** n calendar days ending at `today`, oldest first. Built from y/m/d so DST can't skip a day. */
export function lastNDays(n: number, today: Date): DateKey[] {
  return Array.from({ length: n }, (_, i) =>
    toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - (n - 1 - i))),
  );
}

/** n calendar days starting at `today`, soonest first. */
export function nextNDays(n: number, today: Date): DateKey[] {
  return Array.from({ length: n }, (_, i) =>
    toDateKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)),
  );
}

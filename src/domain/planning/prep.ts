import type { Recipe } from "../recipes/types";

export interface PrepTask {
  /** Carries the date, so a ticked task resets tomorrow. */
  id: string;
  /** "Soak the rajma". */
  action: string;
  dish: string;
  recipeId: string;
  /** "now": for a meal later today. "tonight": the night before tomorrow's meal. */
  due: "now" | "tonight";
  forDay: "today" | "tomorrow";
}

// shortcut: English ingredient words only; canned beans need no soak. Add a rule here when a recipe needs one.
const SOAK = /\b(rajma|kidney beans?|chickpeas?|chana|chole|black beans?|dried beans?|lobia|black-eyed peas?)\b/i;
const MEAT = /\b(chicken|mutton|lamb|beef|pork|fish|prawns?|shrimp)\b/i;
const YOGURT = /\b(yogurt|yoghurt|curd)\b/i;

/** What must happen ahead of a dish, and whether it needs a night (true) or a couple of hours (false). */
function rulesFor(r: Recipe): { key: string; action: string; overnight: boolean }[] {
  const out: { key: string; action: string; overnight: boolean }[] = [];
  const soak = r.ingredients.find((i) => SOAK.test(i.name) && !/can/i.test(i.unit));
  if (soak) out.push({ key: "soak", action: `Soak the ${soak.name.toLowerCase()}`, overnight: true });
  if (/\bovernight\b/i.test(r.name)) out.push({ key: "set", action: `Set the ${r.name.toLowerCase()}`, overnight: true });
  const meat = r.ingredients.find((i) => MEAT.test(i.name));
  if (meat && r.ingredients.some((i) => YOGURT.test(i.name))) out.push({ key: "marinate", action: `Marinate the ${meat.name.toLowerCase()}`, overnight: false });
  return out;
}

/**
 * Jobs to do today so the next meals can be cooked: anything for a meal still ahead today is due now, and
 * night-before jobs (soaking, overnight oats) for tomorrow's meals are due tonight. Short jobs for tomorrow wait.
 */
export function prepTasks(date: string, todayLeft: Recipe[], tomorrow: Recipe[]): PrepTask[] {
  const today = todayLeft.flatMap((r) => rulesFor(r).map((t) => ({ r, t, due: "now" as const, forDay: "today" as const })));
  const next = tomorrow.flatMap((r) => rulesFor(r).filter((t) => t.overnight).map((t) => ({ r, t, due: "tonight" as const, forDay: "tomorrow" as const })));
  return [...today, ...next].map(({ r, t, due, forDay }) => ({ id: `${date}:${forDay}:${r.id}:${t.key}`, action: t.action, dish: r.name, recipeId: r.id, due, forDay }));
}

/** Which prep jobs are ticked done. Ids start with their date, so each day starts clean. */
export interface PrepDoneRepository {
  /** Ids ticked done for jobs of this date. */
  doneOn(date: string): Promise<string[]>;
  set(id: string, done: boolean): Promise<void>;
}

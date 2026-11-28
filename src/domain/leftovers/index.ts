import type { DateKey } from "../nutrition/types";
import type { Recipe } from "../recipes/types";

/** Cooked portions nobody ate yet. */
export interface Leftover {
  id: string;
  recipeId: string;
  name: string;
  /** Servings still in the fridge. */
  portions: number;
  madeOn: DateKey;
}

export interface LeftoverRepository {
  list(): Promise<Leftover[]>;
  add(item: Leftover): Promise<void>;
  /** Sets what is left; zero or less removes it. */
  setPortions(id: string, portions: number): Promise<void>;
}

/** How long cooked food is offered before it drops off the list. */
export const FRIDGE_DAYS = 3;

const dayNumber = (d: DateKey) => Math.floor(Date.parse(`${d}T00:00:00Z`) / 86_400_000);

/** What is still good: portions left and cooked within FRIDGE_DAYS. Newest first. */
export function activeLeftovers(all: Leftover[], today: DateKey): Leftover[] {
  return all
    .filter((l) => l.portions > 0 && dayNumber(today) - dayNumber(l.madeOn) <= FRIDGE_DAYS)
    .sort((a, b) => b.madeOn.localeCompare(a.madeOn));
}

/** The portions cooked but not eaten at the table, or null when nothing is left (under half a serving). */
export function leftoverFrom(recipe: Pick<Recipe, "id" | "name">, made: number, eaten: number, id: string, date: DateKey): Leftover | null {
  const portions = Math.round((made - eaten) * 2) / 2;
  return portions >= 0.5 ? { id, recipeId: recipe.id, name: recipe.name, portions, madeOn: date } : null;
}

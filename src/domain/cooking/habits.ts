export interface ServingHabit {
  recipeId: string;
  /** How many times it was cooked and eaten. */
  count: number;
  /** Average servings eaten. */
  avg: number;
}

export interface ServingHabitRepository {
  get(recipeId: string): Promise<ServingHabit | null>;
  save(habit: ServingHabit): Promise<void>;
}

export function updateHabit(prev: ServingHabit | null, recipeId: string, servingsEaten: number): ServingHabit {
  const count = (prev?.count ?? 0) + 1;
  const avg = ((prev?.avg ?? 0) * (prev?.count ?? 0) + servingsEaten) / count;
  return { recipeId, count, avg: Math.round(avg * 100) / 100 };
}

/** Servings to expect next time: the average, to the nearest half serving, never below half. One serving with no history. */
export function suggestedServings(habit: ServingHabit | null): number {
  if (!habit) return 1;
  return Math.max(0.5, Math.round(habit.avg * 2) / 2);
}

export function habitNote(recipeName: string, habit: ServingHabit): string {
  const s = suggestedServings(habit);
  const dish = recipeName.toLowerCase();
  if (s > 1) return `You ate more than one serving, so I will estimate your next ${dish} a little higher.`;
  if (s < 1) return `You ate less than one serving, so I will estimate your next ${dish} a little lower.`;
  return `You usually eat one serving of ${dish}.`;
}

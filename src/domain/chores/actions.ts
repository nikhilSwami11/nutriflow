import type { Chore, ChoreRepository, DateKey, Repeat } from "./types";

export interface ChoreDraft {
  title: string;
  repeat: Repeat;
  /** Weekday for weekly chores. */
  day?: number;
}

/** Trims the title; returns null for an empty one. */
export async function addChore(deps: { repo: ChoreRepository; newId: () => string }, draft: ChoreDraft): Promise<Chore | null> {
  const title = draft.title.trim();
  if (!title) return null;
  const chore: Chore = { id: deps.newId(), title, repeat: draft.repeat, day: draft.repeat === "weekly" ? draft.day : undefined, lastDone: null };
  await deps.repo.save(chore);
  return chore;
}

/** Marks done on `today`. Undo passes the previous `lastDone` back. */
export async function markChore(repo: ChoreRepository, id: string, lastDone: DateKey | null): Promise<void> {
  const chore = (await repo.list()).find((c) => c.id === id);
  if (chore) await repo.save({ ...chore, lastDone });
}

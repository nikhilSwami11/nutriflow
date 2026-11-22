export type DateKey = string; // YYYY-MM-DD, local time

export type Repeat = "daily" | "weekly" | "once";

export interface Chore {
  id: string;
  title: string;
  repeat: Repeat;
  /** Weekday 0 (Sunday) to 6, for weekly chores. */
  day?: number;
  /** The last day it was done; null when never. */
  lastDone: DateKey | null;
}

export interface ChoreRepository {
  list(): Promise<Chore[]>;
  /** Insert or update by id. */
  save(chore: Chore): Promise<void>;
  remove(id: string): Promise<void>;
}

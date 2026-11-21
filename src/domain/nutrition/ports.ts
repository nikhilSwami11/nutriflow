import type { DateKey, MealLog, Profile } from "./types";

export interface MealLogRepository {
  /** Inclusive on both ends. */
  listBetween(from: DateKey, to: DateKey): Promise<MealLog[]>;
  add(log: MealLog): Promise<void>;
}

export interface ProfileRepository {
  get(): Promise<Profile | null>;
  save(profile: Profile): Promise<void>;
}

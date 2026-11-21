import type { ProfileRepository } from "./ports";
import type { Profile, TargetRange } from "./types";

export const DEFAULT_RANGE: TargetRange = { min: 1800, max: 2100 };

export async function setTargetRange(repo: ProfileRepository, range: TargetRange): Promise<Profile> {
  if (!(range.min > 0) || !(range.max > range.min)) throw new Error("Range needs 0 < min < max");
  const profile = { range };
  await repo.save(profile);
  return profile;
}

/** Saved profile, or the starting range when none is saved yet. Does not save. */
export async function getTargetRange(repo: ProfileRepository): Promise<TargetRange> {
  return (await repo.get())?.range ?? DEFAULT_RANGE;
}

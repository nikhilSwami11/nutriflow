import type { ProfileRepository } from "./ports";
import type { Diet, Profile, TargetRange } from "./types";

export const DEFAULT_RANGE: TargetRange = { min: 1800, max: 2100 };

const cleanList = (xs: string[]): string[] => [...new Set(xs.map((x) => x.trim().toLowerCase()).filter(Boolean))].slice(0, 30);

/** Saves the target range, keeping the saved diet and dislikes. */
export async function setTargetRange(repo: ProfileRepository, range: TargetRange): Promise<Profile> {
  if (!(range.min > 0) || !(range.max > range.min)) throw new Error("Range needs 0 < min < max");
  const profile = { ...(await repo.get()), range };
  await repo.save(profile);
  return profile;
}

/** Saves the whole profile from the profile screen. Dislikes are trimmed, lower-cased and de-duplicated. */
export async function saveProfile(repo: ProfileRepository, input: { range: TargetRange; diet: Diet; dislikes: string[] }): Promise<Profile> {
  if (!(input.range.min > 0) || !(input.range.max > input.range.min)) throw new Error("Range needs 0 < min < max");
  const profile: Profile = { range: input.range, diet: input.diet, dislikes: cleanList(input.dislikes) };
  await repo.save(profile);
  return profile;
}

/** Saved profile, or the starting range when none is saved yet. Does not save. */
export async function getTargetRange(repo: ProfileRepository): Promise<TargetRange> {
  return (await repo.get())?.range ?? DEFAULT_RANGE;
}

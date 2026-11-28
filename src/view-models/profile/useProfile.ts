"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { APPLIANCES } from "@/domain/kitchen";
import { DEFAULT_RANGE, DIETS, saveProfile, type Diet } from "@/domain/nutrition";
import { useNutritionDeps } from "../nutrition/NutritionDeps";

// Presentation cannot import the domain: these reach it from here.
export { DIETS, APPLIANCES };
export type { Diet };

export const PROFILE = ["profile"];

export const DIET_LABEL: Record<Diet, string> = { anything: "Anything", vegetarian: "Vegetarian", eggetarian: "Eggetarian", vegan: "Vegan" };

export interface SaveInput { min: number; max: number; diet: Diet; dislikes: string; allergens?: string[]; appliances?: string[]; heightCm?: number; weightKg?: number }

export function useProfile() {
  const { profile } = useNutritionDeps();
  const qc = useQueryClient();
  const saved = useQuery({ queryKey: PROFILE, queryFn: () => profile.get() });
  const save = useMutation({
    mutationFn: (input: SaveInput) =>
      saveProfile(profile, { range: { min: input.min, max: input.max }, diet: input.diet, dislikes: input.dislikes.split(","), allergens: input.allergens, appliances: input.appliances, heightCm: input.heightCm, weightKg: input.weightKg }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROFILE }),
  });
  const p = saved.data ?? null;
  return {
    isLoading: saved.isLoading,
    /** False until the user has saved their preferences once. */
    exists: p !== null,
    min: p?.range.min ?? DEFAULT_RANGE.min,
    max: p?.range.max ?? DEFAULT_RANGE.max,
    diet: p?.diet ?? ("anything" as Diet),
    dislikes: (p?.dislikes ?? []).join(", "),
    saving: save.isPending,
    error: save.isError ? "Could not save. Check the calories: the top must be above the bottom." : null,
    save: (input: SaveInput) => save.mutateAsync(input).then(() => true, () => false),
  };
}


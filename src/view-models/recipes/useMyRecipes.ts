"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { setSaved, type Recipe } from "@/domain/recipes";
import { useEatDeps } from "../eat/EatDeps";

export const MY_RECIPES = ["my-recipes"];

/** Recipes written for or saved by this person, and the Save toggle used by Eat, recipe detail and cooking. */
export function useMyRecipes() {
  const { mine } = useEatDeps();
  const qc = useQueryClient();
  // No retries: if the table is unreachable the Recipes tab shows its empty state at once instead of a blank wait.
  const q = useQuery({ queryKey: MY_RECIPES, queryFn: () => mine.list(), retry: false });
  const saved = new Set((q.data ?? []).filter((m) => m.saved).map((m) => m.recipe.id));

  const save = useCallback(
    async (recipe: Recipe, on: boolean) => {
      await setSaved(mine, recipe, on);
      await Promise.all([qc.invalidateQueries({ queryKey: MY_RECIPES }), qc.invalidateQueries({ queryKey: ["recipes"] })]);
    },
    [mine, qc],
  );

  return { isLoading: q.isLoading, list: q.data ?? [], isSaved: (id: string) => saved.has(id), save };
}

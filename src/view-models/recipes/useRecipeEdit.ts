"use client";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { askAiToChange, saveEdited, toDraft, type DraftRecipe } from "@/domain/eat";
import type { Recipe } from "@/domain/recipes";
import { useEatDeps } from "../eat/EatDeps";
import { useProfile } from "../profile/useProfile";
import { MY_RECIPES, useMyRecipes } from "./useMyRecipes";

// Presentation cannot import the domain: these reach it from here.
export { toDraft };
export type { DraftRecipe, Recipe };

export const CHANGE_IDEAS = ["No onion", "Make it for 4", "More protein", "Spicier", "Faster"];

/** Edit a recipe by hand, or ask the AI to change it. Both give back the id of the recipe to open next (null when it failed). */
export function useRecipeEdit(recipe: Recipe) {
  const { mine, adapter, newId } = useEatDeps();
  const my = useMyRecipes();
  const profile = useProfile();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: MY_RECIPES }), qc.invalidateQueries({ queryKey: ["recipes"] })]);

  return {
    busy,
    error,
    /** Ask AI needs the account; without it the button is hidden. */
    canAskAi: !!adapter,
    askAi: async (instruction: string) => {
      setBusy(true);
      setError(null);
      try {
        const r = await askAiToChange({ mine, adapter, newId }, recipe, instruction, { diet: profile.diet, dislikes: profile.dislikes.split(",").map((d) => d.trim()).filter(Boolean) });
        await refresh();
        return r.id;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    save: async (draft: DraftRecipe) => {
      setBusy(true);
      setError(null);
      try {
        const r = await saveEdited({ mine, newId }, recipe, draft, my.list.some((m) => m.recipe.id === recipe.id));
        if (!r) {
          setError("A recipe needs a name, at least 2 ingredients and 2 steps.");
          return null;
        }
        await refresh();
        return r.id;
      } catch {
        setError("Could not save. Try again.");
        return null;
      } finally {
        setBusy(false);
      }
    },
  };
}

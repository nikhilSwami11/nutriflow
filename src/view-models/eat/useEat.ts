"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { boostFromSearch, parseWants, suggestMeals, type Want } from "@/domain/eat";
import { DEFAULT_RANGE, toDateKey } from "@/domain/nutrition";
import { useRecipeSearch } from "./EatDeps";
import { usePantryDeps } from "../pantry/PantryDeps";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { PROFILE } from "../profile/useProfile";
import { useRecipeRepo } from "../recipes/RecipeDeps";

export type { Want };
export const WANTS: { id: Want; label: string }[] = [
  { id: "quick", label: "Quick" },
  { id: "light", label: "Light" },
  { id: "protein", label: "High protein" },
  { id: "pantry", label: "Use what I have" },
];

export interface EatPick {
  id: string;
  name: string;
  /** "Ready to cook · 20 min · 420 kcal fits what is left today" */
  why: string;
  ready: boolean;
  minutes: number;
}

export function useEat() {
  const recipesRepo = useRecipeRepo();
  const { pantry } = usePantryDeps();
  const { profile, logs } = useNutritionDeps();
  const search = useRecipeSearch();
  const [wants, setWants] = useState<Want[]>([]);
  const [boost, setBoost] = useState<Record<string, number>>({});
  const [searching, setSearching] = useState(false);
  // One moment per visit, so the answer holds still while you read it.
  const [now] = useState(() => new Date());
  const today = toDateKey(now);

  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => recipesRepo.list() });
  const items = useQuery({ queryKey: ["pantry"], queryFn: () => pantry.list() });
  const prof = useQuery({ queryKey: PROFILE, queryFn: () => profile.get() });
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });

  const picks = useMemo(() => {
    if (!recipes.data || !items.data || !todayLogs.data || prof.data === undefined) return null;
    const max = prof.data?.range.max ?? DEFAULT_RANGE.max;
    const eaten = todayLogs.data.reduce((sum, l) => sum + l.kcal, 0);
    return suggestMeals({
      recipes: recipes.data,
      pantry: items.data,
      diet: prof.data?.diet,
      dislikes: prof.data?.dislikes,
      kcalLeft: eaten > 0 ? Math.max(0, max - eaten) : undefined,
      hour: now.getHours(),
      wants,
      boost,
    }).map<EatPick>((s) => ({ id: s.recipe.id, name: s.recipe.name, why: s.reasons.slice(0, 3).join(" · "), ready: s.ready, minutes: s.recipe.minutes }));
  }, [recipes.data, items.data, todayLogs.data, prof.data, wants, boost, now]);

  return {
    isLoading: picks === null,
    picks: picks ?? [],
    wants,
    /** Nothing saved yet: the answer is a guess, so say how to improve it. */
    needsProfile: prof.data === null,
    toggle: (w: Want) => setWants((xs) => (xs.includes(w) ? xs.filter((x) => x !== w) : [...xs, w])),
    searching,
    /** Words typed or said: their wishes join the chips, and (with Supabase) the meaning of the words is searched. */
    ask: async (text: string) => {
      setWants((xs) => [...new Set([...xs, ...parseWants(text)])]);
      if (!search || !text.trim()) return;
      setSearching(true);
      setBoost(await boostFromSearch(search, text));
      setSearching(false);
    },
  };
}

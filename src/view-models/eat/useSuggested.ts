"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { logRecipeEaten } from "@/domain/cooking";
import { suggested, type Badge, type Want } from "@/domain/eat";
import { DEFAULT_RANGE, toDateKey } from "@/domain/nutrition";
import { useCookDeps } from "../cook/CookDeps";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantry } from "../pantry/usePantry";
import { PROFILE } from "../profile/useProfile";
import { useRecipeRepo } from "../recipes/RecipeDeps";
import { useMyRecipes } from "../recipes/useMyRecipes";
import { WANTS } from "./useEat";

const SLOT = { Breakfast: "breakfast", Lunch: "lunch", Snack: "snack", Dinner: "dinner" } as const;
export type { Badge };

/** The Suggested page: what is already cooked, already prepped, or instant comes first. Rules only, so it answers at once. */
export function useSuggested() {
  const recipesRepo = useRecipeRepo();
  const { leftovers } = useCookDeps();
  const { profile, logs, prep } = useNutritionDeps();
  const pantry = usePantry();
  const qc = useQueryClient();
  const mine = useMyRecipes();
  const [round, setRound] = useState(0);
  const [wants, setWants] = useState<Want[]>([]);
  // One moment per visit, so the page holds still while you read it.
  const [now] = useState(() => new Date());
  const today = toDateKey(now);

  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => recipesRepo.list() });
  const prof = useQuery({ queryKey: PROFILE, queryFn: () => profile.get() });
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });
  const left = useQuery({ queryKey: ["leftovers"], queryFn: () => leftovers.list() });
  const prepDone = useQuery({ queryKey: ["prep-done", today], queryFn: () => prep.doneOn(today).catch(() => [] as string[]) });

  const ready = !mine.isLoading && !pantry.isLoading && !!recipes.data && !!left.data && (prof.data !== undefined || prof.isError);
  const eaten = (todayLogs.data ?? []).reduce((sum, l) => sum + l.kcal, 0);
  const dayMax = prof.data?.range.max ?? DEFAULT_RANGE.max;

  const picks = ready
    ? suggested({
        recipes: recipes.data!.filter((r) => !r.written || mine.isSaved(r.id)),
        pantry: pantry.view.groups.flatMap((g) => g.items),
        leftovers: left.data!,
        // Prep ids look like "2026-11-27:today:rajma:soak": the recipe is the third part.
        prepped: (prepDone.data ?? []).map((id) => id.split(":")[2]).filter(Boolean),
        today, hour: now.getHours(), diet: prof.data?.diet, dislikes: prof.data?.dislikes, kcalLeft: eaten > 0 ? Math.max(0, dayMax - eaten) : undefined, wants, limit: 12,
      })
    : [];
  // Badged picks first, then what the person kept, then the rest; five in all.
  const rank = (p: (typeof picks)[number]) => (p.badge ? 0 : mine.isSaved(p.recipe.id) ? 1 : 2);
  const sorted = [...picks].sort((a, b) => rank(a) - rank(b));
  // Refresh walks on through the rest; leftovers, prepped and instant picks stay put.
  const fixed = sorted.filter((p) => p.badge);
  const rest = sorted.filter((p) => !p.badge);
  const turn = rest.length ? (round * 4) % rest.length : 0;
  const shown = [...fixed, ...rest.slice(turn), ...rest.slice(0, turn)].slice(0, 5);

  return {
    isLoading: !ready,
    wants,
    refresh: () => setRound((n) => n + 1),
    toggle: (w: Want) => setWants((xs) => (xs.includes(w) ? xs.filter((x) => x !== w) : [...xs, w])),
    picks: shown.map((p) => ({
      id: p.recipe.id, name: p.recipe.name, image: p.recipe.image, tint: p.recipe.tint, badge: p.badge, note: p.note,
      facts: `${p.recipe.minutes} min · ${p.recipe.kcal} kcal`, leftoverId: p.leftoverId,
      /** Eat one cooked portion: logs it and takes it off the leftovers. */
      eatPortion: async () => {
        const l = left.data?.find((x) => x.id === p.leftoverId);
        if (!l) return;
        await logRecipeEaten(logs, { id: crypto.randomUUID(), date: today, slot: SLOT[p.recipe.meal], recipe: p.recipe, source: "cook" });
        await leftovers.setPortions(l.id, l.portions - 1);
        await Promise.all([qc.invalidateQueries({ queryKey: ["leftovers"] }), qc.invalidateQueries({ queryKey: ["meal-logs"] })]);
      },
    })),
  };
}
export { WANTS };

"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { whatToEat, type Idea, type Want } from "@/domain/eat";
import { cookability } from "@/domain/guide";
import { swapText } from "../home/useHome";
import { DEFAULT_RANGE, toDateKey } from "@/domain/nutrition";
import { shopUnitFor } from "@/domain/shopping";
import { useEatDeps } from "./EatDeps";
import { usePantry } from "../pantry/usePantry";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { PROFILE } from "../profile/useProfile";
import { useMyRecipes } from "../recipes/useMyRecipes";

export type { Want };
export const WANTS: { id: Want; label: string }[] = [
  { id: "quick", label: "Quick" },
  { id: "light", label: "Light" },
  { id: "protein", label: "High protein" },
  { id: "pantry", label: "Use what I have" },
];

/** "What should I eat?": a meal written for you now (or a built-in when the AI cannot), its one main action, two ideas. */
export function useEat() {
  const deps = useEatDeps();
  const pantry = usePantry();
  const my = useMyRecipes();
  const qc = useQueryClient();
  const { profile, logs } = useNutritionDeps();
  const [wants, setWants] = useState<Want[]>([]);
  const [idea, setIdea] = useState<string | null>(null);
  const [listed, setListed] = useState<string[]>([]);
  // One moment per visit, so the answer holds still while you read it.
  const [now] = useState(() => new Date());
  const today = toDateKey(now);

  const prof = useQuery({ queryKey: PROFILE, queryFn: () => profile.get() });
  const todayLogs = useQuery({ queryKey: ["meal-logs", today], queryFn: () => logs.listBetween(today, today) });
  const items = pantry.isLoading ? null : pantry.view.groups.flatMap((g) => g.items);
  // A profile or log read that fails counts as empty: the screen still answers (defaults) instead of waiting forever.
  const ready = !!items && (!!todayLogs.data || todayLogs.isError) && (prof.data !== undefined || prof.isError);

  const meal = useQuery({
    queryKey: ["what-to-eat", today, wants, idea],
    enabled: ready,
    // Written once per wish: coming back to the tab must not write (and pay for) a new meal.
    staleTime: Infinity,
    queryFn: async () => {
      const dayMax = prof.data?.range.max ?? DEFAULT_RANGE.max;
      const eaten = (todayLogs.data ?? []).reduce((sum, l) => sum + l.kcal, 0);
      const out = await whatToEat(deps, {
        builtins: await deps.builtins.list(), pantry: items!, diet: prof.data?.diet, dislikes: prof.data?.dislikes,
        dayMax, kcalLeft: eaten > 0 ? Math.max(0, dayMax - eaten) : undefined, hour: now.getHours(), wants, idea: idea ?? undefined,
      });
      // A written meal now exists by id: the cook and recipe screens read it from the recipe list.
      if (out.source === "ai") await qc.invalidateQueries({ queryKey: ["recipes"] });
      return out;
    },
  });

  const m = meal.data;
  const best = m && items ? (() => {
    const r = m.best;
    const cook = cookability(r, items);
    return {
      id: r.id, name: r.name, blurb: r.blurb, tint: r.tint, image: r.image, recipe: r,
      written: m.source === "ai",
      ready: cook.canCook,
      state: cook.state,
      missing: cook.needed.length,
      status: cook.canCook ? "Ready to cook" : cook.state === "check" ? "Check what you have" : `Missing ${cook.needed.length}`,
      ask: [...cook.unknown, ...cook.needed].map((x) => ({ name: x.name, qty: x.qty, unit: x.unit, swap: swapText(r, x.name) })),
      assumed: cook.assumed,
      facts: `${r.minutes} min · ${r.kcal} kcal · ${r.protein} g protein`,
      needs: cook.needed.map((x) => ({ name: x.name, qty: x.qty, unit: shopUnitFor(x.unit) })),
    };
  })() : null;

  return {
    isLoading: !ready || meal.isPending,
    error: meal.isError ? (meal.error instanceof Error ? meal.error.message : "Could not find a meal.") : null,
    best,
    ideas: (m?.ideas ?? []) as Idea[],
    wants,
    /** Nothing saved yet: the answer is a guess, so say how to improve it. */
    needsProfile: prof.data === null,
    toggle: (w: Want) => {
      setIdea(null);
      setWants((xs) => (xs.includes(w) ? xs.filter((x) => x !== w) : [...xs, w]));
    },
    /** Write out one of the ideas as the new best meal. */
    writeIdea: (name: string) => setIdea(name),
    saved: best ? my.isSaved(best.id) : false,
    toggleSave: () => best && void my.save(best.recipe, !my.isSaved(best.id)).catch(() => undefined),
    listed: best ? listed.includes(best.id) : false,
    addMissing: async () => {
      if (!best) return;
      await pantry.addNames(best.needs);
      setListed((l) => [...l, best.id]);
    },
  };
}

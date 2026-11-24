"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { nextNDays } from "@/domain/nutrition";
import type { PantryItem } from "@/domain/pantry";
import { ensurePlan, plannableRecipes, redoPlan, weekBalance, type Focus } from "@/domain/planning";
import { useDashboardRepo } from "../dashboard/DashboardDeps";
import { fmtDowLong } from "../dashboard/chartModel";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantry } from "../pantry/usePantry";
import { PROFILE } from "../profile/useProfile";
import { useRecipeRepo } from "../recipes/RecipeDeps";

/**
 * Shared by Home, Plan and Shopping: recipes, the dashboard (your logs, or demo data offline), and the week planned from them. The week is
 * ready without asking: it keeps to your diet and skipped foods and prefers what your pantry can already cook.
 */
export function usePlanData() {
  const recipesRepo = useRecipeRepo();
  const dash = useDashboardRepo();
  const { profile, plans } = useNutritionDeps();
  const qc = useQueryClient();
  const pantry = usePantry();
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => recipesRepo.list() });
  // Under "meal-logs" so logging a meal refreshes it; the profile is in the key so a new calorie range does too.
  const prof = useQuery({ queryKey: PROFILE, queryFn: () => profile.get() });
  const dashboard = useQuery({ queryKey: ["meal-logs", "dashboard", prof.data?.range], queryFn: () => dash.get(), enabled: prof.data !== undefined });
  // The pantry as it was when the page opened: ticking a bought item must not swap today's meals under you.
  const [stock, setStock] = useState<PantryItem[] | null>(null);
  if (!stock && !pantry.isLoading) setStock(pantry.view.groups.flatMap((g) => g.items));
  const [dates] = useState(() => nextNDays(7, new Date()));

  const inputs = useMemo(() => {
    if (!recipes.data || !dashboard.data || prof.data === undefined || !stock) return null;
    const d = dashboard.data;
    const goals = { calories: d.goals.calories, protein: d.goals.protein };
    const plannable = plannableRecipes(recipes.data, prof.data);
    return { recipes: recipes.data, dashboard: d, goals, plannable, input: { recipes: plannable, goals, history: d.history, dates, pantry: stock } };
  }, [recipes.data, dashboard.data, prof.data, stock, dates]);

  // The stored week (same one the chat reads); a day that no longer fits your diet or dislikes is planned again.
  const key = ["meal-plan", dates[0], prof.data?.diet, prof.data?.dislikes?.join(",")];
  const stored = useQuery({ queryKey: key, queryFn: () => ensurePlan(plans, inputs!.input), enabled: !!inputs, staleTime: Infinity });

  return useMemo(() => {
    if (!inputs || !stored.data) return null;
    const plan = stored.data;
    const focus: Focus = plan[0]?.focus ?? "balanced";
    return {
      recipes: inputs.recipes,
      dashboard: inputs.dashboard,
      plan,
      focus,
      /** Plans the week again from today with this focus, for every door. */
      setFocus: async (f: Focus) => {
        if (f === focus) return;
        qc.setQueryData(key, await redoPlan(plans, { ...inputs.input, focus: f }));
      },
      balance: weekBalance(plan, inputs.plannable, inputs.goals, fmtDowLong),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is derived from prof.data and dates, both listed
  }, [inputs, stored.data, plans, qc]);
}

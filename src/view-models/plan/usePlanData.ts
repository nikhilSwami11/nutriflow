"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { nextNDays } from "@/domain/nutrition";
import { planWeek, weekBalance, type Focus } from "@/domain/planning";
import { useDashboardRepo } from "../dashboard/DashboardDeps";
import { fmtDowLong } from "../dashboard/chartModel";
import { useRecipeRepo } from "../recipes/RecipeDeps";

/** Shared by Home and Plan: recipes, the dashboard demo data, and the planned week built from them. */
export function usePlanData(focus: Focus) {
  const recipesRepo = useRecipeRepo();
  const dash = useDashboardRepo();
  const recipes = useQuery({ queryKey: ["recipes"], queryFn: () => recipesRepo.list() });
  const dashboard = useQuery({ queryKey: ["dashboard"], queryFn: () => dash.get() });

  return useMemo(() => {
    if (!recipes.data || !dashboard.data) return null;
    const d = dashboard.data;
    const goals = { calories: d.goals.calories, protein: d.goals.protein };
    const plan = planWeek({ recipes: recipes.data, goals, history: d.history, dates: nextNDays(7, new Date()), focus });
    return { recipes: recipes.data, dashboard: d, plan, balance: weekBalance(plan, recipes.data, goals, fmtDowLong) };
  }, [recipes.data, dashboard.data, focus]);
}

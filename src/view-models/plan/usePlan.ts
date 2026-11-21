"use client";
import { useState } from "react";
import { dayBalance, type Focus } from "@/domain/planning";
import type { Recipe } from "@/domain/recipes";
import { fmtDate, fmtDowLong, num } from "../dashboard/chartModel";
import { usePlanData } from "./usePlanData";

export function usePlan() {
  const [focus, setFocus] = useState<Focus>("balanced");
  const data = usePlanData(focus);

  if (!data) return { isLoading: true as const };
  const { recipes, dashboard, plan, balance } = data;
  const goals = { calories: dashboard.goals.calories, protein: dashboard.goals.protein };
  const byId = new Map(recipes.map((r) => [r.id, r]));

  return {
    isLoading: false as const,
    focus,
    setFocus,
    goals: `${num(goals.calories)} kcal and ${goals.protein} g protein a day`,
    summary: [
      { label: "Average calories", value: `${num(balance.avgKcal)} kcal`, goal: `goal ${num(goals.calories)}` },
      { label: "Average protein", value: `${balance.avgProtein} g`, goal: `goal ${goals.protein} g` },
    ],
    notes: balance.notes,
    days: plan.map((day, i) => {
      const b = dayBalance(day, recipes, goals);
      return {
        date: day.date,
        name: i === 0 ? "Today" : fmtDowLong(day.date),
        sub: fmtDate(day.date),
        kcal: `${num(b.kcal)} kcal`,
        protein: `${b.protein} g protein`,
        kcalStatus: b.kcalStatus,
        proteinStatus: b.proteinStatus,
        meals: day.meals.map((m) => {
          const r = byId.get(m.recipeId) as Recipe;
          return { meal: m.meal, id: r.id, name: r.name, kcal: r.kcal, protein: r.protein, tint: r.tint };
        }),
      };
    }),
  };
}
export type PlanModel = Extract<ReturnType<typeof usePlan>, { isLoading: false }>;

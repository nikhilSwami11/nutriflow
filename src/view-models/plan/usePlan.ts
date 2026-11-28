"use client";
import { useState } from "react";
import { dayBalance, type Focus } from "@/domain/planning";
import type { Recipe } from "@/domain/recipes";
import { fmtDate, fmtDowLong, num } from "../dashboard/chartModel";
import { usePlanData } from "./usePlanData";

export function usePlan() {
  const [selected, setSelected] = useState(0); // 0 is today
  const data = usePlanData();

  if (!data) return { isLoading: true as const };
  const { recipes, dashboard, plan, balance } = data;
  const goals = { calories: dashboard.goals.calories, protein: dashboard.goals.protein };
  const byId = new Map(recipes.map((r) => [r.id, r]));

  return {
    isLoading: false as const,
    focus: data.focus,
    setFocus: (f: Focus) => void data.setFocus(f),
    selected: Math.min(selected, plan.length - 1),
    select: setSelected,
    goals: `${num(goals.calories)} kcal and ${goals.protein} g protein a day`,
    /** False for a new account: no meals logged yet to learn from. */
    fromHistory: Object.keys(dashboard.history).length > 0,
    summary: [
      { label: "Average calories", value: `${num(balance.avgKcal)} kcal`, goal: `goal ${num(goals.calories)}` },
      { label: "Average protein", value: `${balance.avgProtein} g`, goal: `goal ${goals.protein} g` },
    ],
    notes: balance.notes,
    /** A day is short on protein and the week is not already planned for protein: one tap fixes it. */
    canFixProtein: data.focus !== "protein" && balance.days.some((d) => d.proteinStatus === "under"),
    days: plan.map((day, i) => {
      const b = dayBalance(day, recipes, goals);
      return {
        date: day.date,
        name: i === 0 ? "Today" : fmtDowLong(day.date),
        short: i === 0 ? "Today" : fmtDowLong(day.date).slice(0, 3),
        dayNumber: day.date.slice(-2).replace(/^0/, ""),
        sub: fmtDate(day.date),
        kcal: `${num(b.kcal)} kcal`,
        protein: `${b.protein} g protein`,
        kcalStatus: b.kcalStatus,
        proteinStatus: b.proteinStatus,
        meals: day.meals.map((m) => {
          const r = byId.get(m.recipeId) as Recipe;
          return { meal: m.meal, id: r.id, name: r.name, kcal: r.kcal, protein: r.protein, tint: r.tint, image: r.image };
        }),
      };
    }),
  };
}
export type PlanModel = Extract<ReturnType<typeof usePlan>, { isLoading: false }>;

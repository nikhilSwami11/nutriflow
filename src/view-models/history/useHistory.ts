"use client";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { DEFAULT_RANGE, dayStatus, logsByDate, monthGrid, monthSpan, toDateKey } from "@/domain/nutrition";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { useRecipeRepo } from "../recipes/RecipeDeps";

export interface HistoryMeal {
  id: string;
  name: string;
  slot: string;
  kcal: number;
  /** The dish picture when the meal came from a recipe that has one. */
  image?: string;
  tint: string;
}
export interface HistoryCell {
  date: string;
  day: number;
  inMonth: boolean;
  today: boolean;
  kcal: number | null;
  status: "in" | "out" | null;
  meals: HistoryMeal[];
}

const MONTH = (y: number, m: number) => new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
const LONG = (d: string) => { const [y, m, day] = d.split("-").map(Number); return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }); };
const TINT = { breakfast: "var(--butter-soft)", lunch: "var(--mint-soft)", snack: "var(--peach)", dinner: "var(--lavender-soft)" } as const;

/** Past meals on a calendar: each logged day shows its dishes, tap a day for the list. */
export function useHistory() {
  const { logs, profile } = useNutritionDeps();
  const recipes = useRecipeRepo();
  const [now] = useState(() => new Date());
  const [offset, setOffset] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const shown = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = shown.getFullYear();
  const m = shown.getMonth();
  const today = toDateKey(now);
  const span = monthSpan(y, m);

  const data = useQuery({ queryKey: ["history", span.from, span.to], queryFn: () => logs.listBetween(span.from, span.to) });
  const all = useQuery({ queryKey: ["recipes"], queryFn: () => recipes.list() });
  const prof = useQuery({ queryKey: ["profile"], queryFn: () => profile.get() });
  const range = prof.data?.range ?? DEFAULT_RANGE;

  const byId = new Map((all.data ?? []).map((r) => [r.id, r]));
  const byDate = logsByDate(data.data ?? []);
  const cells: HistoryCell[] = monthGrid(y, m).map((c) => {
    const day = byDate.get(c.date) ?? [];
    const kcal = day.length ? day.reduce((s, l) => s + l.kcal, 0) : null;
    return {
      ...c,
      today: c.date === today,
      kcal,
      status: dayStatus(kcal, range),
      meals: day.map((l) => {
        const r = l.recipeId ? byId.get(l.recipeId) : undefined;
        return { id: l.id, name: l.name, slot: l.slot[0].toUpperCase() + l.slot.slice(1), kcal: l.kcal, image: r?.image, tint: r?.tint ?? TINT[l.slot] };
      }),
    };
  });

  const selected = picked ?? (cells.some((c) => c.date === today) ? today : cells.find((c) => c.inMonth)!.date);
  const sel = cells.find((c) => c.date === selected);
  return {
    isLoading: data.isLoading,
    title: MONTH(y, m),
    cells,
    canNext: offset < 0,
    prev: () => (setOffset((o) => o - 1), setPicked(null)),
    next: () => (setOffset((o) => Math.min(0, o + 1)), setPicked(null)),
    pick: (d: string) => setPicked(d),
    selected,
    selectedTitle: LONG(selected),
    selectedMeals: sel?.meals ?? [],
    selectedKcal: sel?.kcal ?? null,
    /** Nothing logged in the whole month shown. */
    empty: !cells.some((c) => c.meals.length),
    /** No history at all yet (this month is empty and so is every month we have seen): a first-time note. */
    range,
  };
}

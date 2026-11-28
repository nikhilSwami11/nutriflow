"use client";
import { useState } from "react";
import { batchCook, nextCookDates } from "@/domain/planning";
import { toDateKey } from "@/domain/nutrition";
import { fmtDowLong } from "../dashboard/chartModel";
import { usePlanData } from "./usePlanData";

const KEY = "nutriflow.cookDays";
const DEFAULT_DAYS = [1, 4]; // Monday and Thursday
const DAYS = [{ n: 1, label: "Mon" }, { n: 2, label: "Tue" }, { n: 3, label: "Wed" }, { n: 4, label: "Thu" }, { n: 5, label: "Fri" }, { n: 6, label: "Sat" }, { n: 0, label: "Sun" }];

const read = (): number[] => {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(v) && v.length && v.every((n) => Number.isInteger(n) && n >= 0 && n <= 6)) return v;
  } catch { /* private window or bad value: use the default */ }
  return DEFAULT_DAYS;
};

const hours = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}`);

/** The week as a few cooking days: cook on Monday and Thursday, and the rest of the days you reheat and eat. */
export function useCookPlan() {
  const data = usePlanData();
  const [weekdays, setWeekdays] = useState(read);
  const [today] = useState(() => toDateKey(new Date()));

  const toggleDay = (n: number) => {
    const next = weekdays.includes(n) ? weekdays.filter((d) => d !== n) : [...weekdays, n];
    if (!next.length || next.length > 3) return; // one to three cook days
    setWeekdays(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* the choice just lasts this visit */ }
  };

  const batch = data ? batchCook(data.plan, data.recipes, nextCookDates(today, weekdays)) : null;
  const byId = new Map((data?.recipes ?? []).map((r) => [r.id, r]));
  const name = (id: string) => byId.get(id)?.name ?? "";
  const at = (d: string, meal: string) => `${fmtDowLong(d).slice(0, 3)} ${meal.toLowerCase()}`;

  return {
    isLoading: !data,
    days: DAYS.map((d) => ({ ...d, on: weekdays.includes(d.n), toggle: () => toggleDay(d.n) })),
    sessions: (batch?.sessions ?? []).map((s) => ({
      date: s.date,
      title: fmtDowLong(s.date),
      time: `About ${hours(s.minutes)}`,
      meals: s.covers.length,
      dishes: s.dishes.map((d) => ({ id: d.recipe.id, name: d.recipe.name, image: d.recipe.image, tint: d.recipe.tint, servings: d.servings, eats: s.covers.filter((c) => c.recipeId === d.recipe.id).map((c) => at(c.date, c.meal)).join(", ") })),
    })),
    fresh: (batch?.fresh ?? []).map((f) => ({ key: `${f.date}${f.meal}`, text: `${at(f.date, f.meal)}: ${name(f.recipeId)}` })),
  };
}

"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { chartStats, leftKcal, logPlannedMeal, macroShares, type DashboardData } from "@/domain/dashboard";
import { rankUpNext } from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { useDashboardRepo } from "../dashboard/DashboardDeps";
import { joinList } from "../format";
import { usePantry } from "../pantry/usePantry";

const num = (n: number) => n.toLocaleString("en-US");
const parse = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
};
const fmtDate = (d: string) => parse(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtDow = (d: string) => parse(d).toLocaleDateString("en-US", { weekday: "short" });

/** Top of the chart's y axis, kcal. */
export const CHART_MAX = 2400;

export type Range = "7d" | "30d";

export function useHome() {
  const repo = useDashboardRepo();
  const pantry = usePantry();
  const base = useQuery({ queryKey: ["dashboard"], queryFn: () => repo.get() });
  const [range, setRange] = useState<Range>("7d");
  const [dinnerLogged, setDinnerLogged] = useState(false);
  const [accepted, setAccepted] = useState<string[]>([]);

  const data: DashboardData | null = useMemo(
    () => (base.data ? (dinnerLogged ? logPlannedMeal(base.data, "Dinner") : base.data) : null),
    [base.data, dinnerLogged],
  );
  const days = useMemo(() => (data ? (range === "7d" ? data.days.slice(-7) : data.days) : null), [data, range]);

  if (!data || !days) return { isLoading: true as const };
  const { goals } = data;
  const today = data.days[data.days.length - 1];
  const n = days.length;
  const stats = chartStats(days);
  const eatenTotal = today.eaten;

  const tile = (label: string, eaten: number, goal: number, unit: string, color: string) => ({
    label,
    value: eaten,
    unit,
    sub: `of ${num(goal)}${unit ? ` ${unit}` : " kcal"}`,
    pct: Math.min(100, (eaten / goal) * 100),
    color,
  });

  const lowItems = pantry.view.groups.flatMap((g) => g.items).filter(isLow);
  const tasks = rankUpNext({
    hour: new Date().getHours(),
    loggedSlots: data.meals.filter((m) => m.eaten > 0).map((m) => m.slot),
    lowItemNames: lowItems.map((i) => i.name.toLowerCase()),
  })
    .slice(0, 4)
    .map((t) =>
      t.kind === "log-meal"
        ? { id: t.id, kind: "meal" as const, title: `Log ${t.slot}`, hint: "Log" }
        : { id: t.id, kind: "pantry" as const, title: `Buy ${joinList(t.names)}`, hint: pantry.listed ? "On the list" : "Add to list" },
    );

  return {
    isLoading: false as const,
    dateLabel: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    tiles: [
      tile("Calories", eatenTotal, goals.calories, "", "#8FD3C0"),
      tile("Protein", today.macros.protein, goals.protein, "g", "#F2A3A9"),
      tile("Carbs", today.macros.carbs, goals.carbs, "g", "#9EC8F3"),
      tile("Fat", today.macros.fat, goals.fat, "g", "#B9A7EE"),
    ],
    chart: {
      title: `Calories and macros, ${range === "7d" ? "last 7 days" : "last 30 days"}`,
      range,
      setRange: (r: Range) => setRange(r),
      /** One entry per day, already formatted: the chart only draws. */
      points: days.map((d, i) => {
        const isToday = i === n - 1;
        const [p, c, f] = macroShares(d.macros);
        const top = Math.min(d.eaten, CHART_MAX);
        return {
          axis: range === "7d" ? fmtDow(d.date) : fmtDate(d.date),
          title: isToday ? "Today" : fmtDate(d.date),
          eaten: d.eaten,
          planned: d.planned,
          bands: [top * p, top * c, top * f] as [number, number, number],
          lines: [
            `Eaten ${num(d.eaten)} kcal`,
            `Planned ${num(d.planned)} kcal`,
            `Protein ${d.macros.protein} g`,
            `Carbs ${d.macros.carbs} g`,
            `Fats ${d.macros.fat} g`,
          ],
          footer: isToday
            ? `${num(leftKcal(d.planned, d.eaten))} kcal left today`
            : `${d.eaten - d.planned >= 0 ? "+" : "-"}${num(Math.abs(d.eaten - d.planned))} kcal vs plan`,
          summary: `${isToday ? "Today" : fmtDate(d.date)}, eaten ${num(d.eaten)} kcal, planned ${num(d.planned)} kcal`,
        };
      }),
      stats: [
        { label: "Average eaten", value: `${num(stats.avgEaten)} kcal` },
        { label: "Average planned", value: `${num(stats.avgPlanned)} kcal` },
        { label: "Days within 10% of plan", value: `${stats.onPlan} of ${stats.pastDays}` },
      ],
      aria: `Calories and macros for the ${range === "7d" ? "last 7" : "last 30"} days. Average eaten ${num(stats.avgEaten)} kcal against ${num(stats.avgPlanned)} planned.`,
    },
    plan: {
      eatenValue: eatenTotal,
      goal: num(goals.calories),
      left: `${num(leftKcal(goals.calories, eatenTotal))} left`,
      fill: Math.min(100, (eatenTotal / goals.calories) * 100),
      over: eatenTotal > goals.calories,
      meals: data.meals.map((m) => ({
        name: m.name,
        text: m.eaten === 0 ? `Planned ${m.planned} kcal` : `${m.eaten} of ${m.planned} kcal`,
        pending: m.eaten === 0,
        over: m.eaten > m.planned,
      })),
      dinnerLogged,
      logDinner: () => setDinnerLogged(true),
    },
    tonight: data.tonight,
    suggestions: data.suggestions.map((s) => ({ ...s, done: accepted.includes(s.id), accept: () => setAccepted((a) => (a.includes(s.id) ? a : [...a, s.id])) })),
    tasks,
    toggleBuy: pantry.toggleList,
    pantryAlert: lowItems.length
      ? {
          rows: lowItems.slice(0, 3).map((i) => ({
            id: i.id,
            name: i.name,
            qty: `${i.qty} ${i.unit}`,
            pct: i.lowAt > 0 ? Math.min(100, (i.qty / (i.lowAt * 2)) * 100) : 0,
          })),
          listed: pantry.listed,
          toggle: pantry.toggleList,
        }
      : null,
  };
}
export type HomeModel = Extract<ReturnType<typeof useHome>, { isLoading: false }>;

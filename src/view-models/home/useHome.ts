"use client";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { chartStats, leftKcal, logPlannedMeal, type DashboardData } from "@/domain/dashboard";
import { rankUpNext } from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { buildChart, Y_MAX } from "../dashboard/chart";
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

export type Range = "7d" | "30d";
const BAR_MAX = 700;

export function useHome() {
  const repo = useDashboardRepo();
  const pantry = usePantry();
  const base = useQuery({ queryKey: ["dashboard"], queryFn: () => repo.get() });
  const [range, setRange] = useState<Range>("7d");
  const [hover, setHover] = useState<number | null>(null);
  const [dinnerLogged, setDinnerLogged] = useState(false);
  const [accepted, setAccepted] = useState<string[]>([]);

  const data: DashboardData | null = useMemo(
    () => (base.data ? (dinnerLogged ? logPlannedMeal(base.data, "Dinner") : base.data) : null),
    [base.data, dinnerLogged],
  );
  const days = useMemo(() => (data ? (range === "7d" ? data.days.slice(-7) : data.days) : null), [data, range]);
  // Stable between hovers so the chart paths don't rebuild on every pointer move.
  const geo = useMemo(() => (days ? buildChart(days) : null), [days]);

  if (!data || !days || !geo) return { isLoading: true as const };
  const { goals } = data;
  const today = data.days[data.days.length - 1];
  const n = days.length;
  const ai = hover === null ? n - 1 : Math.min(hover, n - 1);
  const act = days[ai];
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
      geo,
      title: `Calories and macros, ${range === "7d" ? "last 7 days" : "last 30 days"}`,
      range,
      setRange: (r: Range) => {
        setRange(r);
        setHover(null);
      },
      setHover,
      yTicks: [0, 0.25, 0.5, 0.75, 1].map((f) => ({ label: num(Math.round(Y_MAX * f)), top: (1 - f) * 100 })),
      xLabels: days
        .map((d, i) => ({ i, left: geo.xPct(i), text: range === "7d" ? fmtDow(d.date) : fmtDate(d.date) }))
        .filter((x) => range === "7d" || x.i % 5 === n % 5 || x.i === n - 1),
      count: n,
      active: {
        i: ai,
        x: geo.xPct(ai),
        y: geo.yPct(act.eaten),
        flip: ai > n / 2,
        date: ai === n - 1 ? "Today" : fmtDate(act.date),
        eaten: `${num(act.eaten)} kcal`,
        planned: `${num(act.planned)} kcal`,
        protein: `${act.macros.protein} g`,
        carbs: `${act.macros.carbs} g`,
        fat: `${act.macros.fat} g`,
        summary: `${ai === n - 1 ? "Today" : fmtDate(act.date)}, eaten ${num(act.eaten)} kcal, planned ${num(act.planned)} kcal`,
        goal:
          ai === n - 1
            ? `${num(leftKcal(act.planned, act.eaten))} kcal left today`
            : `${act.eaten - act.planned >= 0 ? "+" : "-"}${num(Math.abs(act.eaten - act.planned))} kcal vs plan`,
      },
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
        eatenW: (Math.min(m.eaten, m.planned) / BAR_MAX) * 100,
        overL: (m.planned / BAR_MAX) * 100,
        overW: m.eaten > m.planned ? ((m.eaten - m.planned) / BAR_MAX) * 100 : 0,
        pendingW: m.eaten === 0 ? (m.planned / BAR_MAX) * 100 : 0,
        tickL: (m.planned / BAR_MAX) * 100,
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

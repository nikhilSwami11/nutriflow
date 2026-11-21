"use client";
import { useQuery } from "@tanstack/react-query";
import {
  dayTotal,
  getTargetRange,
  intakeStatus,
  lastNDays,
  logsForDay,
  rankUpNext,
  toDateKey,
  weekSeries,
} from "@/domain/nutrition";
import { isLow } from "@/domain/pantry";
import { joinList } from "../format";
import { useNutritionDeps } from "../nutrition/NutritionDeps";
import { usePantry } from "../pantry/usePantry";
import { buildTrend } from "./trend";

const num = (n: number) => n.toLocaleString("en-US");

export function useHome() {
  const { logs, profile } = useNutritionDeps();
  const pantry = usePantry();
  const now = new Date();
  const dates = lastNDays(7, now);
  const today = toDateKey(now);

  const range = useQuery({ queryKey: ["range"], queryFn: () => getTargetRange(profile) });
  const week = useQuery({
    queryKey: ["meal-logs", dates[0], dates[6]],
    queryFn: () => logs.listBetween(dates[0], dates[6]),
  });

  const r = range.data;
  const all = week.data ?? [];
  if (!r) return { isLoading: true as const };

  const total = dayTotal(all, today);
  const lowItems = pantry.view.groups.flatMap((g) => g.items).filter(isLow);
  const lowNames = lowItems.map((i) => i.name.toLowerCase());
  const trend = buildTrend(weekSeries(all, dates, r), r, (d) => {
    const [y, m, day] = d.split("-").map(Number);
    return new Date(y, m - 1, day).getDay();
  });

  const tasks = rankUpNext({
    hour: now.getHours(),
    loggedSlots: logsForDay(all, today).map((l) => l.slot),
    lowItemNames: lowNames,
  })
    .slice(0, 4)
    .map((t) =>
      t.kind === "log-meal"
        ? { id: t.id, kind: "meal" as const, title: `Log ${t.slot}`, hint: "Log" }
        : { id: t.id, kind: "pantry" as const, title: `Buy ${joinList(t.names)}`, hint: pantry.listed ? "On the list" : "Add to list" },
    );

  return {
    isLoading: false as const,
    dateLabel: now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }),
    today: {
      big: total === null ? "–" : num(total),
      pct: total === null ? 0 : Math.min(100, (total / r.max) * 100),
      status: total === null ? null : intakeStatus(total, r),
    },
    trend: {
      model: trend,
      sub: trend.average === null ? "" : `Average ${num(trend.average)} kcal, range ${num(r.min)} to ${num(r.max)}.`,
      label:
        trend.average === null
          ? "Calories, last 7 days. Nothing logged yet."
          : `Calories, last 7 days. Average ${num(trend.average)} kcal.`,
    },
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

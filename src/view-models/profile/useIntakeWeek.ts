"use client";
import { useHome } from "../home/useHome";

export interface WeekDay {
  axis: string;
  today: boolean;
  /** kcal eaten; null for a day nothing was logged (a gap, never zero). */
  eaten: number | null;
  state: "in" | "out" | "gap";
  /** Bar height, 0-100, on the week's own scale. */
  pct: number;
}

/** The last 7 days against a calorie range (the range being edited, so the chart answers as you move it). */
export function useIntakeWeek(min: number, max: number) {
  const h = useHome();
  const raw = h.isLoading ? [] : h.chart.points.slice(-7);
  const top = Math.max(max * 1.3, ...raw.map((p) => p.eaten ?? 0), 1);
  const days: WeekDay[] = raw.map((p, i) => ({
    axis: p.axis,
    today: i === raw.length - 1,
    eaten: p.eaten,
    state: p.eaten === null ? "gap" : p.eaten >= min && p.eaten <= max ? "in" : "out",
    pct: p.eaten === null ? 0 : Math.max(4, Math.round((p.eaten / top) * 100)),
  }));
  const logged = days.filter((d) => d.state !== "gap").length;
  return {
    isLoading: h.isLoading,
    days,
    logged,
    hit: days.filter((d) => d.state === "in").length,
    /** Where the goal band sits on the bars' scale, 0-100 from the bottom. */
    bandLow: Math.min(100, Math.round((min / top) * 100)),
    bandHigh: Math.min(100, Math.round((max / top) * 100)),
  };
}

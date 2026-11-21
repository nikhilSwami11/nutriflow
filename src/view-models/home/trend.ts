import type { DayPoint, TargetRange } from "@/domain/nutrition";

const PX = (i: number) => i * 48.67 + 14;
const BASE = 112;
const DAY = ["S", "M", "T", "W", "T", "F", "S"];

type Pt = [number, number];
const f = (n: number) => n.toFixed(1);

/** Catmull-Rom to cubic Bezier, same curve as the design. */
export function smooth(p: Pt[]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export interface TrendModel {
  /** One entry per run of consecutive logged days. Unlogged days break the line: a gap, never zero. */
  segments: { line: string; area: string }[];
  dots: { x: number; y: number; big: boolean }[];
  labels: { cx: number; label: string; vy: number; val: string }[];
  goalY: { min: number; max: number };
  average: number | null;
}

export function buildTrend(points: DayPoint[], range: TargetRange, dayOfWeek: (date: string) => number): TrendModel {
  const vals = points.map((p) => p.kcal).filter((v): v is number => v !== null);
  const tmax = Math.max(...vals, range.max * 1.12, 1);
  const PY = (v: number) => BASE - (v / tmax) * 100;

  const runs: Pt[][] = [];
  let cur: Pt[] = [];
  points.forEach((p, i) => {
    if (p.kcal === null) {
      if (cur.length) runs.push(cur);
      cur = [];
    } else cur.push([PX(i), PY(p.kcal)]);
  });
  if (cur.length) runs.push(cur);

  const segments = runs
    .filter((r) => r.length > 1)
    .map((r) => {
      const line = smooth(r);
      return { line, area: `${line} L${f(r[r.length - 1][0])} ${BASE} L${f(r[0][0])} ${BASE} Z` };
    });

  const last = points.length - 1;
  const dots = points.flatMap((p, i) => {
    if (p.kcal === null) return [];
    const lone = (points[i - 1]?.kcal ?? null) === null && (points[i + 1]?.kcal ?? null) === null;
    return i === last ? [{ x: PX(i), y: PY(p.kcal), big: true }] : lone ? [{ x: PX(i), y: PY(p.kcal), big: false }] : [];
  });

  const labels = points.map((p, i) => ({
    cx: PX(i),
    label: DAY[dayOfWeek(p.date)],
    vy: (p.kcal === null ? BASE : PY(p.kcal)) - 10,
    val: i === last && p.kcal !== null ? `${(p.kcal / 1000).toFixed(1)}k` : "",
  }));

  return {
    segments,
    dots,
    labels,
    goalY: { min: PY(range.min), max: PY(range.max) },
    average: vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null,
  };
}

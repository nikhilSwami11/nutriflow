import { macroShares, type DayNutrition } from "@/domain/dashboard";

export const W = 700;
export const H = 220;
export const Y_MAX = 2400;

type Pt = [number, number];
const f = (n: number) => n.toFixed(1);

/** Catmull-Rom to cubic Bezier, same curve as the design. Needs 2+ points. */
export function smooth(p: Pt[]): string {
  let d = `M${f(p[0][0])} ${f(p[0][1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] ?? p2;
    d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d;
}

export interface ChartGeometry {
  areaP: string;
  areaC: string;
  areaF: string;
  line: string;
  planned: string;
  /** 0..100 across the plot. */
  xPct: (i: number) => number;
  /** 0..100 down the plot, 0 = top. */
  yPct: (kcal: number) => number;
}

/** Stacked protein/carbs/fat areas under the eaten line, dashed plan line over it. */
export function buildChart(days: DayNutrition[]): ChartGeometry {
  const n = days.length;
  const x = (i: number) => (i / (n - 1)) * W;
  const y = (v: number) => H - (Math.min(v, Y_MAX) / Y_MAX) * H;
  const bounds = days.map((d) => {
    const [p, c] = macroShares(d.macros);
    const t = Math.min(d.eaten, Y_MAX);
    return [0, t * p, t * (p + c), t];
  });
  const edge = (k: number): Pt[] => bounds.map((b, i) => [x(i), y(b[k])]);
  const band = (hi: number, lo: number) => {
    const up = edge(hi);
    const dn = edge(lo).reverse();
    return `${smooth(up)} L${f(dn[0][0])} ${f(dn[0][1])}${smooth(dn).replace(/^M[^C]*/, "")} Z`;
  };
  return {
    areaP: band(1, 0),
    areaC: band(2, 1),
    areaF: band(3, 2),
    line: smooth(days.map((d, i): Pt => [x(i), y(d.eaten)])),
    planned: smooth(days.map((d, i): Pt => [x(i), y(d.planned)])),
    xPct: (i) => (i / (n - 1)) * 100,
    yPct: (v) => (1 - Math.min(v, Y_MAX) / Y_MAX) * 100,
  };
}

import { describe, expect, it } from "vitest";
import { buildChart, smooth } from "./chart";

const day = (eaten: number) => ({ date: "d", planned: 1900, eaten, macros: { protein: 80, carbs: 150, fat: 50 } });
const days = [1800, 1900, 2000, 1700].map(day);

describe("smooth", () => {
  it("starts at the first point and ends at the last", () => {
    const d = smooth([[0, 10], [50, 20], [100, 30]]);
    expect(d.startsWith("M0.0 10.0")).toBe(true);
    expect(d.endsWith("100.0 30.0")).toBe(true);
  });
});

describe("buildChart", () => {
  it("maps first/last day to the plot edges and high kcal to the top", () => {
    const g = buildChart(days);
    expect(g.xPct(0)).toBe(0);
    expect(g.xPct(3)).toBe(100);
    expect(g.yPct(2400)).toBe(0);
    expect(g.yPct(0)).toBe(100);
    expect(g.yPct(5000)).toBe(0); // clamped
  });
  it("makes closed area paths", () => {
    const g = buildChart(days);
    for (const a of [g.areaP, g.areaC, g.areaF]) expect(a.endsWith("Z")).toBe(true);
  });
});

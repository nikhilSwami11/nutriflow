import { describe, expect, it } from "vitest";
import { buildTrend } from "./trend";

const R = { min: 1800, max: 2100 };
const pt = (date: string, kcal: number | null) => ({ date, kcal, status: null });
const dow = () => 1;

describe("buildTrend", () => {
  it("breaks the line at an unlogged day", () => {
    const t = buildTrend([pt("a", 1900), pt("b", 1950), pt("c", null), pt("d", 2000), pt("e", 2050)], R, dow);
    expect(t.segments).toHaveLength(2);
  });
  it("a lone logged day gets a dot, not a line", () => {
    const t = buildTrend([pt("a", null), pt("b", 1900), pt("c", null), pt("d", 1900)], R, dow);
    expect(t.segments).toHaveLength(0);
    expect(t.dots).toHaveLength(2);
  });
  it("marks only the last logged day big, and labels it", () => {
    const t = buildTrend([pt("a", 1900), pt("b", 1900), pt("c", 1350)], R, dow);
    expect(t.dots).toEqual([expect.objectContaining({ big: true })]);
    expect(t.labels[2].val).toBe("1.4k");
    expect(t.labels[0].val).toBe("");
  });
  it("no logs: no lines, no dots, no average", () => {
    const t = buildTrend([pt("a", null), pt("b", null)], R, dow);
    expect(t.segments).toEqual([]);
    expect(t.dots).toEqual([]);
    expect(t.average).toBeNull();
  });
  it("average ignores unlogged days", () => {
    expect(buildTrend([pt("a", 1000), pt("b", null), pt("c", 2000)], R, dow).average).toBe(1500);
  });
});

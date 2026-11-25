import { describe, expect, it } from "vitest";
import { dayStatus, logsByDate, monthGrid, monthSpan } from "./history";
import type { MealLog } from "./types";

describe("monthGrid", () => {
  it("fills whole weeks starting Monday (November 2026 starts on a Sunday)", () => {
    const g = monthGrid(2026, 10);
    expect(g.length % 7).toBe(0);
    expect(g[0]).toEqual({ date: "2026-10-26", day: 26, inMonth: false });
    expect(g[6]).toEqual({ date: "2026-11-01", day: 1, inMonth: true });
    expect(g.filter((c) => c.inMonth)).toHaveLength(30);
  });
  it("starts on the 1st when it is a Monday (June 2026)", () => {
    const g = monthGrid(2026, 5);
    expect(g[0]).toEqual({ date: "2026-06-01", day: 1, inMonth: true });
  });
  it("monthSpan covers the filler days too", () => {
    expect(monthSpan(2026, 10)).toEqual({ from: "2026-10-26", to: "2026-12-06" });
  });
});

describe("history helpers", () => {
  it("groups logs by date", () => {
    const l = (id: string, date: string) => ({ id, date, slot: "lunch", source: "cook", name: id, kcal: 1 }) as MealLog;
    const m = logsByDate([l("a", "2026-11-02"), l("b", "2026-11-03"), l("c", "2026-11-02")]);
    expect(m.get("2026-11-02")!.map((x) => x.id)).toEqual(["a", "c"]);
  });
  it("an unlogged day has no status", () => {
    expect(dayStatus(null, { min: 1800, max: 2100 })).toBeNull();
    expect(dayStatus(1900, { min: 1800, max: 2100 })).toBe("in");
    expect(dayStatus(900, { min: 1800, max: 2100 })).toBe("out");
  });
});

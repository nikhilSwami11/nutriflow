import { describe, expect, it } from "vitest";
import { logMeal } from "./logMeal";
import type { MealLogRepository, ProfileRepository } from "./ports";
import { DEFAULT_RANGE, getTargetRange, setTargetRange } from "./setTargetRange";
import { dayTotal, intakeStatus, kcalLeft, SEEDS_IN_RANGE, seedsForDay, weekSeries } from "./summary";
import type { MealLog, Profile } from "./types";
import { rankUpNext } from "./upNext";

const R = { min: 1800, max: 2100 };
const log = (date: string, kcal: number, o: Partial<MealLog> = {}): MealLog => ({
  id: `${date}-${kcal}-${Math.random()}`, date, slot: "lunch", source: "cook", name: "x", kcal, ...o,
});

describe("dayTotal / intakeStatus", () => {
  it("sums a day and returns null when nothing logged", () => {
    const logs = [log("2026-11-20", 600), log("2026-11-20", 700), log("2026-11-19", 100)];
    expect(dayTotal(logs, "2026-11-20")).toBe(1300);
    expect(dayTotal(logs, "2026-11-21")).toBeNull();
  });
  it("range ends are inclusive", () => {
    expect(intakeStatus(1799, R)).toBe("below");
    expect(intakeStatus(1800, R)).toBe("in");
    expect(intakeStatus(2100, R)).toBe("in");
    expect(intakeStatus(2101, R)).toBe("above");
  });
});

describe("seedsForDay", () => {
  it("earns only inside the range", () => {
    expect(seedsForDay([log("d", 1900)], "d", R)).toBe(SEEDS_IN_RANGE);
  });
  it("earns nothing below, above, or when unlogged, and never goes negative", () => {
    expect(seedsForDay([log("d", 1200)], "d", R)).toBe(0); // no bonus for eating less
    expect(seedsForDay([log("d", 2500)], "d", R)).toBe(0);
    expect(seedsForDay([], "d", R)).toBe(0); // missed day costs nothing
  });
});

describe("weekSeries", () => {
  it("unlogged days are null gaps, not zero", () => {
    const s = weekSeries([log("a", 1900), log("c", 1000)], ["a", "b", "c"], R);
    expect(s).toEqual([
      { date: "a", kcal: 1900, status: "in" },
      { date: "b", kcal: null, status: null },
      { date: "c", kcal: 1000, status: "below" },
    ]);
  });
});

describe("kcalLeft", () => {
  it("counts down to the top of the range, floored at 0", () => {
    expect(kcalLeft(1420, R)).toBe(680);
    expect(kcalLeft(null, R)).toBe(2100);
    expect(kcalLeft(3000, R)).toBe(0);
  });
});

describe("rankUpNext", () => {
  it("puts the meal due now first, then shopping, then other meals", () => {
    const r = rankUpNext({ hour: 19, loggedSlots: [], lowItemNames: ["Onions"] });
    expect(r.map((t) => t.id)).toEqual(["log-dinner", "buy-low", "log-lunch", "log-breakfast"]);
  });
  it("skips logged meals and an empty shopping list", () => {
    const r = rankUpNext({ hour: 13, loggedSlots: ["breakfast", "lunch"], lowItemNames: [] });
    expect(r.map((t) => t.id)).toEqual(["log-dinner"]);
  });
  it("ranks an upcoming meal after shopping early in the day", () => {
    const r = rankUpNext({ hour: 7, loggedSlots: [], lowItemNames: ["Butter"] });
    expect(r[0].id).toBe("log-breakfast");
    expect(r.map((t) => t.id)).toEqual(["log-breakfast", "buy-low", "log-lunch", "log-dinner"]);
  });
});

describe("logMeal", () => {
  const repo = (): MealLogRepository & { rows: MealLog[] } => {
    const rows: MealLog[] = [];
    return { rows, listBetween: async () => rows, add: async (l) => void rows.push(l) };
  };
  it("saves a valid meal", async () => {
    const r = repo();
    await logMeal(r, log("d", 480));
    expect(r.rows).toHaveLength(1);
  });
  it("rejects negative or non-finite kcal", async () => {
    await expect(logMeal(repo(), log("d", -1))).rejects.toThrow();
    await expect(logMeal(repo(), log("d", NaN))).rejects.toThrow();
  });
});

describe("target range", () => {
  const repo = (p: Profile | null = null): ProfileRepository & { p: Profile | null } => {
    const s = { p, get: async () => s.p, save: async (x: Profile) => void (s.p = x) };
    return s;
  };
  it("falls back to the default without saving", async () => {
    const r = repo();
    expect(await getTargetRange(r)).toEqual(DEFAULT_RANGE);
    expect(r.p).toBeNull();
  });
  it("saves a valid range and reads it back", async () => {
    const r = repo();
    await setTargetRange(r, { min: 1500, max: 1800 });
    expect(await getTargetRange(r)).toEqual({ min: 1500, max: 1800 });
  });
  it("rejects bad ranges", async () => {
    await expect(setTargetRange(repo(), { min: 2000, max: 1800 })).rejects.toThrow();
    await expect(setTargetRange(repo(), { min: 0, max: 1800 })).rejects.toThrow();
    await expect(setTargetRange(repo(), { min: 1800, max: 1800 })).rejects.toThrow();
  });
});

describe("dates", () => {
  it("lastNDays ends today, oldest first, across a month edge", async () => {
    const { lastNDays, toDateKey } = await import("./dates");
    expect(lastNDays(3, new Date(2026, 11, 1))).toEqual(["2026-11-29", "2026-11-30", "2026-12-01"]);
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

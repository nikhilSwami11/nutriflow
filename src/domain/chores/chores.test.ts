import { describe, expect, it } from "vitest";
import { addChore, markChore } from "./actions";
import { isDue, isOverdue, lastDueDay } from "./due";
import type { Chore, ChoreRepository } from "./types";

const c = (o: Partial<Chore>): Chore => ({ id: "a", title: "x", repeat: "daily", lastDone: null, ...o });
// 2026-11-21 is a Saturday (6); 2026-11-19 is a Thursday (4).
const SAT = "2026-11-21";

describe("isDue", () => {
  it("daily: due until done today", () => {
    expect(isDue(c({}), SAT)).toBe(true);
    expect(isDue(c({ lastDone: "2026-11-20" }), SAT)).toBe(true);
    expect(isDue(c({ lastDone: SAT }), SAT)).toBe(false);
  });
  it("weekly: due from its day until done, then quiet until the next one", () => {
    const thu = c({ repeat: "weekly", day: 4 });
    expect(lastDueDay(thu, SAT)).toBe("2026-11-19");
    expect(isDue({ ...thu, lastDone: "2026-11-12" }, SAT)).toBe(true);
    expect(isDue({ ...thu, lastDone: "2026-11-19" }, SAT)).toBe(false);
    expect(isDue({ ...thu, lastDone: "2026-11-20" }, SAT)).toBe(false);
  });
  it("weekly chore on its own day is due today, not overdue", () => {
    const sat = c({ repeat: "weekly", day: 6 });
    expect(isDue(sat, SAT)).toBe(true);
    expect(isOverdue(sat, SAT)).toBe(false);
    expect(isOverdue(c({ repeat: "weekly", day: 4 }), SAT)).toBe(true);
  });
  it("once: due until done, never overdue", () => {
    expect(isDue(c({ repeat: "once" }), SAT)).toBe(true);
    expect(isDue(c({ repeat: "once", lastDone: "2026-01-01" }), SAT)).toBe(false);
    expect(isOverdue(c({ repeat: "once" }), SAT)).toBe(false);
  });
  it("month and year edges: a weekday back across the new year", () => {
    expect(lastDueDay(c({ repeat: "weekly", day: 2 }), "2026-01-02")).toBe("2025-12-30");
  });
});

const fake = (seed: Chore[] = []): ChoreRepository & { m: Map<string, Chore> } => {
  const m = new Map(seed.map((x) => [x.id, x]));
  return { m, list: async () => [...m.values()], save: async (x) => void m.set(x.id, x), remove: async (id) => void m.delete(id) };
};

describe("addChore and markChore", () => {
  it("trims, ignores an empty title, keeps day only for weekly", async () => {
    const repo = fake();
    expect(await addChore({ repo, newId: () => "n" }, { title: "   ", repeat: "daily" })).toBeNull();
    const d = await addChore({ repo, newId: () => "n" }, { title: " Dishes ", repeat: "daily", day: 3 });
    expect(d).toMatchObject({ title: "Dishes", day: undefined });
    expect(repo.m.size).toBe(1);
  });
  it("marks done and undoes with the old value", async () => {
    const repo = fake([c({ lastDone: "2026-11-01" })]);
    await markChore(repo, "a", SAT);
    expect(repo.m.get("a")!.lastDone).toBe(SAT);
    await markChore(repo, "a", "2026-11-01");
    expect(repo.m.get("a")!.lastDone).toBe("2026-11-01");
  });
});

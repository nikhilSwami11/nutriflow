import { describe, expect, it } from "vitest";
import type { MealLog, MealLogRepository } from "@/domain/nutrition";
import { InMemoryMealLogRepository } from "../nutrition/inMemory";
import { QueuedMealLogRepository } from "../nutrition/queued";
import { LocalServingHabitRepository } from "./habits";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
const log = (id: string, date = "2026-11-21"): MealLog => ({ id, date, slot: "dinner", source: "cook", name: "Dal", kcal: 480 });

/** A database that can be switched off. */
const flaky = () => {
  const inner = new InMemoryMealLogRepository();
  const state = { down: false };
  const repo: MealLogRepository = {
    add: async (l) => (state.down ? Promise.reject(new Error("offline")) : inner.add(l)),
    listBetween: async (a, b) => (state.down ? Promise.reject(new Error("offline")) : inner.listBetween(a, b)),
    remove: async (id) => (state.down ? Promise.reject(new Error("offline")) : inner.remove(id)),
  };
  return { repo, inner, state };
};

describe("QueuedMealLogRepository", () => {
  it("saves straight to the database when it is up", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    await q.add(log("a"));
    expect(await f.inner.listBetween("2026-11-21", "2026-11-21")).toHaveLength(1);
    expect(q.pending()).toBe(0);
  });
  it("keeps the meal when the database is down, still lists it, and sends it later", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    f.state.down = true;
    await q.add(log("a"));
    expect(q.pending()).toBe(1);
    expect((await q.listBetween("2026-11-21", "2026-11-21")).map((l) => l.id)).toEqual(["a"]);
    expect(await q.flush()).toBe(1); // still down
    f.state.down = false;
    expect(await q.flush()).toBe(0);
    expect(await f.inner.listBetween("2026-11-21", "2026-11-21")).toHaveLength(1);
    expect(q.pending()).toBe(0);
  });
  it("does not list a meal twice once it has been sent", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    f.state.down = true;
    await q.add(log("a"));
    f.state.down = false;
    await f.inner.add(log("a")); // arrived by another route before the flush
    expect(await q.listBetween("2026-11-21", "2026-11-21")).toHaveLength(1);
  });
  it("queues each meal once and only lists queued meals in range", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    f.state.down = true;
    await q.add(log("a"));
    await q.add(log("a"));
    await q.add(log("b", "2026-11-01"));
    expect(q.pending()).toBe(2);
    expect((await q.listBetween("2026-11-20", "2026-11-22")).map((l) => l.id)).toEqual(["a"]);
  });
  it("survives corrupt or blocked storage without losing the app", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, { getItem: () => "{nope", setItem: () => { throw new Error("blocked"); } });
    f.state.down = true;
    await expect(q.add(log("a"))).resolves.toBeUndefined();
    expect(await q.flush()).toBe(0);
  });
});

describe("QueuedMealLogRepository remove (undo)", () => {
  it("a queued meal is dropped, and a delete waits in case it had already reached the server", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    f.state.down = true;
    await q.add(log("a"));
    await q.remove("a");
    expect(q.pending()).toBe(1); // only the delete is waiting; the meal itself is gone
    expect(await q.listBetween("2026-11-21", "2026-11-21")).toEqual([]);
    f.state.down = false;
    expect(await q.flush()).toBe(0);
    expect(await f.inner.listBetween("2026-11-21", "2026-11-21")).toEqual([]);
  });
  it("a saved meal is deleted; if the database is down the delete waits, and the meal is hidden meanwhile", async () => {
    const f = flaky();
    const q = new QueuedMealLogRepository(f.repo, mem());
    await q.add(log("a"));
    f.state.down = true;
    await q.remove("a");
    expect(q.pending()).toBe(1);
    f.state.down = false;
    expect((await q.listBetween("2026-11-21", "2026-11-21")).map((l) => l.id)).toEqual([]); // hidden even though still stored
    expect(await q.flush()).toBe(0);
    expect(await f.inner.listBetween("2026-11-21", "2026-11-21")).toEqual([]);
  });
  it("removing something that is not there is fine", async () => {
    const q = new QueuedMealLogRepository(flaky().repo, mem());
    await expect(q.remove("nope")).resolves.toBeUndefined();
  });
});

describe("LocalServingHabitRepository", () => {
  it("saves and reads a habit per recipe", async () => {
    const r = new LocalServingHabitRepository(mem());
    expect(await r.get("dal")).toBeNull();
    await r.save({ recipeId: "dal", count: 2, avg: 1.5 });
    await r.save({ recipeId: "rajma", count: 1, avg: 1 });
    expect(await r.get("dal")).toEqual({ recipeId: "dal", count: 2, avg: 1.5 });
    expect((await r.get("rajma"))?.avg).toBe(1);
  });
  it("copes with bad storage", async () => {
    const r = new LocalServingHabitRepository({ getItem: () => "{x", setItem: () => { throw new Error("b"); } });
    expect(await r.get("dal")).toBeNull();
    await expect(r.save({ recipeId: "dal", count: 1, avg: 1 })).resolves.toBeUndefined();
  });
});

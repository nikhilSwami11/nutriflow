import { describe, expect, it } from "vitest";
import { InMemoryChoreRepository } from "./inMemory";
import { fromRow, toRow } from "./supabase";

describe("chore rows", () => {
  it("round-trips, mapping a missing day to null and back", () => {
    const weekly = { id: "a", title: "Bins", repeat: "weekly" as const, day: 4, lastDone: "2026-11-19" };
    expect(fromRow(toRow(weekly))).toEqual(weekly);
    const daily = { id: "b", title: "Dishes", repeat: "daily" as const, lastDone: null };
    expect(toRow(daily).day).toBeNull();
    expect(fromRow(toRow(daily))).toEqual({ ...daily, day: undefined });
  });
});

describe("InMemoryChoreRepository", () => {
  it("saves, updates and removes", async () => {
    const r = new InMemoryChoreRepository();
    await r.save({ id: "a", title: "x", repeat: "once", lastDone: null });
    await r.save({ id: "a", title: "x", repeat: "once", lastDone: "2026-11-21" });
    expect((await r.list())[0].lastDone).toBe("2026-11-21");
    await r.remove("a");
    expect(await r.list()).toEqual([]);
  });
});

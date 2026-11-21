import { describe, expect, it } from "vitest";
import { InMemoryMealLogRepository, InMemoryProfileRepository } from "./inMemory";
import { logFromRow, logToRow } from "./supabase";

const l = { id: "1", date: "2026-11-20", slot: "dinner", source: "cook", name: "Dal", kcal: 480 } as const;

describe("nutrition data", () => {
  it("listBetween is inclusive", async () => {
    const r = new InMemoryMealLogRepository([{ ...l, date: "2026-11-19" }, l, { ...l, date: "2026-11-22" }]);
    expect(await r.listBetween("2026-11-19", "2026-11-20")).toHaveLength(2);
  });
  it("profile round-trips", async () => {
    const r = new InMemoryProfileRepository();
    expect(await r.get()).toBeNull();
    await r.save({ range: { min: 1, max: 2 } });
    expect((await r.get())?.range.max).toBe(2);
  });
  it("row mapping round-trips and coerces numeric strings", () => {
    expect(logFromRow({ ...logToRow(l), kcal: "480" as unknown as number })).toEqual({ ...l, recipeId: undefined, servings: undefined, protein: undefined, carbs: undefined, fat: undefined });
  });
  it("row mapping keeps recipe details", () => {
    const full = { ...l, recipeId: "dal-tadka", servings: 1.5, protein: 33, carbs: 93, fat: 22.5 };
    expect(logFromRow(logToRow(full))).toEqual(full);
  });
});

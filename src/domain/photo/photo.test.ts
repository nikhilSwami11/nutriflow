import { describe, expect, it } from "vitest";
import { parseIntent } from "../capture/intent";
import type { MealLogRepository } from "../nutrition/ports";
import type { MealLog } from "../nutrition/types";
import { changeAmount, dayImpact, estimateMeal, scaleForHabit } from "./estimate";
import { logPhotoMeal, undoLog } from "./logPhotoMeal";
import type { DetectedItem } from "./types";

const item = (o: Partial<DetectedItem>): DetectedItem => ({
  id: "x", name: "x", confidence: 90, amount: 1, step: 0.25, unit: "cup", kcalPer: 200, protein: 10, carbs: 30, fat: 5, color: "#fff",
  box: { x: 0, y: 0, w: 1, h: 1 }, pantryName: "x", reason: "", ...o,
});
const items = [item({ id: "dal", amount: 1.3, kcalPer: 230, protein: 12, carbs: 35, fat: 7 }), item({ id: "rice", amount: 0.75, kcalPer: 205, protein: 4, carbs: 45, fat: 0.4 })];

describe("estimateMeal", () => {
  it("adds amount x per-unit for kcal and macros, with a plus-minus 12% range", () => {
    const e = estimateMeal(items);
    expect(e.kcal).toBe(Math.round(1.3 * 230 + 0.75 * 205)); // 453
    expect(e.low).toBe(Math.round(e.kcal * 0.88));
    expect(e.high).toBe(Math.round(e.kcal * 1.12));
    expect(e.protein).toBe(Math.round(1.3 * 12 + 0.75 * 4));
  });
  it("nothing kept is zero", () => {
    expect(estimateMeal([])).toEqual({ kcal: 0, low: 0, high: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe("scaleForHabit", () => {
  it("scales amounts to the person's usual servings, to the nearest step", () => {
    const [dal] = scaleForHabit(items, 1.5);
    expect(dal.amount).toBe(2); // 1.3 x 1.5 = 1.95 -> nearest 0.25
  });
  it("one serving, or nonsense, changes nothing", () => {
    expect(scaleForHabit(items, 1)).toBe(items);
    expect(scaleForHabit(items, 0)).toBe(items);
  });
});

describe("changeAmount", () => {
  it("moves by one step and never below zero", () => {
    expect(changeAmount(item({ amount: 1, step: 0.5 }), 1).amount).toBe(1.5);
    expect(changeAmount(item({ amount: 0.25, step: 0.5 }), -1).amount).toBe(0);
  });
});

describe("dayImpact", () => {
  it("says how much room is left, or how far over", () => {
    expect(dayImpact(1350, 1850, 450)).toEqual({ after: 1800, goal: 1850, left: 50 });
    expect(dayImpact(1350, 1850, 650).left).toBe(-150);
  });
});

describe("logPhotoMeal / undoLog", () => {
  const repo = () => {
    const rows: MealLog[] = [];
    const r: MealLogRepository = { listBetween: async () => rows, add: async (l) => void rows.push(l), remove: async (id) => void rows.splice(0, rows.length, ...rows.filter((x) => x.id !== id)) };
    return { rows, r };
  };
  it("logs with source photo and the estimate's numbers, and undo removes it", async () => {
    const { rows, r } = repo();
    const estimate = estimateMeal(items);
    await logPhotoMeal(r, { id: "p1", date: "2026-11-21", slot: "dinner", name: "Dal tadka with rice", estimate });
    expect(rows).toEqual([expect.objectContaining({ id: "p1", source: "photo", slot: "dinner", kcal: estimate.kcal, protein: estimate.protein })]);
    await undoLog(r, "p1");
    await undoLog(r, "p1"); // twice is fine
    expect(rows).toEqual([]);
  });
  it("rejects a negative estimate", async () => {
    const { r } = repo();
    await expect(logPhotoMeal(r, { id: "p", date: "d", slot: "dinner", name: "x", estimate: { kcal: -5, low: 0, high: 0, protein: 0, carbs: 0, fat: 0 } })).rejects.toThrow();
  });
});

describe("parseIntent", () => {
  it.each([
    ["I have 3 onions, 2 tomatoes and butter", "pantry-add"], ["I bought eggs", "pantry-add"], ["Add two lemons", "pantry-add"],
    ["What can I make tonight?", "suggest"], ["what's for dinner", "suggest"], ["Start cooking", "cook"], ["let's cook", "cook"],
    ["sing me a song", "unknown"], ["", "unknown"],
  ])("%s -> %s", (said, type) => expect(parseIntent(said).type).toBe(type));
  it("keeps what was said for a pantry add", () => {
    expect(parseIntent("I have 3 onions.")).toEqual({ type: "pantry-add", text: "I have 3 onions." });
  });
});

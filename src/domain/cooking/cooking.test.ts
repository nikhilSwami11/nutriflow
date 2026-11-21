import { describe, expect, it } from "vitest";
import type { MealLogRepository } from "../nutrition/ports";
import type { MealLog } from "../nutrition/types";
import { fakePantry, item } from "../pantry/testing";
import type { Recipe } from "../recipes/types";
import { ingredientsToDeplete } from "./depletion";
import { kcalEaten, nutritionEaten, recipeTotalKcal } from "./eaten";
import { finishCooking } from "./finishCooking";
import { habitNote, suggestedServings, updateHabit, type ServingHabit, type ServingHabitRepository } from "./habits";
import { nextStep, prevStep, stepAt } from "./session";
import { elapsedMs, formatRemaining, isDone, newTimer, pauseTimer, remainingMs, startTimer } from "./timer";
import { parseVoiceCommand } from "./voice";

const recipe = {
  id: "dal-tadka", name: "Dal tadka", meal: "Dinner", servings: 4, kcal: 480, protein: 22, carbs: 62, fat: 15,
  ingredients: [
    { name: "Toor dal", qty: 1, unit: "cup" }, { name: "Onions", qty: 2, unit: "" }, { name: "Garlic", qty: 4, unit: "cloves" },
    { name: "Ghee", qty: 2, unit: "tbsp" }, { name: "Fresh coriander", qty: 1, unit: "bunch" },
  ],
} as Recipe;

const pantry = () => [
  item({ id: "dal", name: "Toor dal", qty: 3, unit: "cups" }), item({ id: "onion", name: "Onions", qty: 5, unit: "pcs" }),
  item({ id: "garlic", name: "Garlic", qty: 8, unit: "cloves" }), item({ id: "ghee", name: "Ghee", qty: 1, unit: "jar" }),
];

describe("calories eaten", () => {
  it("is the total divided by servings made, times servings eaten", () => {
    expect(recipeTotalKcal(recipe, 4)).toBe(1920);
    expect(kcalEaten(1920, 4, 1)).toBe(480);
    expect(kcalEaten(1920, 4, 1.5)).toBe(720);
    expect(kcalEaten(1920, 4, 0.5)).toBe(240);
  });
  it("macros scale with servings eaten", () => {
    expect(nutritionEaten(recipe, 4, 1.5)).toEqual({ kcal: 720, protein: 33, carbs: 93, fat: 22.5 });
  });
});

describe("ingredientsToDeplete", () => {
  it("scales to servings made and matches name and unit", () => {
    expect(ingredientsToDeplete(recipe, 4, pantry())).toEqual([{ itemId: "dal", qty: 1 }, { itemId: "onion", qty: 2 }, { itemId: "garlic", qty: 4 }]);
    expect(ingredientsToDeplete(recipe, 8, pantry()).find((x) => x.itemId === "dal")!.qty).toBe(2);
  });
  it("leaves jars and anything not in the pantry alone", () => {
    const ids = ingredientsToDeplete(recipe, 4, pantry()).map((x) => x.itemId);
    expect(ids).not.toContain("ghee"); // tbsp from a jar
    expect(ids).toHaveLength(3); // coriander is not in the pantry
  });
  it("rounds whole pieces up, never half an onion", () => {
    expect(ingredientsToDeplete(recipe, 1, pantry()).find((x) => x.itemId === "onion")!.qty).toBe(1); // 0.5 -> 1
  });
  it("does not match a name with the wrong unit", () => {
    expect(ingredientsToDeplete(recipe, 4, [item({ id: "dal", name: "Toor dal", qty: 3, unit: "packs" })])).toEqual([]);
  });
});

describe("serving habit", () => {
  it("averages what was eaten and suggests the nearest half", () => {
    let h: ServingHabit | null = null;
    h = updateHabit(h, "r", 1.5);
    expect(h).toEqual({ recipeId: "r", count: 1, avg: 1.5 });
    h = updateHabit(h, "r", 1);
    expect(h.avg).toBe(1.25);
    expect(suggestedServings(h)).toBe(1.5);
    expect(suggestedServings(null)).toBe(1);
    expect(suggestedServings({ recipeId: "r", count: 3, avg: 0.2 })).toBe(0.5);
  });
  it("explains itself in the design's words", () => {
    expect(habitNote("Dal tadka", { recipeId: "r", count: 1, avg: 1.5 })).toBe("You ate more than one serving, so I will estimate your next dal tadka a little higher.");
    expect(habitNote("Dal tadka", { recipeId: "r", count: 1, avg: 0.5 })).toContain("a little lower");
    expect(habitNote("Dal tadka", { recipeId: "r", count: 1, avg: 1 })).toContain("usually eat one serving");
  });
});

describe("steps", () => {
  it("moves within bounds and ends with null", () => {
    const s = stepAt(0, 3);
    expect(s.isFirst).toBe(true);
    expect(prevStep(s).index).toBe(0);
    expect(nextStep(s)!.index).toBe(1);
    expect(nextStep(nextStep(s)!)!.isLast).toBe(true);
    expect(nextStep(nextStep(nextStep(s)!)!)).toBeNull();
    expect(stepAt(99, 3).index).toBe(2);
  });
});

describe("timer", () => {
  it("counts by the clock, pauses and resumes", () => {
    let t = newTimer(10);
    expect(remainingMs(t, 0)).toBe(600_000);
    t = startTimer(t, 1_000);
    expect(remainingMs(t, 61_000)).toBe(540_000);
    t = pauseTimer(t, 61_000);
    expect(remainingMs(t, 999_999)).toBe(540_000); // frozen while paused
    t = startTimer(t, 100_000);
    expect(elapsedMs(t, 160_000)).toBe(120_000);
  });
  it("finishes and stays finished", () => {
    let t = startTimer(newTimer(1), 0);
    expect(isDone(t, 59_999)).toBe(false);
    expect(isDone(t, 60_000)).toBe(true);
    expect(remainingMs(t, 9_999_999)).toBe(0);
    t = startTimer(t, 70_000);
    expect(t.startedAt).toBe(0); // cannot restart a finished timer
  });
  it("formats and rounds up", () => {
    expect(formatRemaining(545_000)).toBe("9:05");
    expect(formatRemaining(500)).toBe("0:01");
    expect(formatRemaining(0)).toBe("0:00");
    expect(formatRemaining(-5)).toBe("0:00");
  });
});

describe("voice commands", () => {
  it.each([
    ["next", "next"], ["Next step please", "next"], ["done", "next"], ["go back", "prev"], ["previous step", "prev"], ["repeat that", "repeat"],
    ["read it again", "repeat"], ["start the timer", "timer-start"], ["pause timer", "timer-pause"], ["stop the timer", "timer-pause"],
  ])("%s -> %s", (said, cmd) => expect(parseVoiceCommand(said)).toBe(cmd));
  it("ignores everything else", () => {
    expect(parseVoiceCommand("")).toBeNull();
    expect(parseVoiceCommand("add butter to my list")).toBeNull();
  });
});

describe("finishCooking", () => {
  const setup = (over: { habitFails?: boolean; pantryFails?: boolean } = {}) => {
    const p = fakePantry(pantry());
    const rows: MealLog[] = [];
    const logs: MealLogRepository = { listBetween: async () => rows, add: async (l) => void rows.push(l), remove: async () => undefined };
    const habits = new Map<string, ServingHabit>();
    const repo: ServingHabitRepository = {
      get: async (id) => (over.habitFails ? Promise.reject(new Error("x")) : (habits.get(id) ?? null)),
      save: async (h) => void habits.set(h.recipeId, h),
    };
    const pantryRepo = over.pantryFails ? { ...p, list: async () => Promise.reject(new Error("down")) } : p;
    return { p, rows, habits, deps: { pantry: pantryRepo, logs, habits: repo, newId: () => "log1" } };
  };
  const input = { recipe, servingsMade: 4, servingsEaten: 1.5, date: "2026-11-21" };

  it("logs the meal, uses up the pantry, remembers the serving size", async () => {
    const t = setup();
    const r = await finishCooking(t.deps, input);
    expect(t.rows).toEqual([expect.objectContaining({ id: "log1", slot: "dinner", source: "cook", kcal: 720, recipeId: "dal-tadka", servings: 1.5, protein: 33 })]);
    expect(t.p.items.get("dal")!.qty).toBe(2);
    expect(t.p.items.get("garlic")!.qty).toBe(4);
    expect(r.depleted.map((i) => i.id).sort()).toEqual(["dal", "garlic", "onion"]);
    expect(t.habits.get("dal-tadka")).toEqual({ recipeId: "dal-tadka", count: 1, avg: 1.5 });
    expect(r.warnings).toEqual([]);
  });
  it("still logs the meal when the pantry or the habit store fails, and says so", async () => {
    const a = setup({ pantryFails: true });
    const ra = await finishCooking(a.deps, input);
    expect(a.rows).toHaveLength(1);
    expect(ra.warnings).toEqual(["The pantry could not be updated"]);
    const b = setup({ habitFails: true });
    const rb = await finishCooking(b.deps, input);
    expect(b.rows).toHaveLength(1);
    expect(rb.warnings).toEqual(["Your serving size could not be saved"]);
  });
  it("rejects impossible servings before saving anything", async () => {
    const t = setup();
    await expect(finishCooking(t.deps, { ...input, servingsEaten: 5 })).rejects.toThrow();
    await expect(finishCooking(t.deps, { ...input, servingsEaten: 0 })).rejects.toThrow();
    await expect(finishCooking(t.deps, { ...input, servingsMade: 0 })).rejects.toThrow();
    expect(t.rows).toHaveLength(0);
  });
  it("reports ingredients the pantry could not cover", async () => {
    const t = setup();
    t.p.items.get("dal")!.qty = 0.5;
    const r = await finishCooking(t.deps, { ...input, servingsEaten: 1 });
    expect(r.shortfalls).toEqual([{ itemId: "dal", missing: 0.5 }]);
  });
});

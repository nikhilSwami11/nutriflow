import { expect, it } from "vitest";
import { estimateMeal, EXTRA_FOODS } from "@/domain/photo";
import { DemoMealDetector } from "./demo";

it("the demo detector returns the design's example, labelled as a demo", async () => {
  const d = await new DemoMealDetector().detect();
  expect(d.source).toBe("demo");
  expect(d.items.map((i) => i.name)).toEqual(["Dal tadka", "Rice", "Ghee"]);
  expect(d.items.every((i) => i.box.x >= 0 && i.box.x + i.box.w <= 1 && i.box.y >= 0 && i.box.y + i.box.h <= 1)).toBe(true);
  expect(estimateMeal(d.items).kcal).toBeGreaterThan(400);
});

it("extra foods have sensible per-unit numbers", () => {
  for (const f of EXTRA_FOODS) {
    expect(f.kcalPer).toBeGreaterThan(0);
    // macros should roughly explain the calories (4/4/9), within 25%
    const k = f.protein * 4 + f.carbs * 4 + f.fat * 9;
    expect(Math.abs(k - f.kcalPer) / f.kcalPer).toBeLessThan(0.25);
  }
});

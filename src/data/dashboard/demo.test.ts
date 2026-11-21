import { expect, it } from "vitest";
import { chartStats } from "@/domain/dashboard";
import { DemoDashboardRepository } from "./demo";

it("demo data is consistent: 30 days ending today, meals sum to today", async () => {
  const d = await new DemoDashboardRepository(new Date(2026, 10, 21)).get();
  expect(d.days).toHaveLength(30);
  expect(d.days[29].date).toBe("2026-11-21");
  expect(d.meals.reduce((s, m) => s + m.eaten, 0)).toBe(d.days[29].eaten);
  expect(chartStats(d.days).pastDays).toBe(29);
});

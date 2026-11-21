import { expect, it } from "vitest";
import { chartStats } from "@/domain/dashboard";
import { DemoDashboardRepository } from "./demo";

it("demo data: 30 days ending today, breakfast eaten, history present", async () => {
  const d = await new DemoDashboardRepository(new Date(2026, 10, 21)).get();
  expect(d.days).toHaveLength(30);
  expect(d.days[29].date).toBe("2026-11-21");
  expect(d.eatenToday).toEqual(["Breakfast"]);
  expect(Object.keys(d.history).length).toBeGreaterThan(3);
  expect(chartStats(d.days).pastDays).toBe(29);
});

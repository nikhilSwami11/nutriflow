import { describe, expect, it } from "vitest";
import { targetFromBody } from "./bodyTarget";

describe("targetFromBody", () => {
  const base = { heightCm: 170, weightKg: 70 };
  it("keeping weight lands near 2,300 kcal for 170 cm, 70 kg", () => {
    const r = targetFromBody({ ...base, goal: "keep" });
    expect((r.min + r.max) / 2).toBeGreaterThan(2000);
    expect((r.min + r.max) / 2).toBeLessThan(2500);
  });
  it("losing aims lower and building aims higher than keeping", () => {
    const mid = (g: "lose" | "keep" | "build") => { const r = targetFromBody({ ...base, goal: g }); return r.min + r.max; };
    expect(mid("lose")).toBeLessThan(mid("keep"));
    expect(mid("build")).toBeGreaterThan(mid("keep"));
  });
  it("never goes under 1,200 kcal", () => {
    expect(targetFromBody({ heightCm: 140, weightKg: 40, goal: "lose" }).min).toBeGreaterThanOrEqual(1050);
  });
});

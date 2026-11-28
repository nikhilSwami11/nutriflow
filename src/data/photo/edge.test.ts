import { describe, expect, it } from "vitest";
import { toDetection } from "./edge";

const item = { name: "Rice", amount: 0.75, step: 0.25, unit: "cup", kcal_per: 205, protein: 4, carbs: 45, fat: 0.4, confidence: 88, reason: "White grains" };

describe("toDetection", () => {
  it("maps a model answer to a vision detection with no boxes", () => {
    const d = toDetection({ dish: "Rice", confidence: 80, items: [item] })!;
    expect(d.source).toBe("vision");
    expect(d.items[0]).toMatchObject({ name: "Rice", kcalPer: 205, box: { w: 0, h: 0 } });
  });
  it("drops nonsense (zero amount, impossible calories) and returns null when nothing is left", () => {
    expect(toDetection({ dish: "x", confidence: 50, items: [{ ...item, amount: 0 }, { ...item, kcal_per: 5000 }] })).toBeNull();
    expect(toDetection({ dish: "x", confidence: 50, items: [] })).toBeNull();
  });
  it("clamps wild confidences and steps instead of trusting them", () => {
    const d = toDetection({ dish: "Rice", confidence: 900, items: [{ ...item, confidence: -4, step: 99 }] })!;
    expect(d.confidence).toBe(70);
    expect(d.items[0].confidence).toBe(60);
    expect(d.items[0].step).toBe(0.5);
  });
});

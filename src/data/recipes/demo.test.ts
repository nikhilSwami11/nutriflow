import { describe, expect, it } from "vitest";
import { answerQuestion, prepList, stepGuide } from "@/domain/guide";
import { DemoRecipeRepository } from "./demo";

describe("demo recipes", () => {
  it("have unique ids, real steps, and consistent nutrition", async () => {
    const all = await new DemoRecipeRepository().list();
    expect(new Set(all.map((r) => r.id)).size).toBe(all.length);
    for (const r of all) {
      expect(r.steps.length, r.id).toBeGreaterThanOrEqual(3);
      expect(r.ingredients.length, r.id).toBeGreaterThanOrEqual(3);
      const kcal = r.protein * 4 + r.carbs * 4 + r.fat * 9;
      expect(Math.abs(kcal - r.kcal) / r.kcal, `${r.id} macros vs kcal`).toBeLessThan(0.25);
    }
  });

  it("every step of every recipe has something to look for and a tip", async () => {
    for (const r of await new DemoRecipeRepository().list()) {
      for (const s of r.steps) {
        const g = stepGuide(s);
        expect(g.look.length, `${r.id}: ${s.text}`).toBeGreaterThan(10);
        expect(g.tip.length, `${r.id}: ${s.text}`).toBeGreaterThan(10);
      }
    }
  });

  it("guided recipes have a checklist and fixes; every recipe can build a checklist", async () => {
    const all = await new DemoRecipeRepository().list();
    const dal = all.find((r) => r.id === "dal-tadka")!;
    expect(dal.fixes!.length).toBeGreaterThanOrEqual(4);
    expect(dal.steps[0].minutes).toBe(20);
    expect(dal.steps[3].look).toMatch(/cumin/);
    for (const r of all) expect(prepList(r, r.servings).length, r.id).toBeGreaterThan(0);
  });

  it("the guide answers from the real recipe", async () => {
    const dal = (await new DemoRecipeRepository().list()).find((r) => r.id === "dal-tadka")!;
    const ctx = { recipe: dal, stepIndex: 3, servings: 4, pantry: [] };
    expect(answerQuestion("how do I know it is done?", ctx).text).toMatch(/cumin crackles/);
    expect(answerQuestion("the garlic is bitter", ctx).text).toMatch(/tadka again/);
    expect(answerQuestion("what can I use instead of toor dal?", ctx).text).toMatch(/masoor dal/);
  });
});

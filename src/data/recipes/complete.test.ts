import { describe, expect, it } from "vitest";
import { recipeProblems } from "@/domain/recipes";
import { DemoRecipeRepository } from "./demo";
import { COMPLETE } from "./complete";

describe("complete household recipes", async () => {
  const all = await new DemoRecipeRepository().list();
  const done = Object.keys(COMPLETE).map((id) => all.find((r) => r.id === id)!);

  it("every rewritten recipe exists and passes the seasoning and balance check", () => {
    expect(done.every(Boolean)).toBe(true);
    for (const r of done) expect({ id: r.id, problems: recipeProblems(r) }).toEqual({ id: r.id, problems: [] });
  });
  it("salt is named in a step, and ground spices come after the aromatics and tomato", () => {
    for (const r of done) {
      expect(r.steps.some((s) => /salt/i.test(s.text)), `${r.id}: salt in a step`).toBe(true);
      const text = r.steps.map((s) => s.text.toLowerCase());
      const spice = text.findIndex((t) => /red chilli powder|coriander powder|turmeric/.test(t) && /sauté|add/.test(t));
      const aromatic = text.findIndex((t) => /onion|garlic|ginger|cumin/.test(t));
      if (spice > -1 && aromatic > -1 && !/marinade|mix the chicken|whisk|boil the soaked|boil the dal|boil the eggs|boil the spinach|rinse the poha/.test(text[spice])) expect(aromatic, `${r.id}: aromatics first`).toBeLessThanOrEqual(spice);
    }
  });
  it("each has stand-ins, fixes for too salty, and a tasting step", () => {
    for (const r of done) {
      expect(r.swaps?.length, r.id).toBeGreaterThan(0);
      expect(r.fixes?.some((f) => f.problem === "salty"), r.id).toBe(true);
      expect(r.steps.at(-1)!.text, r.id).toMatch(/taste|adjust|serve/i);
    }
  });
});

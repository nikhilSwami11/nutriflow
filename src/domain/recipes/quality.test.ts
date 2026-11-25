import { describe, expect, it } from "vitest";
import { recipeProblems } from "./quality";

const r = (name: string, ing: string[], steps: [string, string][]) => ({ name, ingredients: ing.map((n) => ({ name: n })), steps: steps.map(([text, verb]) => ({ text, verb })) });

describe("recipeProblems", () => {
  it("the old roasted chana fails on salt, fat, aromatics and balance", () => {
    const p = recipeProblems(r("Roasted chana", ["Chickpeas", "Cumin seeds", "Lemons"], [["Dry the chickpeas", "Mix"], ["Roast with cumin", "Roast"], ["Squeeze over the lemon", "Serve"]]));
    expect(p).toHaveLength(4);
    expect(p.join(" ")).toMatch(/salt/);
    expect(p.join(" ")).toMatch(/fat/);
    expect(p.join(" ")).toMatch(/aromatics/);
    expect(p.join(" ")).toMatch(/tastes and balances/);
  });
  it("a properly written dal passes", () => {
    const p = recipeProblems(r("Dal tadka", ["Toor dal", "Onion", "Garlic", "Ghee", "Cumin seeds", "Turmeric", "Salt", "Lemon"],
      [["Boil the dal with turmeric and salt", "Boil"], ["Heat the ghee, crackle the cumin, then fry the onion and garlic", "Sauté"], ["Taste, then adjust salt and a squeeze of lemon", "Stir"]]));
    expect(p).toEqual([]);
  });
  it("a smoothie needs salt and a tasting step but no aromatics or spices", () => {
    const p = recipeProblems(r("Banana smoothie", ["Banana", "Milk"], [["Blend everything", "Blend"]]));
    expect(p.some((x) => /aromatics|seasoning/.test(x))).toBe(false);
    expect(p.some((x) => /salt/.test(x))).toBe(true);
  });
});

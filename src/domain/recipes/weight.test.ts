import { describe, expect, it } from "vitest";
import type { Ingredient } from "./types";
import { weightOf } from "./weight";

const ing = (name: string, qty: number, unit = "", form?: Ingredient["form"]): Ingredient => ({ name, qty, unit, ...(form ? { form } : {}) });

describe("weightOf", () => {
  it("says dry for chickpeas by default and soaked when the recipe says so", () => {
    expect(weightOf(ing("Chickpeas", 2, "cups"), 2)).toBe("400 g dry");
    expect(weightOf(ing("Chickpeas", 2, "cups", "soaked"), 2)).toBe("360 g soaked");
    expect(weightOf(ing("Cooked chickpeas", 1, "cup"), 1)).toBe("165 g cooked");
  });
  it("weighs a can by its drained beans", () => {
    expect(weightOf(ing("Chickpeas", 2, "cans"), 2)).toBe("480 g canned");
  });
  it("weighs liquids and spoons without a state", () => {
    expect(weightOf(ing("Milk", 2, "cups"), 2)).toBe("490 g");
    expect(weightOf(ing("Ghee", 1, "tbsp"), 1)).toBe("14 g");
  });
  it("weighs pieces and switches to kg", () => {
    expect(weightOf(ing("Onions", 2), 2)).toBe("220 g");
    expect(weightOf(ing("Flour", 12, "cups"), 12)).toBe("1.5 kg");
  });
  it("never invents a weight", () => {
    expect(weightOf(ing("Saffron", 1, "pinch"), 1)).toBeNull();
    expect(weightOf(ing("Chickpeas", 1, "bunch"), 1)).toBeNull();
    expect(weightOf(ing("Milk", 0, "cup"), 0)).toBeNull();
  });
});

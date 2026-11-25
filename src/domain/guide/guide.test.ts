import { describe, expect, it } from "vitest";
import { fakePantry, item } from "../pantry/testing";
import type { Recipe } from "../recipes/types";
import { answerQuestion, prepList, stepGuide, suggestedQuestions, swapsFor } from "./guide";

const recipe: Recipe = {
  id: "dal", name: "Dal tadka", blurb: "", minutes: 35, servings: 4, meal: "Dinner", kcal: 480, protein: 22, carbs: 62, fat: 15, tint: "#fff",
  ingredients: [{ name: "Toor dal", qty: 1, unit: "cup" }, { name: "Garlic", qty: 4, unit: "cloves" }, { name: "Ghee", qty: 2, unit: "tbsp" }, { name: "Onions", qty: 2, unit: "" }],
  steps: [
    { text: "Chop the onions", verb: "Chop" },
    { text: "Boil the dal until soft", verb: "Simmer", minutes: 15, look: "The dal falls apart when pressed with a spoon." },
    { text: "Sauté garlic in ghee", verb: "Sauté", tip: "Take it off the heat the moment the garlic turns golden." },
  ],
  fixes: [{ problem: "bitter", fix: "Garlic that went too dark turns bitter. Start the tadka again with fresh garlic." }],
  swaps: [{ ingredient: "Toor dal", use: "masoor dal", note: "Cooks in about 15 minutes." }],
};
const ctx = (stepIndex = 1, servings = 4) => ({ recipe, stepIndex, servings, pantry: [item({ id: "oil", name: "Ghee", qty: 1 }), item({ id: "b", name: "Butter", qty: 0 })] });
const say = (q: string, c = ctx()) => answerQuestion(q, c);

describe("stepGuide", () => {
  it("uses the step's own words, else the verb's", () => {
    expect(stepGuide(recipe.steps[1]).look).toBe("The dal falls apart when pressed with a spoon.");
    expect(stepGuide(recipe.steps[1]).tip).toMatch(/heat down/); // from the verb
    expect(stepGuide(recipe.steps[2]).tip).toBe("Take it off the heat the moment the garlic turns golden.");
    expect(stepGuide({ text: "x", verb: "Flambé" }).look).toMatch(/looks and smells/); // unknown verb still gets guidance
  });
});

describe("prepList", () => {
  it("derives one line per ingredient, scaled to the servings", () => {
    expect(prepList(recipe, 4).map((p) => p.text)).toEqual(["1 cup toor dal · ≈ 200 g dry", "4 cloves garlic", "2 tbsp ghee · ≈ 28 g", "2 onions · ≈ 220 g"]);
    expect(prepList(recipe, 8)[0].text).toBe("2 cup toor dal · ≈ 400 g dry");
    expect(prepList(recipe, 2)[0].text).toBe("½ cup toor dal · ≈ 100 g dry");
  });
  it("uses the authored list when there is one", () => {
    expect(prepList({ ...recipe, prep: ["Soak the dal for 20 minutes"] }, 4)).toEqual([{ id: "p0", text: "Soak the dal for 20 minutes" }]);
  });
});

describe("swapsFor", () => {
  it("lists the recipe's own stand-ins first, then common ones, without repeats", () => {
    expect(swapsFor(recipe, "Toor dal")[0].use).toBe("masoor dal");
    expect(swapsFor(recipe, "butter")[0].use).toMatch(/ghee/);
    expect(swapsFor(recipe, "mystery spice")).toEqual([]);
  });
});

describe("answerQuestion", () => {
  it("how do I know it is done: the step's look", () => {
    expect(say("How do I know it is done?")).toMatchObject({ topic: "done", text: "The dal falls apart when pressed with a spoon." });
  });
  it("how long: the timer, or the recipe time when the step has none", () => {
    expect(say("how long does it take?").text).toMatch(/About 15 minutes/);
    expect(say("how long?", ctx(0)).text).toMatch(/no fixed time.*35 minutes/);
  });
  it("how much: scales to the servings and needs an ingredient", () => {
    expect(say("how much garlic?").text).toBe("4 cloves garlic for 4 servings.");
    expect(say("how much garlic?", ctx(1, 8)).text).toBe("8 cloves garlic for 8 servings.");
    expect(say("how much?").text).toMatch(/which ingredient/);
  });
  it("stand-ins: recipe first, says what the pantry has, and asks when no ingredient is named", () => {
    expect(say("I don't have toor dal").text).toMatch(/^Use masoor dal\. Cooks in about 15 minutes\./);
    expect(say("what can I use instead of butter?").text).toMatch(/^Use ghee or a neutral oil\./);
    expect(say("what can I use instead of butter?").text).toMatch(/You have ghee in your pantry/);
    expect(say("what can I use instead?").text).toMatch(/which ingredient/);
    expect(say("what can I use instead of unicorn?").text).toMatch(/do not have a stand-in|which ingredient/);
  });
  it("problems: the recipe's own fix first, then the common ones", () => {
    expect(say("the garlic is bitter").topic).toBe("fix");
    expect(say("it is too salty").text).toMatch(/water/);
    expect(say("I burnt it").text).toMatch(/clean pan/);
    expect(say("it looks runny").text).toMatch(/Simmer it uncovered/);
  });
  it("what's next and repeat", () => {
    expect(say("what's next?").text).toBe("Next: Sauté garlic in ghee.");
    expect(say("what's next?", ctx(2)).text).toMatch(/last step/);
    expect(say("say that again").text).toBe("Boil the dal until soft.");
  });
  it("anything else gets the list of what it can do, never an invented answer", () => {
    const a = say("what is the capital of France?");
    expect(a.topic).toBe("help");
    expect(a.text).toMatch(/how long.*done.*how much.*instead.*goes wrong/);
  });
  it("ignores case and spacing", () => {
    expect(say("   HOW DO I KNOW IT IS DONE   ").topic).toBe("done");
  });
});

describe("suggestedQuestions", () => {
  it("offers timing on a timed step and tips otherwise", () => {
    expect(suggestedQuestions(recipe, 1)).toContain("How long does it take?");
    expect(suggestedQuestions(recipe, 0)).toContain("Any tips for this step?");
    expect(suggestedQuestions(recipe, 0).length).toBeLessThanOrEqual(4);
  });
});
void fakePantry;

describe("composite ingredients", () => {
  it("ginger-garlic paste gets its own stand-in, not the plain garlic one", () => {
    const r = { swaps: [] } as unknown as Recipe;
    expect(swapsFor(r, "Ginger-garlic paste")[0].use).toMatch(/fresh ginger and garlic/);
    expect(swapsFor(r, "Garam masala")[0].note).toMatch(/cinnamon/);
  });
});

import type { Recipe } from "../recipes/types";

export type Appliance = "fridge" | "stove" | "oven" | "microwave" | "blender" | "toaster";
export const APPLIANCES: { id: Appliance; label: string }[] = [
  { id: "fridge", label: "Fridge" },
  { id: "stove", label: "Stove" },
  { id: "oven", label: "Oven" },
  { id: "microwave", label: "Microwave" },
  { id: "blender", label: "Blender" },
  { id: "toaster", label: "Toaster" },
];
export const ALL_APPLIANCES: Appliance[] = APPLIANCES.map((a) => a.id);

/** Which of the verbs a recipe uses need a machine. Each entry lists what can do the job. */
const NEEDS: Record<string, Appliance[]> = {
  Bake: ["oven"], Roast: ["oven"], Blend: ["blender"], Toast: ["toaster", "oven"],
  Boil: ["stove"], Simmer: ["stove"], Fry: ["stove"], Sauté: ["stove"], Sear: ["stove"],
};

/** True when the recipe's steps can all be done with what the person has. `have` missing means everything (not asked yet). */
export function cookableWith(recipe: Recipe, have?: Appliance[]): boolean {
  if (!have) return true;
  return recipe.steps.every((s) => {
    const need = NEEDS[s.verb];
    return !need || need.some((a) => have.includes(a));
  });
}

import type { Amount, ShopUnit, Unit } from "../pantry/types";

/** What a stepper tap moves by: a handful of grams, half a kilo, one piece. */
export const SHOP_UNITS: { id: ShopUnit; label: string; step: number }[] = [
  { id: "pcs", label: "pcs", step: 1 },
  { id: "g", label: "g", step: 50 },
  { id: "kg", label: "kg", step: 0.5 },
  { id: "ml", label: "ml", step: 100 },
  { id: "l", label: "l", step: 0.5 },
  { id: "tbsp", label: "tbsp", step: 1 },
  { id: "tsp", label: "tsp", step: 1 },
  { id: "cups", label: "cups", step: 0.5 },
  { id: "packs", label: "packs", step: 1 },
  { id: "cloves", label: "cloves", step: 1 },
  { id: "jar", label: "jar", step: 1 },
  { id: "bunch", label: "bunch", step: 1 },
];

export const stepOf = (u: ShopUnit): number => SHOP_UNITS.find((x) => x.id === u)!.step;

const round = (n: number) => Math.round(n * 100) / 100;

/** At least one step, at most 999, never a ragged decimal. */
export const clampAmount = (a: Amount): Amount => ({ unit: a.unit, qty: Math.min(999, Math.max(stepOf(a.unit), round(a.qty))) });

/** "2", "0.5", "1.25": no trailing zeros. */
export const formatQty = (n: number): string => String(round(n));

/** A recipe's unit word ("cup", "tbsp", "") as something a shop sells by. Unknown means pieces. */
export function shopUnitFor(recipeUnit: string): ShopUnit {
  const u = recipeUnit.trim().toLowerCase();
  if (u === "cup") return "cups";
  if (u === "clove") return "cloves";
  if (u === "pack") return "packs";
  return SHOP_UNITS.find((x) => x.id === u)?.id ?? "pcs";
}

/** The pantry only counts a few units; the rest are pieces there. */
export const pantryUnitFor = (u: ShopUnit): Unit => (u === "cloves" || u === "packs" || u === "jar" || u === "cups" ? u : "pcs");

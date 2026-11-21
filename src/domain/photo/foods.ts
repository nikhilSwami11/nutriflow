import type { DetectedItem } from "./types";

/** Things people often add when the detector misses them. Amounts and numbers are typical, per unit. */
export const EXTRA_FOODS: Omit<DetectedItem, "id" | "box" | "confidence" | "reason" | "color">[] = [
  { name: "Roti", amount: 1, step: 1, unit: "pcs", kcalPer: 100, protein: 3, carbs: 18, fat: 2.5, pantryName: "Wheat flour" },
  { name: "Curd", amount: 0.5, step: 0.25, unit: "cup", kcalPer: 150, protein: 8, carbs: 11, fat: 8, pantryName: "Curd" },
  { name: "Salad", amount: 1, step: 0.5, unit: "cup", kcalPer: 30, protein: 1.2, carbs: 6, fat: 0.2, pantryName: "Cucumber" },
  { name: "Papad", amount: 1, step: 1, unit: "pcs", kcalPer: 60, protein: 3, carbs: 9, fat: 1.5, pantryName: "Papad" },
  { name: "Boiled egg", amount: 1, step: 1, unit: "pcs", kcalPer: 78, protein: 6.3, carbs: 0.6, fat: 5.3, pantryName: "Eggs" },
];

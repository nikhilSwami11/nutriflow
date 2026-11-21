import type { PantryItem } from "@/domain/pantry";

/** Dev seed, taken from the Pantry design artboard. Used only by the in-memory repository. */
export const SEED: PantryItem[] = [
  { id: "onion", name: "Onions", group: "Produce", qty: 1, unit: "pcs", lowAt: 2 },
  { id: "tomato", name: "Tomatoes", group: "Produce", qty: 2, unit: "pcs", lowAt: 2 },
  { id: "garlic", name: "Garlic", group: "Produce", qty: 8, unit: "cloves", lowAt: 3 },
  { id: "butter", name: "Butter", group: "Dairy", qty: 0, unit: "packs", lowAt: 1 },
  { id: "ghee", name: "Ghee", group: "Dairy", qty: 1, unit: "jar", lowAt: 1 },
  { id: "eggs", name: "Eggs", group: "Dairy", qty: 6, unit: "pcs", lowAt: 3 },
  { id: "dal", name: "Toor dal", group: "Dry goods", qty: 3, unit: "cups", lowAt: 1 },
  { id: "rice", name: "Basmati rice", group: "Dry goods", qty: 5, unit: "cups", lowAt: 2 },
  { id: "cumin", name: "Cumin seeds", group: "Dry goods", qty: 1, unit: "jar", lowAt: 1 },
];

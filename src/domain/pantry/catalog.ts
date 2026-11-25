import { foodKey } from "./foodKey";
import type { PantryGroup, PantryItem, Unit } from "./types";

export interface CatalogItem {
  name: string;
  group: PantryGroup;
  unit: Unit;
  /** How much a first "I have it" adds. */
  qty: number;
  /** A picture in public/ingredients/<slug>.webp, once one exists (see docs/ingredient-images.md). */
  image?: string;
}

const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Slugs that have a picture in public/ingredients. Add one here after running the image script. */
const WITH_IMAGE = new Set<string>([]);

const c = (name: string, group: PantryGroup, unit: Unit, qty: number): CatalogItem => ({ name, group, unit, qty, ...(WITH_IMAGE.has(slug(name)) ? { image: `/ingredients/${slug(name)}.webp` } : {}) });

/** The things most kitchens have, in the order they are suggested. */
export const CATALOG: CatalogItem[] = [
  c("Onions", "Produce", "pcs", 3), c("Tomatoes", "Produce", "pcs", 3), c("Potatoes", "Produce", "pcs", 4), c("Garlic", "Produce", "cloves", 6),
  c("Ginger", "Produce", "pcs", 1), c("Carrots", "Produce", "pcs", 3), c("Spinach", "Produce", "packs", 1), c("Cucumbers", "Produce", "pcs", 2),
  c("Lemons", "Produce", "pcs", 2), c("Bananas", "Produce", "pcs", 4), c("Green chillies", "Produce", "pcs", 4), c("Coriander", "Produce", "packs", 1),
  c("Cauliflower", "Produce", "pcs", 1), c("Peas", "Produce", "packs", 1),
  c("Eggs", "Dairy", "pcs", 6), c("Milk", "Dairy", "packs", 1), c("Butter", "Dairy", "packs", 1), c("Paneer", "Dairy", "packs", 1),
  c("Yogurt", "Dairy", "jar", 1), c("Cheese", "Dairy", "packs", 1), c("Ghee", "Dairy", "jar", 1),
  c("Rice", "Dry goods", "packs", 1), c("Flour", "Dry goods", "packs", 1), c("Toor dal", "Dry goods", "packs", 1), c("Chickpeas", "Dry goods", "packs", 1),
  c("Rolled oats", "Dry goods", "packs", 1), c("Pasta", "Dry goods", "packs", 1), c("Bread", "Dry goods", "packs", 1), c("Oil", "Dry goods", "jar", 1),
  c("Salt", "Dry goods", "jar", 1), c("Black pepper", "Dry goods", "jar", 1), c("Sugar", "Dry goods", "packs", 1), c("Cumin seeds", "Dry goods", "jar", 1),
  c("Turmeric", "Dry goods", "jar", 1), c("Garam masala", "Dry goods", "jar", 1), c("Tea", "Dry goods", "packs", 1),
];

/** The catalog picture for a pantry item's name, if there is one. */
export const pictureFor = (name: string): string | undefined => CATALOG.find((x) => foodKey(x.name) === foodKey(name))?.image;

/** What to offer when adding by hand: things not already at home, those with a picture first, then the usual order. */
export function suggestItems(pantry: Pick<PantryItem, "name" | "qty">[], query = ""): CatalogItem[] {
  const q = query.trim().toLowerCase();
  const have = new Set(pantry.filter((p) => p.qty > 0).map((p) => foodKey(p.name)));
  const list = CATALOG.filter((x) => !have.has(foodKey(x.name)) && (!q || x.name.toLowerCase().includes(q)));
  return [...list.filter((x) => x.image), ...list.filter((x) => !x.image)];
}

/** A plain-text list ("Onions\nEggs"), for copying or mailing. */
export const listAsText = (names: string[], title = "Shopping list"): string => (names.length ? `${title}\n${names.map((n) => `- ${n}`).join("\n")}` : "");

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedItem, PantryGroup, Unit } from "@/domain/pantry";
import type { DetectedItem, Detection, MealDetector, PantryScanner, ScanMode } from "@/domain/photo";

/** Pastels for the items of one meal, in order. */
const COLORS = ["#9EC8F3", "#F2A3A9", "#B9A7EE", "#8FD3C0", "#F4E3A1", "#F7C9BB"];
const MAX_SIDE = 1024;

/** Shrinks a photo to a JPEG data URL a model can read fast (about 100 to 300 KB). Browser only. */
export async function toJpegDataUrl(blob: Blob): Promise<string> {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvas.toDataURL("image/jpeg", 0.8);
}

interface MealReply {
  dish: string;
  confidence: number;
  items: { name: string; amount: number; step: number; unit: string; kcal_per: number; protein: number; carbs: number; fat: number; confidence: number; reason: string }[];
}

const num = (n: unknown, lo: number, hi: number, fallback: number) => (typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi ? n : fallback);

/** Maps the model's answer to what the screen needs; numbers outside sane ranges are dropped, never trusted. */
export function toDetection(reply: MealReply): Detection | null {
  const items = (reply.items ?? [])
    .filter((i) => typeof i.name === "string" && i.name.trim() && i.amount > 0 && i.kcal_per >= 0 && i.kcal_per <= 900)
    .slice(0, 8)
    .map<DetectedItem>((i, n) => ({
      id: `v${n}`,
      name: i.name.trim().slice(0, 40),
      confidence: Math.round(num(i.confidence, 0, 100, 60)),
      amount: num(i.amount, 0.1, 20, 1),
      step: num(i.step, 0.05, 5, 0.5),
      unit: i.unit,
      kcalPer: Math.round(i.kcal_per),
      protein: num(i.protein, 0, 100, 0),
      carbs: num(i.carbs, 0, 200, 0),
      fat: num(i.fat, 0, 100, 0),
      color: COLORS[n % COLORS.length],
      // A language model cannot place boxes reliably, so there are none: the screen skips empty boxes.
      box: { x: 0, y: 0, w: 0, h: 0 },
      pantryName: i.name.trim(),
      reason: i.reason?.slice(0, 160) ?? "",
    }));
  if (!items.length) return null;
  return { source: "vision", dish: reply.dish?.slice(0, 60) || items[0].name, confidence: Math.round(num(reply.confidence, 0, 100, 70)), items };
}

/** Reads the meal photo with a vision model (edge function `scan-photo`). */
export class EdgeMealDetector implements MealDetector {
  constructor(private db: SupabaseClient) {}
  async detect(image: Blob | null): Promise<Detection> {
    if (!image) throw new Error("no photo");
    const { data, error } = await this.db.functions.invoke("scan-photo", { body: { mode: "meal", image: await toJpegDataUrl(image) } });
    if (error) throw error;
    const out = toDetection(data as MealReply);
    if (!out) throw new Error("no food found");
    return out;
  }
}

/** Tries the real reader; when there is no photo, no connection or nothing found, the example answers (and the screen says so). */
export class FallbackMealDetector implements MealDetector {
  constructor(private first: MealDetector, private second: MealDetector) {}
  async detect(image: Blob | null): Promise<Detection> {
    try {
      return await this.first.detect(image);
    } catch {
      return this.second.detect(image);
    }
  }
}

const UNITS: Unit[] = ["pcs", "cloves", "packs", "jar", "cups"];
const GROUPS: PantryGroup[] = ["Produce", "Dairy", "Dry goods"];

/** Reads a shelf, fridge or receipt photo into pantry items. Nothing is added until the person confirms. */
export class EdgePantryScanner implements PantryScanner {
  constructor(private db: SupabaseClient) {}
  async scan(image: Blob, mode: ScanMode): Promise<ParsedItem[]> {
    const { data, error } = await this.db.functions.invoke("scan-photo", { body: { mode, image: await toJpegDataUrl(image) } });
    if (error) throw error;
    const items = (data as { items?: { name: string; qty: number; unit: string; group: string }[] }).items ?? [];
    return items
      .filter((i) => typeof i.name === "string" && i.name.trim() && i.qty > 0)
      .slice(0, 40)
      .map((i) => ({
        name: i.name.trim().toLowerCase().slice(0, 60),
        qty: Math.min(99, Math.round(i.qty)),
        unit: UNITS.includes(i.unit as Unit) ? (i.unit as Unit) : "pcs",
        group: GROUPS.includes(i.group as PantryGroup) ? (i.group as PantryGroup) : "Dry goods",
      }));
  }
}

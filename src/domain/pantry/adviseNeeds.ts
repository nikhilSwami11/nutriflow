import type { BuyAdvisor } from "./ports";
import { SHOP_UNIT_IDS, type Need } from "./types";

const SAME = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Ask the advisor how much to buy; anything it gets wrong, or if it is slow, down or missing, keeps the recipe's own
 * amount. The list never waits on it longer than `timeoutMs` and never breaks because of it.
 */
export async function adviseNeeds(advisor: BuyAdvisor | undefined, needs: Need[], timeoutMs = 6000): Promise<Need[]> {
  if (!advisor || !needs.length) return needs;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const advised = await Promise.race([
      advisor.suggest(needs),
      new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error("advisor timed out")), timeoutMs))),
    ]);
    return needs.map((n, i) => {
      const a = advised[i];
      const ok = a && SAME(a.name, n.name) && typeof a.qty === "number" && Number.isFinite(a.qty) && a.qty > 0 && SHOP_UNIT_IDS.some((u) => u === a.unit);
      return ok ? { name: n.name, qty: a.qty, unit: a.unit } : n;
    });
  } catch {
    return needs;
  } finally {
    clearTimeout(timer);
  }
}

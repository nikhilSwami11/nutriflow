import { DEFAULT_AMOUNT } from "@/domain/pantry/types";
import type { Amount, ParsedItem, PantryItem, PantryRepository, ShoppingListRepository, UtteranceParser } from "@/domain/pantry";

export class InMemoryPantryRepository implements PantryRepository {
  private items: Map<string, PantryItem>;
  constructor(seed: PantryItem[] = []) {
    this.items = new Map(seed.map((i) => [i.id, i]));
  }
  async list() {
    return [...this.items.values()];
  }
  async save(items: PantryItem[]) {
    items.forEach((i) => this.items.set(i.id, i));
  }
  async remove(ids: string[]) {
    ids.forEach((i) => this.items.delete(i));
  }
}

export class InMemoryShoppingListRepository implements ShoppingListRepository {
  private ids = new Map<string, Amount>();
  async list() {
    return [...this.ids.keys()];
  }
  async add(ids: string[], amounts: Record<string, Amount> = {}) {
    ids.forEach((i) => this.ids.has(i) || this.ids.set(i, amounts[i] ?? DEFAULT_AMOUNT));
  }
  async remove(ids: string[]) {
    ids.forEach((i) => this.ids.delete(i));
  }
  async amounts() {
    return Object.fromEntries(this.ids);
  }
  async setAmount(id: string, amount: Amount) {
    if (this.ids.has(id)) this.ids.set(id, amount);
  }
}

const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

/** Local stand-in for the edge function, same rules. shortcut: regex only, real parsing is the AI edge function. */
export class LocalUtteranceParser implements UtteranceParser {
  async parse(text: string): Promise<ParsedItem[]> {
    return text
      .replace(/^\s*i\s+(have|got|bought)\s+/i, "")
      .split(/,|\band\b/i)
      .map((s) => s.trim().replace(/[.!?]$/, ""))
      .filter(Boolean)
      .map((part) => {
        const m = part.match(/^(\d+|[a-z]+)\s+(.+)$/i);
        const n = m ? (/^\d+$/.test(m[1]) ? Number(m[1]) : WORDS[m[1].toLowerCase()]) : undefined;
        return n && m ? { name: m[2], qty: n } : { name: part, qty: 1 };
      });
  }
}

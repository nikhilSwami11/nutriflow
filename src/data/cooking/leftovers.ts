import type { Leftover, LeftoverRepository } from "@/domain/leftovers";
import type { KeyValueStore } from "../feed/local";

const KEY = "nutriflow.leftovers";

/** Cooked portions kept in the browser (like prep ticks used to be). Never throws: storage can be blocked. */
export class LocalLeftoverRepository implements LeftoverRepository {
  constructor(private store: KeyValueStore) {}

  private read(): Leftover[] {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as Leftover[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: Leftover[]) {
    try {
      this.store.setItem(KEY, JSON.stringify(items.slice(-50)));
    } catch {
      /* losing a leftover note is fine */
    }
  }

  async list() {
    return this.read();
  }

  async add(item: Leftover) {
    this.write([...this.read().filter((x) => x.id !== item.id), item]);
  }

  async setPortions(id: string, portions: number) {
    this.write(this.read().flatMap((x) => (x.id !== id ? [x] : portions > 0 ? [{ ...x, portions }] : [])));
  }
}

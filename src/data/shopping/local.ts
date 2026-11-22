import type { ShoppingPrefs, ShoppingPrefsRepository } from "@/domain/shopping";

interface Store {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
}

const KEY = "nutriflow.shoppingPrefs";

/** Kept in the browser for now. Never throws: storage can be blocked. */
export class LocalShoppingPrefsRepository implements ShoppingPrefsRepository {
  constructor(private store: Store) {}
  async get() {
    try {
      const raw = this.store.getItem(KEY);
      return raw ? (JSON.parse(raw) as ShoppingPrefs) : null;
    } catch {
      return null;
    }
  }
  async save(prefs: ShoppingPrefs) {
    try {
      this.store.setItem(KEY, JSON.stringify(prefs));
    } catch {
      /* blocked storage: the choice lasts until the page closes */
    }
  }
}

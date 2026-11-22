export type StoreId = "walmart" | "aldi" | "costco";

export const STORES: { id: StoreId; name: string }[] = [
  { id: "walmart", name: "Walmart" },
  { id: "aldi", name: "Aldi" },
  { id: "costco", name: "Costco" },
];

export interface ShoppingPrefs {
  /** US ZIP code, 5 digits. */
  zip: string;
  store: StoreId;
}

export interface ShoppingPrefsRepository {
  get(): Promise<ShoppingPrefs | null>;
  save(prefs: ShoppingPrefs): Promise<void>;
}

export const isZip = (s: string): boolean => /^\d{5}$/.test(s.trim());

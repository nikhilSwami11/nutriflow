import type { StoreId } from "./types";

// shortcut: a search page, not a cart. Walmart's add-to-cart link needs Walmart item ids we do not have yet; upgrade when a product search is connected.
const SEARCH: Record<StoreId, string> = {
  walmart: "https://www.walmart.com/search?q=",
  aldi: "https://www.aldi.us/results?q=",
  costco: "https://www.costco.com/CatalogSearch?keyword=",
};

export const storeSearchUrl = (store: StoreId, item: string): string => SEARCH[store] + encodeURIComponent(item.trim());

import type { Amount, Need, ParsedItem, PantryItem } from "./types";

export interface PantryRepository {
  list(): Promise<PantryItem[]>;
  /** Insert or update by id. */
  save(items: PantryItem[]): Promise<void>;
}

/** Ids of pantry items on the shopping list. */
export interface ShoppingListRepository {
  list(): Promise<string[]>;
  /** Adds items. Amounts default to 1 piece; one already on the list keeps what it has. */
  add(ids: string[], amounts?: Record<string, Amount>): Promise<void>;
  /** How much to buy, by item id. An id on the list but missing here means 1 piece. */
  amounts(): Promise<Record<string, Amount>>;
  setAmount(id: string, amount: Amount): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

/** Turns "I have 3 onions, 2 tomatoes and butter" into items. Implemented behind an edge function. */
export interface UtteranceParser {
  parse(text: string): Promise<ParsedItem[]>;
}

/** Turns recipe amounts ("3 cups milk") into what a shopper buys ("1 l"). Same names, same order. Implemented behind an edge function. */
export interface BuyAdvisor {
  suggest(needs: Need[]): Promise<Need[]>;
}

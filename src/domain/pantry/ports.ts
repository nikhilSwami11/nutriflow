import type { ParsedItem, PantryItem } from "./types";

export interface PantryRepository {
  list(): Promise<PantryItem[]>;
  /** Insert or update by id. */
  save(items: PantryItem[]): Promise<void>;
}

/** Ids of pantry items on the shopping list. */
export interface ShoppingListRepository {
  list(): Promise<string[]>;
  add(ids: string[]): Promise<void>;
  remove(ids: string[]): Promise<void>;
}

/** Turns "I have 3 onions, 2 tomatoes and butter" into items. Implemented behind an edge function. */
export interface UtteranceParser {
  parse(text: string): Promise<ParsedItem[]>;
}

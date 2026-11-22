import type { Amount } from "../pantry/types";

/** A bought item stays visible this long, so it can be found and undone. */
export const BOUGHT_KEEP_MS = 12 * 60 * 60 * 1000;

export interface BoughtRecord {
  id: string;
  /** Pantry quantity before the purchase, for undo. */
  prevQty: number;
  amount: Amount;
  at: number;
}

export interface BoughtRepository {
  list(): Promise<BoughtRecord[]>;
  save(records: BoughtRecord[]): Promise<void>;
}

/** Newest first, nothing older than 12 hours. */
export const recentlyBought = (records: BoughtRecord[], now: number): BoughtRecord[] =>
  records.filter((r) => now - r.at < BOUGHT_KEEP_MS).sort((a, b) => b.at - a.at);

/** Adds (or replaces) one record and drops the expired ones, so storage does not grow. */
export const withBought = (records: BoughtRecord[], record: BoughtRecord): BoughtRecord[] =>
  recentlyBought([...records.filter((r) => r.id !== record.id), record], record.at);

export const withoutBought = (records: BoughtRecord[], id: string): BoughtRecord[] => records.filter((r) => r.id !== id);

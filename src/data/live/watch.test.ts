import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LIVE_TABLES, watchTables } from "./watch";

function fakeDb() {
  const handlers: (() => void)[] = [];
  const tables: string[] = [];
  const channel = {
    on: (_t: string, f: { table: string }, h: () => void) => (tables.push(f.table), handlers.push(h), channel),
    subscribe: vi.fn(),
  };
  const db = { channel: () => channel, removeChannel: vi.fn(async () => "ok") };
  return { db: db as unknown as SupabaseClient, handlers, tables, removeChannel: db.removeChannel };
}

describe("watchTables", () => {
  it("listens to every live table and calls once for a burst of changes", () => {
    vi.useFakeTimers();
    const { db, handlers, tables } = fakeDb();
    const onChange = vi.fn();
    watchTables(db, onChange, 100);
    expect(tables).toEqual([...LIVE_TABLES]);
    handlers[0]();
    handlers[3]();
    vi.advanceTimersByTime(99);
    expect(onChange).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onChange).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it("stop removes the channel and drops a pending call", () => {
    vi.useFakeTimers();
    const { db, handlers, removeChannel } = fakeDb();
    const onChange = vi.fn();
    const stop = watchTables(db, onChange, 100);
    handlers[0]();
    stop();
    vi.advanceTimersByTime(200);
    expect(onChange).not.toHaveBeenCalled();
    expect(removeChannel).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

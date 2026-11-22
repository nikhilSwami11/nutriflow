import { describe, expect, it } from "vitest";
import type { FeedEvent } from "@/domain/feed";
import { LocalFeedEventRepository } from "./local";
import { MirroredFeedEventRepository } from "./mirrored";
import { fromRow, toRow } from "./supabase";

const mem = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) };
};
const ev = (ts: number, over: Partial<FeedEvent> = {}): FeedEvent => ({ itemId: "x", kind: "day-chart", action: "open", position: 1, ts, ...over });

describe("LocalFeedEventRepository", () => {
  it("appends and returns events since a time", async () => {
    const r = new LocalFeedEventRepository(mem());
    await r.append([ev(100), ev(200)]);
    await r.append([ev(300)]);
    expect((await r.recent(150)).map((e) => e.ts)).toEqual([200, 300]);
  });
  it("keeps only the latest 500", async () => {
    const r = new LocalFeedEventRepository(mem());
    await r.append(Array.from({ length: 520 }, (_, i) => ev(i)));
    const all = await r.recent(0);
    expect(all).toHaveLength(500);
    expect(all[0].ts).toBe(20);
  });
  it("survives corrupt or blocked storage", async () => {
    const bad = { getItem: () => "{not json", setItem: () => { throw new Error("blocked"); } };
    const r = new LocalFeedEventRepository(bad);
    await expect(r.append([ev(1)])).resolves.toBeUndefined();
    expect(await r.recent(0)).toEqual([]);
  });
});

describe("supabase row mapping", () => {
  it("round-trips, including dwell", () => {
    const e = ev(1_800_000_000_000, { action: "impression", dwellMs: 2500 });
    expect(fromRow(toRow(e))).toEqual(e);
  });
  it("a missing dwell stays undefined", () => {
    expect(fromRow(toRow(ev(1_800_000_000_000))).dwellMs).toBeUndefined();
  });
});

describe("MirroredFeedEventRepository", () => {
  const down = { append: async () => { throw new Error("down"); }, recent: async () => { throw new Error("down"); } };
  it("keeps events locally and reads them back when the server is down", async () => {
    const local = new LocalFeedEventRepository(mem());
    const r = new MirroredFeedEventRepository(local, down);
    await expect(r.append([ev(100)])).resolves.toBeUndefined();
    expect((await r.recent(0)).map((e) => e.ts)).toEqual([100]);
  });
  it("copies to the server and reads from it when up", async () => {
    const remote = new LocalFeedEventRepository(mem());
    const r = new MirroredFeedEventRepository(new LocalFeedEventRepository(mem()), remote);
    await r.append([ev(5)]);
    expect((await remote.recent(0)).map((e) => e.ts)).toEqual([5]);
  });
});

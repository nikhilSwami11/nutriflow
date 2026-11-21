import { describe, expect, it } from "vitest";
import { buildFeed, usableItems, type FeedContext } from "./buildFeed";
import { kindBoost, summarizeEvents, WINDOW_MS } from "./events";
import { FEED_KINDS, type FeedEvent, type FeedKind } from "./types";

const NOW = 1_800_000_000_000;
const ev = (kind: FeedKind, action: FeedEvent["action"], ts = NOW, dwellMs?: number): FeedEvent => ({ itemId: `${kind}:d`, kind, action, position: 0, ts, dwellMs });
const base: FeedContext = {
  date: "2026-11-21", now: NOW, nextMeal: { meal: "Lunch", recipeId: "dal-rice" },
  meals: [{ meal: "Breakfast", recipeId: "oats" }, { meal: "Lunch", recipeId: "dal-rice" }, { meal: "Dinner", recipeId: "dal-tadka" }], lowItems: 3, planNotes: ["Tuesday is 16 g short on protein."],
  stats: summarizeEvents([], NOW),
};
const order = (c: Partial<FeedContext>) => buildFeed({ ...base, ...c }).items.map((i) => i.kind);

describe("summarizeEvents", () => {
  it("counts per kind and sums dwell", () => {
    const s = summarizeEvents([ev("day-chart", "impression", NOW, 3000), ev("day-chart", "impression", NOW, 2000), ev("day-chart", "open"), ev("pantry-alert", "add-to-list")], NOW);
    expect(s["day-chart"]).toMatchObject({ impressions: 2, opens: 1, dwellMs: 5000 });
    expect(s["pantry-alert"].acts).toBe(1);
  });
  it("an unlike cancels the like and never goes negative", () => {
    expect(summarizeEvents([ev("day-chart", "like"), ev("day-chart", "unlike"), ev("day-chart", "unlike")], NOW)["day-chart"].likes).toBe(0);
  });
  it("ignores events older than 14 days", () => {
    expect(summarizeEvents([ev("day-chart", "open", NOW - WINDOW_MS - 1)], NOW)["day-chart"].opens).toBe(0);
  });
  it("has an entry for every kind", () => {
    expect(Object.keys(summarizeEvents([], NOW)).sort()).toEqual([...FEED_KINDS].sort());
  });
});

describe("kindBoost", () => {
  it("raises with engagement, drops harder with dismissals, and is capped both ways", () => {
    const z = summarizeEvents([], NOW)["day-chart"];
    expect(kindBoost(z)).toBe(0);
    expect(kindBoost({ ...z, opens: 2 })).toBe(4);
    expect(kindBoost({ ...z, opens: 100 })).toBe(20);
    expect(kindBoost({ ...z, dismisses: 1, opens: 2 })).toBe(-6);
    expect(kindBoost({ ...z, dismisses: 50 })).toBe(-20);
  });
});

describe("buildFeed", () => {
  it("with no history: next meal, chart, pantry, plan nudge", () => {
    expect(order({})).toEqual(["next-meal", "day-chart", "pantry-alert", "plan-nudge"]);
  });
  it("is deterministic and versioned", () => {
    expect(buildFeed(base)).toEqual(buildFeed(base));
    expect(buildFeed(base).schemaVersion).toBe(1);
  });
  it("omits posts that do not apply", () => {
    expect(order({ lowItems: 0, planNotes: [] })).toEqual(["next-meal", "day-chart"]);
  });
  it("shows all-done instead of next-meal when nothing is left", () => {
    expect(order({ nextMeal: null })).toEqual(["all-done", "day-chart", "pantry-alert", "plan-nudge"]);
  });
  it("moves a kind the user keeps engaging with up", () => {
    const stats = summarizeEvents([ev("plan-nudge", "open"), ev("plan-nudge", "open"), ev("plan-nudge", "save"), ev("plan-nudge", "like"), ev("plan-nudge", "open"), ev("plan-nudge", "open")], NOW);
    expect(order({ stats }).indexOf("plan-nudge")).toBeLessThan(order({}).indexOf("plan-nudge"));
  });
  it("pushes a dismissed kind down", () => {
    const stats = summarizeEvents([ev("day-chart", "dismiss"), ev("day-chart", "dismiss")], NOW);
    expect(order({ stats }).indexOf("day-chart")).toBeGreaterThan(order({}).indexOf("day-chart"));
  });
  it("gives each item a per-day id", () => {
    expect(buildFeed(base).items[0].id).toBe("next-meal:2026-11-21");
  });
});

describe("usableItems", () => {
  it("drops kinds the client does not know and newer schemas", () => {
    const feed = { schemaVersion: 1, items: [{ kind: "day-chart" }, { kind: "hologram" }, { kind: "next-meal" }] };
    expect(usableItems(feed, FEED_KINDS)).toEqual([0, 2]);
    expect(usableItems({ ...feed, schemaVersion: 2 }, FEED_KINDS)).toEqual([]);
  });
});

describe("stories", () => {
  const kinds = (c: Partial<FeedContext>) => (buildFeed({ ...base, ...c }).stories ?? []).map((s) => s.id.split(":")[1] + (s.kind === "meal" ? `:${s.id.split(":")[2]}` : ""));
  it("one per planned meal in day order, then pantry and plan", () => {
    expect(kinds({})).toEqual(["meal:Breakfast", "meal:Lunch", "meal:Dinner", "pantry", "plan"]);
  });
  it("drops pantry and plan stories when they do not apply", () => {
    expect(kinds({ lowItems: 0, planNotes: [] })).toEqual(["meal:Breakfast", "meal:Lunch", "meal:Dinner"]);
  });
  it("ids are per day, so a seen story stays seen all day and resets tomorrow", () => {
    const a = buildFeed(base).stories!.map((s) => s.id);
    const b = buildFeed({ ...base, date: "2026-11-22" }).stories!.map((s) => s.id);
    expect(a.some((id) => b.includes(id))).toBe(false);
  });
  it("is not changed by past engagement (the row never jumps)", () => {
    const stats = summarizeEvents([ev("plan-nudge", "open"), ev("plan-nudge", "open"), ev("plan-nudge", "open")], NOW);
    expect(buildFeed({ ...base, stats }).stories).toEqual(buildFeed(base).stories);
  });
});

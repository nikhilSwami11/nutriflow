import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

describe("design system radii", () => {
  it("never uses 14, 18 or 24px corners (CLAUDE.md: cards 20, tiles 16, sheets and full-bleed 28)", () => {
    const bad = files(__dirname).filter((p) => /rounded-(3xl|\[(14|18|24)px\])/.test(readFileSync(p, "utf8")));
    expect(bad).toEqual([]);
  });
});

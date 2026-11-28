import { describe, expect, it } from "vitest";
import { activeLeftovers, leftoverFrom, type Leftover } from "./index";

const l = (id: string, madeOn: string, portions = 2): Leftover => ({ id, recipeId: "dal", name: "Dal", portions, madeOn });

describe("leftovers", () => {
  it("keeps what was cooked within three days and still has portions, newest first", () => {
    const out = activeLeftovers([l("a", "2026-11-20"), l("b", "2026-11-25"), l("c", "2026-11-27"), l("d", "2026-11-27", 0)], "2026-11-27");
    expect(out.map((x) => x.id)).toEqual(["c", "b"]);
  });
  it("makes a leftover from cooked minus eaten, to the half serving", () => {
    expect(leftoverFrom({ id: "dal", name: "Dal" }, 4, 1.5, "x", "2026-11-27")?.portions).toBe(2.5);
    expect(leftoverFrom({ id: "dal", name: "Dal" }, 2, 2, "x", "2026-11-27")).toBeNull();
    expect(leftoverFrom({ id: "dal", name: "Dal" }, 2, 1.8, "x", "2026-11-27")).toBeNull();
  });
});

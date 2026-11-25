import { describe, expect, it } from "vitest";
import { CATALOG, suggestItems } from "./catalog";

describe("suggestItems", () => {
  it("leaves out what is already at home, but not what ran out", () => {
    const names = suggestItems([{ name: "onion", qty: 2 }, { name: "Eggs", qty: 0 }]).map((x) => x.name);
    expect(names).not.toContain("Onions");
    expect(names).toContain("Eggs");
  });
  it("filters by what was typed", () => {
    expect(suggestItems([], "rice").map((x) => x.name)).toEqual(["Rice"]);
    expect(suggestItems([], "zzz")).toEqual([]);
  });
  it("has no duplicate names and every unit is a pantry unit", () => {
    expect(new Set(CATALOG.map((x) => x.name)).size).toBe(CATALOG.length);
    for (const x of CATALOG) expect(["pcs", "cloves", "packs", "jar", "cups"]).toContain(x.unit);
  });
});

import { listAsText } from "./catalog";
describe("listAsText", () => {
  it("is a titled bullet list, and empty when nothing is chosen", () => {
    expect(listAsText(["Onions", "Eggs"])).toBe("Shopping list\n- Onions\n- Eggs");
    expect(listAsText([])).toBe("");
  });
});

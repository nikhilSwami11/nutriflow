import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DISH_PICTURES } from "./pictures";

describe("DISH_PICTURES", () => {
  it("every listed picture exists in public/recipes, and no name is listed twice", () => {
    for (const p of DISH_PICTURES) expect(existsSync(`public${p.image}`), p.image).toBe(true);
    expect(new Set(DISH_PICTURES.map((p) => p.name)).size).toBe(DISH_PICTURES.length);
  });
});

import { describe, expect, it } from "vitest";
import { foodKey, hasFood } from "./foodKey";

describe("foodKey", () => {
  it("matches singular and plural, case and spaces", () => {
    expect(foodKey(" Tomatoes")).toBe(foodKey("tomato"));
    expect(foodKey("Onions")).toBe(foodKey("onion"));
  });
  it("hasFood needs some left", () => {
    expect(hasFood([{ name: "Tomatoes", qty: 2 }], "tomato")).toBe(true);
    expect(hasFood([{ name: "Tomatoes", qty: 0 }], "tomato")).toBe(false);
  });
});

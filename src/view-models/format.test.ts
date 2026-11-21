import { expect, it } from "vitest";
import { joinList } from "./format";

it("joins lists", () => {
  expect(joinList([])).toBe("");
  expect(joinList(["a"])).toBe("a");
  expect(joinList(["a", "b"])).toBe("a and b");
  expect(joinList(["a", "b", "c"])).toBe("a, b and c");
});

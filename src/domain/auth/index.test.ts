import { describe, expect, it } from "vitest";
import { assistantOf } from "./index";

describe("assistantOf", () => {
  it("tells Claude and ChatGPT apart by the registered name", () => {
    expect(assistantOf("Claude")).toBe("claude");
    expect(assistantOf("claude.ai")).toBe("claude");
    expect(assistantOf("ChatGPT")).toBe("chatgpt");
    expect(assistantOf("OpenAI Connector")).toBe("chatgpt");
  });
  it("is null for any other app", () => {
    expect(assistantOf("Cursor")).toBeNull();
  });
});

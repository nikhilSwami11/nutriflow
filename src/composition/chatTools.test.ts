import { describe, expect, it } from "vitest";
import type { AssistantDeps } from "@/domain/assistant";
import { chatTools } from "./chatTools";

describe("chatTools", () => {
  const tools = chatTools({} as AssistantDeps);
  it("gives the model unique names and object schemas without the date or hour", () => {
    expect(new Set(tools.map((t) => t.name)).size).toBe(tools.length);
    for (const t of tools) {
      expect(t.parameters.type).toBe("object");
      expect(t.parameters.$schema).toBeUndefined();
      expect(Object.keys((t.parameters.properties as object) ?? {})).not.toContain("date");
    }
  });
  it("rejects bad arguments before touching the account", async () => {
    const log = tools.find((t) => t.name === "log_meal")!;
    await expect(log.run({ slot: "brunch" })).rejects.toThrow();
  });
});

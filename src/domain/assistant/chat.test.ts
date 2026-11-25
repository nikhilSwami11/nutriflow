import { describe, expect, it } from "vitest";
import { chatTurn, type ChatBrain, type ChatTool } from "./chat";

const now = { date: "2026-11-24", hour: 12 };
const pantry: ChatTool = { name: "pantry", description: "", parameters: {}, run: async () => [{ name: "eggs", qty: 6 }] };
const broken: ChatTool = { name: "broken", description: "", parameters: {}, run: async () => { throw new Error("bad input"); } };

/** A brain that plays back answers in order and records what it was sent. */
const scripted = (answers: Awaited<ReturnType<ChatBrain["next"]>>[]) => {
  const seen: Parameters<ChatBrain["next"]>[0][] = [];
  const brain: ChatBrain = { next: async (i) => (seen.push(structuredClone(i)), answers.shift() ?? { text: "" }) };
  return { brain, seen };
};

describe("chatTurn", () => {
  it("answers in words when no tool is needed", async () => {
    const { brain } = scripted([{ text: "Hi." }]);
    const out = await chatTurn(brain, [pantry], [], "hello", now);
    expect(out.text).toBe("Hi.");
    expect(out.used).toEqual([]);
    expect(out.history.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("runs the tools the model asks for and feeds the results back", async () => {
    const { brain, seen } = scripted([{ calls: [{ id: "c1", name: "pantry", args: "{}" }] }, { text: "You have 6 eggs." }]);
    const out = await chatTurn(brain, [pantry], [], "what do I have?", now);
    expect(out.text).toBe("You have 6 eggs.");
    expect(out.used).toEqual([{ name: "pantry", result: [{ name: "eggs", qty: 6 }] }]);
    expect(seen[1].messages.at(-1)).toEqual({ role: "tool", tool_call_id: "c1", content: '[{"name":"eggs","qty":6}]' });
    expect(seen[0].tools).toEqual([{ name: "pantry", description: "", parameters: {} }]);
  });

  it("gives a tool error back to the model instead of failing", async () => {
    const { brain, seen } = scripted([{ calls: [{ id: "c1", name: "broken", args: "{}" }, { id: "c2", name: "nope", args: "{}" }] }, { text: "Sorry." }]);
    const out = await chatTurn(brain, [broken], [], "x", now);
    expect(out.text).toBe("Sorry.");
    expect(out.used).toEqual([]);
    expect(seen[1].messages.slice(-2).map((m) => m.role === "tool" && JSON.parse(m.content).error)).toEqual(["bad input", "No tool nope."]);
  });

  it("throws when the model keeps calling tools or says nothing, so the caller can fall back", async () => {
    const loop = { calls: [{ id: "c", name: "pantry", args: "{}" }] };
    await expect(chatTurn(scripted([loop, loop, loop, loop, loop]).brain, [pantry], [], "x", now)).rejects.toThrow();
    await expect(chatTurn(scripted([{ text: "  " }]).brain, [pantry], [], "x", now)).rejects.toThrow();
  });

  it("never starts the history on a tool reply", async () => {
    const { brain, seen } = scripted([{ text: "ok" }]);
    const history = Array.from({ length: 30 }, (_, i) => (i % 3 === 0
      ? { role: "assistant" as const, content: null, tool_calls: [{ id: `c${i}`, name: "pantry", args: "{}" }] }
      : { role: "tool" as const, tool_call_id: `c${i}`, content: "[]" }));
    await chatTurn(brain, [pantry], history, "x", now);
    expect(seen[0].messages[0].role).not.toBe("tool");
  });
});

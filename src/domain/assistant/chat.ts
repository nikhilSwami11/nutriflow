/** One tool the in-app chat may call: the same use cases the MCP connector serves, as the signed-in person. */
export interface ChatTool {
  name: string;
  description: string;
  /** JSON schema of the arguments. */
  parameters: Record<string, unknown>;
  /** Checks the arguments and runs the use case. Throws a readable message on bad input. */
  run: (args: unknown) => Promise<unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  /** JSON text, as the model wrote it. */
  args: string;
}

export type ChatMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/** The model. Answers in words, or asks for tools to be run first. */
export interface ChatBrain {
  next(input: {
    messages: ChatMessage[];
    tools: Pick<ChatTool, "name" | "description" | "parameters">[];
    date: string;
    hour: number;
  }): Promise<{ text?: string; calls?: ToolCall[] }>;
}

export interface ChatTurn {
  text: string;
  /** The conversation including this turn, to send next time. */
  history: ChatMessage[];
  /** Tools that ran this turn with what they returned, oldest first: the screen turns the last one into a button. */
  used: { name: string; result: unknown }[];
}

const MAX_ROUNDS = 4;
// Keeps requests small; older turns matter little for a next-step chat.
const KEEP = 20;

/**
 * One user line through the model: run the tools it asks for (at most four rounds), feed the results back, return its
 * words. A tool error goes back to the model as text so it can recover; the model failing throws, and the caller falls back.
 */
export async function chatTurn(
  brain: ChatBrain,
  tools: ChatTool[],
  history: ChatMessage[],
  said: string,
  now: { date: string; hour: number },
): Promise<ChatTurn> {
  const messages: ChatMessage[] = [...history.slice(-KEEP), { role: "user", content: said }];
  // A slice can start on a tool reply whose call was cut off; the model rejects that.
  while (messages[0]?.role === "tool") messages.shift();
  const specs = tools.map(({ name, description, parameters }) => ({ name, description, parameters }));
  const used: ChatTurn["used"] = [];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const out = await brain.next({ messages, tools: specs, ...now });
    if (!out.calls?.length) {
      const text = out.text?.trim();
      if (!text) throw new Error("empty answer");
      messages.push({ role: "assistant", content: text });
      return { text, history: messages, used };
    }
    messages.push({ role: "assistant", content: out.text ?? null, tool_calls: out.calls });
    for (const call of out.calls) {
      const tool = tools.find((t) => t.name === call.name);
      let content: string;
      try {
        if (!tool) throw new Error(`No tool ${call.name}.`);
        const result = await tool.run(call.args ? JSON.parse(call.args) : {});
        used.push({ name: call.name, result });
        content = JSON.stringify(result ?? { ok: true });
      } catch (e) {
        content = JSON.stringify({ error: e instanceof Error ? e.message : "failed" });
      }
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }
  throw new Error("too many tool rounds");
}

import { describe, expect, it } from "vitest";
import { mcp, mcpHandler } from "./mcp";

const call = (h: (r: Request) => Promise<Response>, body: unknown, headers: Record<string, string> = {}) =>
  h(new Request("http://localhost/mcp", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", "mcp-protocol-version": "2025-06-18", ...headers },
    body: JSON.stringify(body),
  }));

const json = async (r: Response) => {
  const t = await r.text();
  const line = t.split("\n").find((l) => l.startsWith("data:"));
  return JSON.parse(line ? line.slice(5) : t);
};

describe("MCP connector", () => {
  it("lists every tool with a valid input schema", async () => {
    const res = await call(mcp, { jsonrpc: "2.0", id: 1, method: "tools/list", params: {} });
    const names = (await json(res)).result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual([
      "today", "log_meal", "undo_log", "what_to_eat", "eat_next", "week_plan", "prep_today", "set_prep_done", "find_recipes", "recipe", "pantry", "add_to_pantry",
      "shopping_list", "add_to_shopping_list", "mark_bought", "chores_today", "set_chore_done", "add_chore",
    ]);
  });

  it("a tool call without a token is a tool error, not a crash", async () => {
    const res = await call(mcp, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "pantry", arguments: {} } });
    expect((await json(res)).result).toMatchObject({ isError: true, content: [{ text: "Not signed in." }] });
  });

  it("the endpoint refuses a request with no token and points at the sign-in metadata", async () => {
    const res = await call(mcpHandler, { jsonrpc: "2.0", id: 3, method: "tools/list" });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("/.well-known/oauth-protected-resource");
  });
});

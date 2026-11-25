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
      "today", "log_meal", "undo_log", "what_to_eat", "cooked", "week_shopping", "today_next", "eat_next", "week_plan", "swap_meal", "profile", "set_profile", "prep_today", "set_prep_done", "write_recipe", "keep_recipe", "find_recipes", "recipe", "pantry", "add_to_pantry",
      "shopping_list", "add_to_shopping_list", "mark_bought", "chores_today", "set_chore_done", "add_chore",
    ]);
  });

  it("week_plan and shopping_list point at cards that are served as MCP app pages", async () => {
    const tools = (await json(await call(mcp, { jsonrpc: "2.0", id: 7, method: "tools/list", params: {} }))).result.tools;
    for (const [tool, uri] of [["week_plan", "ui://nutriflow/week-plan"], ["shopping_list", "ui://nutriflow/shopping"], ["today_next", "ui://nutriflow/today"], ["week_shopping", "ui://nutriflow/week-shopping"]]) {
      expect(tools.find((t: { name: string }) => t.name === tool)._meta.ui.resourceUri).toBe(uri);
      const res = (await json(await call(mcp, { jsonrpc: "2.0", id: 8, method: "resources/read", params: { uri } }))).result;
      expect(res.contents[0].text).toContain("ui/notifications/tool-result");
      expect(res.contents[0].text).not.toContain("__NAME__");
    }
  });

  it("eat_next points at a card and the card is served as an MCP app page", async () => {
    const tools = (await json(await call(mcp, { jsonrpc: "2.0", id: 5, method: "tools/list", params: {} }))).result.tools;
    expect(tools.find((t: { name: string }) => t.name === "eat_next")._meta.ui.resourceUri).toBe("ui://nutriflow/eat-next");
    const res = (await json(await call(mcp, { jsonrpc: "2.0", id: 6, method: "resources/read", params: { uri: "ui://nutriflow/eat-next" } }))).result;
    expect(res.contents[0]).toMatchObject({ uri: "ui://nutriflow/eat-next", mimeType: "text/html;profile=mcp-app" });
    expect(res.contents[0].text).toContain("ui/notifications/tool-result");
    const script = res.contents[0].text.match(/<script>([\s\S]*)<\/script>/)[1];
    expect(() => new Function(script)).not.toThrow(); // the card's own code must at least parse
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

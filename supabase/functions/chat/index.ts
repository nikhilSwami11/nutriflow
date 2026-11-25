// Edge function. The OpenAI key lives here (secret OPENAI_API_KEY), never in the client.
// The Home chat's model: answers in words or asks for tools. The tools run in the app as the signed-in person; this
// function only talks to the model. The app falls back to its rule router if this fails.
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const MAX_MESSAGES = 40;
const MAX_TEXT = 4000;
const MAX_TOOLS = 30;

const system = (date: string, hour: number) => `You are NutriFlow, a cooking and nutrition helper inside the person's app. Today is ${date}, local hour ${hour}.
Use the tools for anything about their food, pantry, shopping, plan, prep or chores; never guess what is in their account.
Answer in one or two short sentences: the next step, not a report. The app adds a button after your answer, so do not paste links or ids.
Log only what the person says they ate, for themselves. Prefer a recipe id so calories come from the recipe; otherwise give your best kcal and say it is an estimate.
If a request is not about food, cooking, shopping or chores, say briefly what you can help with.`;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

type Call = { id: string; name: string; args: string };
type Msg =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: Call[] }
  | { role: "tool"; tool_call_id: string; content: string };
type Tool = { name: string; description: string; parameters: Record<string, unknown> };

const str = (x: unknown, max = MAX_TEXT) => typeof x === "string" && x.length <= max;
const validMsg = (m: Msg) =>
  (m.role === "user" && str(m.content)) ||
  (m.role === "tool" && str(m.tool_call_id, 100) && str(m.content, 20_000)) ||
  (m.role === "assistant" && (m.content === null || str(m.content)) &&
    (m.tool_calls === undefined || (Array.isArray(m.tool_calls) && m.tool_calls.every((c) => str(c.id, 100) && str(c.name, 64) && str(c.args)))));
const validTool = (t: Tool) => t && /^[a-z_]{1,64}$/.test(t.name) && str(t.description, 400) && typeof t.parameters === "object";

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const body = await req.json().catch(() => null);
  const { messages, tools, date, hour } = body ?? {};
  if (!Array.isArray(messages) || !messages.length || messages.length > MAX_MESSAGES || !messages.every(validMsg)) return json({ error: "messages" }, 400);
  if (!Array.isArray(tools) || tools.length > MAX_TOOLS || !tools.every(validTool)) return json({ error: "tools" }, 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || !Number.isInteger(hour) || hour < 0 || hour > 23) return json({ error: "date, hour" }, 400);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: "system", content: system(date, hour) },
        ...(messages as Msg[]).map((m) =>
          m.role === "assistant" && m.tool_calls?.length
            ? { role: "assistant", content: m.content, tool_calls: m.tool_calls.map((c) => ({ id: c.id, type: "function", function: { name: c.name, arguments: c.args } })) }
            : m),
      ],
      ...(tools.length ? { tools: (tools as Tool[]).map((t) => ({ type: "function", function: t })) } : {}),
    }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const msg = (await res.json()).choices?.[0]?.message;
  if (!msg) return json({ error: "no answer" }, 502);
  const calls: Call[] = (msg.tool_calls ?? []).map((c: { id: string; function: { name: string; arguments: string } }) => ({ id: c.id, name: c.function.name, args: c.function.arguments }));
  return json(calls.length ? { text: msg.content ?? undefined, calls } : { text: msg.content ?? "" });
});

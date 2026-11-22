// Edge function. The OpenAI key lives here (secret OPENAI_API_KEY), never in the client.
// Turns recipe amounts into what a shopper buys. The app falls back to the recipe amounts if this fails.
const UNITS = ["pcs", "g", "kg", "ml", "l", "tbsp", "tsp", "cups", "packs", "cloves", "jar", "bunch"] as const;
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const MAX_ITEMS = 40;

const SYSTEM = `You build a grocery shopping list. For each ingredient you get the amount a recipe uses. Answer with the amount a person should BUY in a US grocery store.

Rules:
- Use only these units: ${UNITS.join(", ")}.
- Whole things you count (onions, eggs, bananas, tomatoes, chillies, lemons) are "pcs".
- Liquids are "l" or "ml". Dry staples (rice, dal, flour, oats, sugar) are "g" or "kg". Fresh herbs are "bunch".
- Spices, ghee, butter, oil and sauces come in packs or jars: use "packs" or "jar" with a count, not teaspoons.
- Round up to what a normal package holds, not the exact recipe amount. Never return 0.
- Keep each name exactly as given and keep the same order and count.

Examples: "Milk, 3 cups" -> 1 l. "Basmati rice, 2 cups" -> 1 kg. "Onions, 2" -> 2 pcs. "Cumin seeds, 1 tsp" -> 1 packs. "Garlic, 3 cloves" -> 1 pcs (a head). "Ghee, 2 tbsp" -> 1 jar.`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, qty: { type: "number" }, unit: { type: "string", enum: [...UNITS] } },
        required: ["name", "qty", "unit"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

interface Item {
  name: string;
  qty?: number;
  unit?: string;
}

const valid = (x: unknown): x is Item[] =>
  Array.isArray(x) && x.length > 0 && x.length <= MAX_ITEMS && x.every((i) => i && typeof i.name === "string" && i.name.length > 0 && i.name.length <= 80);

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const body = await req.json().catch(() => null);
  if (!valid(body?.items)) return json({ error: "items: 1 to 40 entries with a name" }, 400);
  const items: Item[] = body.items;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: items.map((i) => `${i.name}, ${i.qty ?? 1} ${i.unit ?? "pcs"}`).join("\n") },
      ],
      response_format: { type: "json_schema", json_schema: { name: "buy_amounts", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const choice = (await res.json()).choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") return json({ error: "no answer" }, 502);
  const out = (JSON.parse(choice.message.content) as { items: Item[] }).items ?? [];
  // The client re-checks every entry, but never ship the wrong count.
  if (out.length !== items.length) return json({ error: "wrong count" }, 502);
  return json({ items: out });
});

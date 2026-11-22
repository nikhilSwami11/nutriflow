// Edge function. Finds the stored texts closest in meaning to a query. The OpenAI key lives here, never in the client.
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small"; // 1536 dimensions, matches the table
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query.trim() : "";
  if (!query || query.length > 200) return json({ error: "query: 1 to 200 characters" }, 400);
  if (body.kind !== "recipe") return json({ error: "kind must be recipe" }, 400);

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: MODEL, input: query }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const embedding = (await res.json()).data?.[0]?.embedding;
  if (!Array.isArray(embedding)) return json({ error: "no embedding" }, 502);

  // Search as the caller, so the table's row security applies.
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data, error } = await db.rpc("match_text", { query_embedding: embedding, match_kind: body.kind, match_count: 5 });
  if (error) return json({ error: error.message }, 502);
  return json({ matches: data });
});

// Edge function. Embeds texts and stores them. Not for the app: only a script that knows INDEX_SECRET may call it.
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") ?? "text-embedding-3-small";
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const secret = Deno.env.get("INDEX_SECRET");
  if (!secret || req.headers.get("x-index-secret") !== secret) return json({ error: "forbidden" }, 403);

  const body = await req.json().catch(() => null);
  const items: { id: string; content: string }[] = body?.items;
  const ok =
    body?.kind === "recipe" &&
    Array.isArray(items) &&
    items.length > 0 &&
    items.length <= 100 &&
    items.every((i) => typeof i?.id === "string" && i.id && typeof i.content === "string" && i.content && i.content.length <= 4000);
  if (!ok) return json({ error: "kind recipe and 1 to 100 items with id and content (4000 characters at most)" }, 400);

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({ model: MODEL, input: items.map((i) => i.content) }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const vectors: { embedding: number[]; index: number }[] = (await res.json()).data ?? [];
  if (vectors.length !== items.length) return json({ error: "wrong count" }, 502);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const rows = items.map((it, n) => ({
    kind: body.kind,
    id: it.id,
    content: it.content,
    embedding: JSON.stringify(vectors.find((v) => v.index === n)!.embedding),
    updated_at: new Date().toISOString(),
  }));
  const { error } = await db.from("text_vectors").upsert(rows);
  if (error) return json({ error: error.message }, 502);
  return json({ indexed: rows.length });
});

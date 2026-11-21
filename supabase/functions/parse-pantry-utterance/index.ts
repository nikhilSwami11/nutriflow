// Edge function stub. AI keys live here, never in the client.
// shortcut: deterministic regex parser, replace with a model call once approved.
const WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

function parse(text: string) {
  const body = text.replace(/^\s*i\s+(have|got|bought)\s+/i, "");
  return body
    .split(/,|\band\b/i)
    .map((s) => s.trim().replace(/[.!?]$/, ""))
    .filter(Boolean)
    .map((part) => {
      const m = part.match(/^(\d+|[a-z]+)\s+(.+)$/i);
      const n = m ? (/^\d+$/.test(m[1]) ? Number(m[1]) : WORDS[m[1].toLowerCase()]) : undefined;
      return n && m ? { name: m[2], qty: n } : { name: part, qty: 1 };
    });
}

Deno.serve(async (req) => {
  const { text } = await req.json();
  if (typeof text !== "string" || !text.trim()) {
    return new Response(JSON.stringify({ error: "text required" }), { status: 400 });
  }
  return new Response(JSON.stringify({ items: parse(text) }), { headers: { "Content-Type": "application/json" } });
});

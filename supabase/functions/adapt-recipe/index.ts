// Edge function. The OpenAI key lives here (secret OPENAI_API_KEY), never in the client.
// Rewrites one recipe by the person's instruction ("no onion", "for 4", "spicier", "more protein"). The app checks the
// answer (numbers, diet, dislikes) and keeps it as an unsaved version the person can keep or drop.
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const VERBS = ["Chop", "Slice", "Grate", "Mix", "Whisk", "Stir", "Toss", "Mash", "Knead", "Roll", "Boil", "Simmer", "Fry", "Sauté", "Sear", "Roast", "Bake", "Toast", "Blend", "Chill", "Assemble", "Top", "Serve"];
const DIETS = ["anything", "vegetarian", "eggetarian", "vegan"];

const SYSTEM = `You change one existing recipe the way the person asks, and return the whole changed recipe.

Rules:
- Change only what the instruction needs, and everything that follows from it: if an ingredient goes, remove it from the steps; if servings change, scale every amount and the timings that depend on it; if it must be spicier or higher in protein, change ingredients and steps for it.
- Keep it a real cook's recipe: salt and a cooking fat with amounts, aromatics, spices in the right order, a last step that tastes and balances. Keep the name unless the change makes it wrong (then rename it plainly).
- Respect the diet strictly (vegetarian: no meat, fish or egg; eggetarian: no meat or fish; vegan: no animal products) and never use anything from the dislikes.
- Nutrition is per serving and must be a fair estimate after the change. Ingredient amounts are for the whole recipe.
- Each step's verb must be one of: ${VERBS.join(", ")}. Keep minutes, group, look and tip on steps that keep them; use null when there is none.
- If the instruction is not about changing this recipe, return it unchanged.`;

const str = { type: ["string", "null"] };
const SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" }, blurb: { type: "string" }, minutes: { type: "number" }, servings: { type: "number" },
    kcal: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" },
    ingredients: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" }, unit: { type: "string" }, group: str }, required: ["name", "qty", "unit", "group"], additionalProperties: false },
    },
    steps: {
      type: "array",
      items: {
        type: "object",
        properties: { text: { type: "string" }, verb: { type: "string", enum: VERBS }, minutes: { type: ["number", "null"] }, look: str, tip: str, group: str },
        required: ["text", "verb", "minutes", "look", "tip", "group"],
        additionalProperties: false,
      },
    },
  },
  required: ["name", "blurb", "minutes", "servings", "kcal", "protein", "carbs", "fat", "ingredients", "steps"],
  additionalProperties: false,
} as const;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const words = (x: unknown, max: number) => Array.isArray(x) && x.length <= max && x.every((w) => typeof w === "string" && w.length > 0 && w.length <= 60);

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const b = await req.json().catch(() => null);
  const r = b?.recipe;
  const ok =
    b && typeof b.instruction === "string" && b.instruction.trim().length > 0 && b.instruction.length <= 200 &&
    (b.diet === undefined || DIETS.includes(b.diet)) && words(b.dislikes, 30) &&
    r && typeof r.name === "string" && Array.isArray(r.ingredients) && r.ingredients.length <= 60 && Array.isArray(r.steps) && r.steps.length <= 40 &&
    JSON.stringify(r).length < 20000;
  if (!ok) return json({ error: "bad input" }, 400);

  const ask = [
    `Instruction: ${b.instruction.trim()}`,
    `Diet: ${b.diet ?? "anything"}`,
    `Dislikes: ${b.dislikes.join(", ") || "none"}`,
    `Recipe:\n${JSON.stringify({ ...r, swaps: undefined, fixes: undefined, prep: undefined })}`,
  ].join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: ask }],
      response_format: { type: "json_schema", json_schema: { name: "recipe", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const choice = (await res.json()).choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") return json({ error: "no answer" }, 502);
  const out = JSON.parse(choice.message.content);
  // Nulls are dropped; the app re-checks everything else.
  for (const i of out.ingredients ?? []) if (i.group === null) delete i.group;
  for (const s of out.steps ?? []) for (const k of ["minutes", "look", "tip", "group"]) if (s[k] === null) delete s[k];
  return json({ recipe: out });
});

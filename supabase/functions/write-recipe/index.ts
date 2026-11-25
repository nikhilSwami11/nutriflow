// Edge function. The OpenAI key lives here (secret OPENAI_API_KEY), never in the client.
// Writes one meal for this person ("What should I eat?") plus two one-line ideas. The app checks the answer and falls back
// to its built-in recipes if this is slow, down or wrong.
const MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const VERBS = ["Chop", "Slice", "Grate", "Mix", "Whisk", "Stir", "Toss", "Mash", "Knead", "Roll", "Boil", "Simmer", "Fry", "Sauté", "Sear", "Roast", "Bake", "Toast", "Blend", "Chill", "Assemble", "Top", "Serve"];
const MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"];
const DIETS = ["anything", "vegetarian", "eggetarian", "vegan"];
const WANTS = ["quick", "light", "protein", "pantry"];

const SYSTEM = `You are a home cook who writes one realistic meal for one person, right now.

Rules:
- Respect the diet strictly. vegetarian: no meat, fish or egg. eggetarian: no meat or fish. vegan: no animal products at all.
- Never use anything from the dislikes.
- Prefer what the pantry already has. Keep extra shopping to a few common items.
- Aim for about the calorie target per serving. Nutrition is per serving and must be a fair estimate.
- Wishes: quick = 20 minutes or less; light = about 400 kcal or less; protein = 25 g protein or more; pantry = only pantry items plus salt, oil, water and spices.
- 2 servings unless the dish only makes sense as one. 3 to 7 short steps, each starting with one action.
- Each step's verb must be one of: ${VERBS.join(", ")}. Give minutes only for steps that wait (boiling, simmering, baking).
- Ingredient names are plain grocery names ("Onion", "Paneer", "Basmati rice"), amounts for the whole recipe, units like g, ml, pcs, cups, tbsp, tsp, cloves.
- Write like a real cook: include salt and a cooking fat (oil, ghee or butter) with amounts, aromatics (onion, garlic, ginger) and spices with amounts. Say the order: whole spices into hot oil first, then aromatics, then ground spices, then tomatoes or liquid. Make the last step taste and balance (adjust salt, sourness, heat, sweetness).
- If an idea is given, write that dish.
- Also give two different one-line ideas that would also fit.`;

const SCHEMA = {
  type: "object",
  properties: {
    recipe: {
      type: "object",
      properties: {
        name: { type: "string" },
        blurb: { type: "string" },
        minutes: { type: "number" },
        servings: { type: "number" },
        kcal: { type: "number" },
        protein: { type: "number" },
        carbs: { type: "number" },
        fat: { type: "number" },
        ingredients: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, qty: { type: "number" }, unit: { type: "string" } }, required: ["name", "qty", "unit"], additionalProperties: false },
        },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: { text: { type: "string" }, verb: { type: "string", enum: VERBS }, minutes: { type: ["number", "null"] } },
            required: ["text", "verb", "minutes"],
            additionalProperties: false,
          },
        },
      },
      required: ["name", "blurb", "minutes", "servings", "kcal", "protein", "carbs", "fat", "ingredients", "steps"],
      additionalProperties: false,
    },
    ideas: {
      type: "array",
      items: { type: "object", properties: { name: { type: "string" }, blurb: { type: "string" } }, required: ["name", "blurb"], additionalProperties: false },
    },
  },
  required: ["recipe", "ideas"],
  additionalProperties: false,
} as const;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const words = (x: unknown, max: number) => Array.isArray(x) && x.length <= max && x.every((w) => typeof w === "string" && w.length > 0 && w.length <= 60);

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const b = await req.json().catch(() => null);
  const ok =
    b && MEALS.includes(b.meal) && typeof b.kcalTarget === "number" && b.kcalTarget > 0 && b.kcalTarget < 3000 &&
    (b.diet === undefined || DIETS.includes(b.diet)) && words(b.dislikes, 30) && words(b.pantry, 120) &&
    Array.isArray(b.wants) && b.wants.every((w: unknown) => WANTS.includes(w as string)) &&
    (b.idea === undefined || (typeof b.idea === "string" && b.idea.length <= 120));
  if (!ok) return json({ error: "bad input" }, 400);

  const ask = [
    `Meal: ${b.meal}`,
    `Calorie target per serving: ${Math.round(b.kcalTarget)}`,
    `Diet: ${b.diet ?? "anything"}`,
    `Dislikes: ${b.dislikes.join(", ") || "none"}`,
    `Pantry: ${b.pantry.join(", ") || "nothing listed"}`,
    `Wishes: ${b.wants.join(", ") || "none"}`,
    b.idea ? `Idea to write: ${b.idea}` : "",
  ].filter(Boolean).join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.7,
      messages: [{ role: "system", content: SYSTEM }, { role: "user", content: ask }],
      response_format: { type: "json_schema", json_schema: { name: "meal", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const choice = (await res.json()).choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") return json({ error: "no answer" }, 502);
  const out = JSON.parse(choice.message.content);
  // null minutes are dropped; the app re-checks everything else.
  for (const s of out.recipe?.steps ?? []) if (s.minutes === null) delete s.minutes;
  return json(out);
});

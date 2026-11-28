// Edge function. The OpenAI key lives here (secret OPENAI_API_KEY), never in the client.
// Reads one photo. mode "meal": what is on the plate with calories per unit. mode "pantry" or "receipt": what food is there.
// The app falls back to its example (meal) or says nothing was found (pantry) if this fails.
const MODEL = Deno.env.get("OPENAI_VISION_MODEL") ?? Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const MAX_IMAGE_CHARS = 2_500_000; // about 1.8 MB of JPEG as a data URL: the app resizes before sending

const MEAL_UNITS = ["pcs", "cup", "cups", "tbsp", "tsp", "g", "ml", "slice", "bowl"] as const;
const PANTRY_UNITS = ["pcs", "cloves", "packs", "jar", "cups"] as const;
const GROUPS = ["Produce", "Dairy", "Dry goods"] as const;

const MEAL_SYSTEM = `You look at a photo of a meal and estimate its calories for a food diary.
- List each separate food you can see (max 8). Use plain names ("Dal tadka", "Rice", "Roti").
- amount is how much is on the plate in the given unit; step is how much one tap should change it (0.25 for cups, 1 for pieces, 0.5 for tbsp).
- kcal_per, protein, carbs, fat are per ONE unit, typical home cooking.
- confidence is 0 to 100. Oil, ghee, butter and sauces are hard to see: include them only when likely, with confidence under 65.
- reason: one short plain sentence on why you think it is there.
- dish: the whole dish in a few words. If it is not food, return an empty items list.`;

const PANTRY_SYSTEM = `You read a photo of a shelf, a fridge, or a grocery receipt and list the FOOD in it so it can go in a home pantry.
- Only food and drink ingredients. Skip bags, bills, store names, prices, totals, cleaning and non-food items.
- qty is how many you can see or read (count the packs; receipts list quantities). At least 1.
- unit: pcs for things you count, packs for boxes, bags and packets, jar for jars and bottles, cups for loose measured grains, cloves for garlic.
- group: Produce (fruit, vegetables, herbs), Dairy (milk, curd, paneer, cheese, butter, eggs), Dry goods (everything else).
- Names are short and generic ("Tomatoes", "Basmati rice"), never brands. Max 40 items. If nothing is food, return an empty list.`;

const MEAL_SCHEMA = {
  type: "object",
  properties: {
    dish: { type: "string" },
    confidence: { type: "number" },
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" }, amount: { type: "number" }, step: { type: "number" }, unit: { type: "string", enum: [...MEAL_UNITS] },
          kcal_per: { type: "number" }, protein: { type: "number" }, carbs: { type: "number" }, fat: { type: "number" },
          confidence: { type: "number" }, reason: { type: "string" },
        },
        required: ["name", "amount", "step", "unit", "kcal_per", "protein", "carbs", "fat", "confidence", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["dish", "confidence", "items"],
  additionalProperties: false,
} as const;

const PANTRY_SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { name: { type: "string" }, qty: { type: "number" }, unit: { type: "string", enum: [...PANTRY_UNITS] }, group: { type: "string", enum: [...GROUPS] } },
        required: ["name", "qty", "unit", "group"],
        additionalProperties: false,
      },
    },
  },
  required: ["items"],
  additionalProperties: false,
} as const;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  // Supabase checks the caller's JWT before this runs (verify_jwt is on by default).
  const body = await req.json().catch(() => null);
  const mode = body?.mode;
  const image = body?.image;
  if (mode !== "meal" && mode !== "pantry" && mode !== "receipt") return json({ error: "mode: meal, pantry or receipt" }, 400);
  if (typeof image !== "string" || !image.startsWith("data:image/") || image.length > MAX_IMAGE_CHARS) return json({ error: "image: a data URL under 2.5 MB" }, 400);

  const meal = mode === "meal";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: meal ? MEAL_SYSTEM : PANTRY_SYSTEM },
        { role: "user", content: [{ type: "text", text: meal ? "Estimate this meal." : mode === "receipt" ? "List the food on this receipt." : "List the food you can see." }, { type: "image_url", image_url: { url: image, detail: "low" } }] },
      ],
      response_format: { type: "json_schema", json_schema: { name: meal ? "meal" : "pantry", strict: true, schema: meal ? MEAL_SCHEMA : PANTRY_SCHEMA } },
    }),
  });
  if (!res.ok) return json({ error: `openai ${res.status}` }, 502);
  const choice = (await res.json()).choices?.[0];
  if (choice?.finish_reason !== "stop" || typeof choice.message?.content !== "string") return json({ error: "no answer" }, 502);
  return json(JSON.parse(choice.message.content));
});

// Puts every recipe into the vector table so /eat can search by meaning.
// Run: INDEX_SECRET=... npx tsx scripts/index-recipes.ts   (reads the Supabase URL and key from .env.local)
import { readFileSync } from "node:fs";
import { DemoRecipeRepository } from "../src/data/recipes/demo";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const secret = process.env.INDEX_SECRET ?? "";
if (!url || !anon || !secret) throw new Error("Need NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local, and INDEX_SECRET in the environment");

async function main() {
  const recipes = await new DemoRecipeRepository().list();
  // What someone might say they feel like: the name, the blurb, the meal, how long, what is in it.
  const items = recipes.map((r) => ({
    id: r.id,
    content: `${r.name}. ${r.blurb} ${r.meal}, ${r.minutes} minutes, ${r.kcal} kcal, ${r.protein} g protein. Ingredients: ${r.ingredients.map((i) => i.name).join(", ")}.`,
  }));

  const res = await fetch(`${url}/functions/v1/text-index`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${anon}`, apikey: anon, "x-index-secret": secret },
    body: JSON.stringify({ kind: "recipe", items }),
  });
  console.log(res.status, await res.text());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

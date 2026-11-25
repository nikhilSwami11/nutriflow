// Counts how many prompts in docs/remaining-images.md already have a picture (a prepared webp, or a raw jpeg waiting in art-src).
import { readFileSync, existsSync } from "node:fs";

const doc = readFileSync("docs/remaining-images.md", "utf8");
let section = "";
const rows = [];
for (const line of doc.split("\n")) {
  const s = line.match(/^## ([A-D])\./);
  if (s) section = s[1];
  const h = line.match(/^### \d+\. ([a-z0-9-]+)/);
  if (h) rows.push({ section, slug: h[1] });
}

const have = ({ section, slug }) => {
  const [pub, src] = section === "D" ? ["public/ingredients", "art-src/ingredients"] : ["public/recipes", "art-src/recipes"];
  return existsSync(`${pub}/${slug}.webp`) || existsSync(`${src}/${slug}.jpeg`);
};

const groups = {};
for (const r of rows) {
  const g = (groups[r.section] ??= { done: 0, todo: [] });
  if (have(r)) g.done++;
  else g.todo.push(r.slug);
}
let done = 0;
for (const [k, g] of Object.entries(groups)) {
  const n = g.done + g.todo.length;
  done += g.done;
  console.log(`${k}: ${g.done}/${n} done, ${g.todo.length} left${process.argv.includes("--list") && g.todo.length ? `: ${g.todo.join(" ")}` : ""}`);
}
console.log(`Total: ${done}/${rows.length} done, ${rows.length - done} left`);

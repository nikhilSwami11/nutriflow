// Names Gemini downloads by prompt order: the Nth image downloaded gets the Nth slug in docs/next-prompts.md
// that has no art yet. Gemini cannot name files, so download each image right after it is made, in prompt order.
// Run: node scripts/name-recipe-images.mjs [folder]   (default ~/Downloads; add --dry to only print the plan)
import { existsSync, readdirSync, readFileSync, renameSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { extname, join } from "node:path";

const dry = process.argv.includes("--dry");
const dir = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? join(homedir(), "Downloads");
const DEST = "art-src/recipes";

const hasArt = (slug) => ["jpeg", "jpg", "png"].some((e) => existsSync(`${DEST}/${slug}.${e}`));
const slugs = [...readFileSync(existsSync("docs/remaining-images.md") ? "docs/remaining-images.md" : "docs/next-prompts.md", "utf8").matchAll(/^### [^ ]+ ([a-z0-9-]+)\.jpeg$/gm)].map((m) => m[1]).filter((s) => !hasArt(s));
// Only images downloaded after the newest art already in art-src/recipes, so old downloads are never renamed.
const since = Math.max(0, ...readdirSync(DEST).map((f) => statSync(join(DEST, f)).mtimeMs));
const files = readdirSync(dir)
  .filter((f) => /^Gemini_Generated_Image_.*\.(jpe?g|png)$/i.test(f))
  .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
  .filter((x) => x.t > since)
  .sort((a, b) => a.t - b.t)
  .map((x) => x.f);

if (!files.length) console.log(`No new Gemini_Generated_Image_* files in ${dir} (only ones downloaded after the last batch count)`);
if (files.length > slugs.length) console.log(`Warning: ${files.length} images but only ${slugs.length} slugs left; extras stay put.`);
if (files.length && files.length < slugs.length) console.log(`${files.length} images for ${slugs.length} slugs: the first ${files.length} slugs get them.`);

files.slice(0, slugs.length).forEach((f, i) => {
  const to = `${DEST}/${slugs[i]}${extname(f).toLowerCase().replace(".jpg", ".jpeg")}`;
  console.log(`${f}  ->  ${to}`);
  if (!dry) renameSync(join(dir, f), to);
});

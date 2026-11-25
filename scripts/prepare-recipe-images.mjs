// Turns art-src/recipes/<slug>.jpeg|png (plain white or green-screen background) into public/recipes/<slug>.webp:
// white background cut out (flood fill from the edges, stops at the dish's outline), cropped, 512px, compressed.
// Run: node scripts/prepare-recipe-images.mjs [ingredients]   (add --force to redo existing files)
import sharp from "sharp";
import { mkdirSync, readdirSync, existsSync } from "node:fs";

// Pass "ingredients" to prepare pantry pictures instead: art-src/ingredients -> public/ingredients.
const KIND = process.argv.find((a) => a === "ingredients") ?? "recipes";
const SRC = `art-src/${KIND}`, OUT = `public/${KIND}`, SIZE = KIND === "ingredients" ? 256 : 512, PAD = 24, TOL = 28;
mkdirSync(OUT, { recursive: true });
const force = process.argv.includes("--force");

for (const f of readdirSync(SRC).filter((x) => /\.(jpe?g|png)$/i.test(x))) {
  const slug = f.replace(/\.[^.]+$/, "");
  if (!force && existsSync(`${OUT}/${slug}.webp`)) continue;
  const { data, info } = await sharp(`${SRC}/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const px = (i) => i * 4;
  // background colour = the average of the four corners
  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map(px);
  const bg = [0, 1, 2].map((c) => corners.reduce((s, i) => s + data[i + c], 0) / 4);
  const near = (i) => Math.max(...[0, 1, 2].map((c) => Math.abs(data[px(i) + c] - bg[c]))) <= TOL;
  // Green screen: the background is a gradient, so take any clearly green pixel reachable from the edge (the dish outline stops the fill).
  const greenBg = bg[1] > bg[0] + 40 && bg[1] > bg[2] + 40;
  const green = (i) => { const [r, g, b] = [0, 1, 2].map((c) => data[px(i) + c]); return g > r + 20 && g > b + 20; };
  const isBg = greenBg ? (i) => near(i) || green(i) : near;
  const seen = new Uint8Array(w * h), stack = [];
  const push = (i) => { if (!seen[i] && isBg(i)) { seen[i] = 1; stack.push(i); } };
  for (let x = 0; x < w; x++) { push(x); push((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { push(y * w); push(y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop(), x = i % w;
    if (x > 0) push(i - 1);
    if (x < w - 1) push(i + 1);
    if (i >= w) push(i - w);
    if (i < w * (h - 1)) push(i + w);
  }
  // Green screen leaves a green fringe around the outline: peel 2 rings of green-tinted edge pixels.
  for (let pass = 0; greenBg && pass < 2; pass++) {
    const edge = [];
    for (let i = 0; i < w * h; i++) {
      if (seen[i]) continue;
      const x = i % w, r = data[px(i)], g = data[px(i) + 1], b = data[px(i) + 2];
      const byBg = (x > 0 && seen[i - 1]) || (x < w - 1 && seen[i + 1]) || (i >= w && seen[i - w]) || (i < w * (h - 1) && seen[i + w]);
      if (byBg && g > r + 8 && g > b + 8) edge.push(i);
    }
    for (const i of edge) seen[i] = 1;
  }
  for (let i = 0; i < w * h; i++) if (seen[i]) data[px(i) + 3] = 0;
  const png = await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer();
  const re = await sharp(trimmed)
    .resize(SIZE - PAD * 2, SIZE - PAD * 2, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: PAD, bottom: PAD, left: PAD, right: PAD, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 82, alphaQuality: 90 }).toFile(`${OUT}/${slug}.webp`);
  console.log(slug, `${(re.size / 1024).toFixed(0)} KB`);
}

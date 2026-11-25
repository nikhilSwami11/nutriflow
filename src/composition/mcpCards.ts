// MCP Apps cards: small self-contained pages the chat shows beside a tool's answer (SEP-1865: `ui://` resource,
// mime `text/html;profile=mcp-app`, tool `_meta.ui.resourceUri`). The page talks to the chat over postMessage JSON-RPC:
// it says hello (`ui/initialize`), then receives the tool's result (`ui/notifications/tool-result`) and draws it.
// A client that does not show cards still gets the tool's plain JSON text.

export const CARD_MIME = "text/html;profile=mcp-app";
export const EAT_NEXT_URI = "ui://nutriflow/eat-next";
export const WEEK_PLAN_URI = "ui://nutriflow/week-plan";
export const SHOPPING_URI = "ui://nutriflow/shopping";
export const TODAY_URI = "ui://nutriflow/today";
export const WEEK_SHOP_URI = "ui://nutriflow/week-shopping";
export const MEALS_URI = "ui://nutriflow/meal-stories";
export const PROFILE_URI = "ui://nutriflow/profile";

/** Lets a card load the app's own pictures (MCP Apps CSP); the host blocks every other origin. */
export const cardMeta = () => (appOrigin() ? { ui: { csp: { resourceDomains: [appOrigin()] } } } : undefined);

/** The public address of the app, for the card's "Start cooking" link. Without it the card shows no links. */
const appOrigin = () => (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");

const STYLE = `
:root{--bg:#fff;--ink:#111;--ink2:#555;--panel:#f7f7f7;--line:#e2e2e2;--mint:#8fd3c0;--onp:#1b2b27;--peach:#f7c9bb;--lav:#cfc8f0}
@media(prefers-color-scheme:dark){:root{--bg:#161616;--ink:#f2f2f2;--ink2:#b5b5b5;--panel:#222;--line:#333}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.4 "IBM Plex Sans",system-ui,sans-serif}
.card{padding:16px;display:flex;flex-direction:column;gap:12px}
.tile{background:var(--lav);color:var(--onp);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:4px}
.k{font-size:12px;opacity:.8}.n{font-size:22px;font-weight:500;letter-spacing:-.01em}.m{font-size:14px}
.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.btn{min-height:44px;padding:0 20px;border-radius:999px;border:0;background:var(--ink);color:var(--bg);font:500 15px inherit;font-family:inherit;cursor:pointer}
.pill{border-radius:999px;background:var(--panel);padding:8px 14px;font-size:14px;color:var(--ink2)}
.btn.sm{min-height:44px;padding:0 14px;font-size:14px}.pill{border:0;font-family:inherit;cursor:pointer;min-height:44px}.step{gap:4px}.line .step{flex:0 0 auto}.step span{min-width:24px;text-align:center}button:disabled{opacity:.5}
.day{display:flex;flex-direction:column;gap:6px}.bar{height:6px;border-radius:999px;background:var(--panel);overflow:hidden}.bar i{display:block;height:100%;background:var(--mint)}
.pic{width:120px;height:120px;object-fit:contain;align-self:center;margin:-4px 0 4px}
.pick{display:flex;justify-content:space-between;align-items:center;width:100%;background:none;border:0;border-top:1px solid var(--line);font:inherit;color:inherit;text-align:left;cursor:pointer;min-height:44px}.pick.off span:first-child{text-decoration:line-through;color:var(--ink2)}
.stories{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;margin:0 -16px;padding:0 16px}.stories::-webkit-scrollbar{display:none}
.story{flex:0 0 86%;scroll-snap-align:center;background:var(--lav);color:var(--onp);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:6px}
.pic.big{width:160px;height:160px}.pic.blank{border-radius:50%;background:var(--bg);opacity:.5;align-self:center}
.dots{display:flex;gap:6px;justify-content:center}.dots i{width:6px;height:6px;border-radius:50%;background:var(--line)}.dots i.on{background:var(--ink)}
.chip{border:0;background:var(--bg);color:var(--onp);border-radius:999px;padding:4px 10px;margin:2px 0;font:inherit;font-size:14px;cursor:pointer;min-height:32px}
.ok{background:var(--mint);color:var(--onp)}.warn{background:var(--peach);color:var(--onp)}
p{margin:0}
.line{display:flex;gap:12px;justify-content:space-between;align-items:baseline;padding:10px 0;border-top:1px solid var(--line)}.line b{min-width:36px}.line span:nth-child(2){flex:1}
`;

const HEAD = `
const ORIGIN = ${JSON.stringify("__ORIGIN__")};
let seq = 0; const waiting = {};
const send = (m) => parent.postMessage({ jsonrpc: "2.0", ...m }, "*");
const ask = (method, params) => new Promise((res) => { const id = ++seq; waiting[id] = res; send({ id, method, params }); });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const root = document.getElementById("root");
const day = () => { const t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); };
const call = (name, args) => ask("tools/call", { name, arguments: args });
// What is missing for a meal, with the action right there: add all to shopping, say you have them all, or tap one you have.
// The app's own dish picture on the meal's tint; nothing when the dish has none (never a photo from elsewhere).
const pic = (image) => (image && ORIGIN ? '<img class="pic" alt="" onerror="this.hidden=true" src="' + esc(ORIGIN + image) + '">' : "");
function missing(names) {
  if (!names || !names.length) return "";
  const n = names.length;
  return '<p class="m">You are missing ' + names.map((x) => '<button class="chip" data-has="' + esc(x) + '" title="I have this">' + esc(x) + "</button>").join(" ") + '</p>'
    + '<div class="row"><button class="btn" data-shop-all="1">Add ' + n + " to shopping</button>" + '<button class="pill" data-have-all="1">' + (n > 1 ? "I have them" : "I have it") + "</button></div>";
}
function wireMissing(names, act) {
  root.querySelectorAll("[data-has]").forEach((b) => (b.onclick = () => act("add_to_pantry", { items: [{ name: b.dataset.has, qty: 1 }] })));
  root.querySelectorAll("[data-shop-all]").forEach((b) => (b.onclick = () => act("add_to_shopping_list", { items: names.map((name) => ({ name })) })));
  root.querySelectorAll("[data-have-all]").forEach((b) => (b.onclick = () => act("add_to_pantry", { items: names.map((name) => ({ name, qty: 1 })) })));
}
`;

const PARSE = `
// Hosts wrap the tool result differently: look for it at the top, under result / toolResult, or as the text itself.
function unwrap(x) {
  for (let i = 0; x && i < 3; i++) {
    if (x.structuredContent || Array.isArray(x.content)) return x;
    x = x.result || x.toolResult || x.params || null;
  }
  return x || {};
}
function draw(raw) {
  const result = unwrap(raw);
  let d = result.structuredContent || null;
  if (!d) try { const t = (result.content || []).find((c) => c.type === "text").text; d = JSON.parse(t.slice(t.search(/[\\[{]/))); } catch (e) {}
  if (d && d.items && Array.isArray(d.items) && !d.day && !("toAdd" in d)) d = d.items;
  if (!d) { root.innerHTML = '<div class="card"><p>Nothing to show yet.</p><p class="k" style="color:var(--ink2)">Got: ' + esc(JSON.stringify(raw).slice(0, 160)) + "</p></div>"; return fit(); }
  render(d);
  fit();
}
`;
const EAT_NEXT_RENDER = `
let busy = false;
async function act(name, args) {
  if (busy) return; busy = true;
  root.querySelectorAll("button").forEach((b) => (b.disabled = true));
  await call(name, args).catch(() => null);
  const fresh = await call("eat_next", { date: day(), hour: new Date().getHours() }).catch(() => null);
  busy = false;
  if (fresh) draw(fresh);
}
function render(d) {
  if (!d.next) { root.innerHTML = '<div class="card"><div class="tile"><span class="n">All meals eaten for today</span></div></div>'; return; }
  const n = d.next;
  const gaps = (d.toBuy || []).concat(d.unknown || []);
  const then = (d.thenToday || []).map((t) => '<span class="pill">' + esc(t.meal) + " · " + esc(t.name) + "</span>").join("");
  root.innerHTML = '<div class="card"><div class="tile">' + pic(n.image) + '<span class="k">' + (n.tomorrow ? "Tomorrow · " : "") + esc(n.meal) + '</span><span class="n">' + esc(n.name) + '</span><span class="m">' + n.minutes + " min · " + n.kcalPerServing + ' kcal per serving</span></div>'
    + (gaps.length ? missing(gaps) + (ORIGIN ? '<div class="row"><button class="pill" id="go">Cook anyway</button></div>' : "")
      : '<p><span class="pill ok">Ready to cook</span></p>' + (ORIGIN ? '<div class="row"><button class="btn" id="go">Start cooking</button></div>' : ""))
    + (then ? '<div class="row"><span class="m" style="color:var(--ink2)">Then</span>' + then + "</div>" : "") + "</div>";
  wireMissing(gaps, act);
  const go = document.getElementById("go");
  if (go) go.onclick = () => ask("ui/open-link", { url: ORIGIN + "/cook/" + n.recipeId });
}
`;
const WEEK_RENDER = `
function render(d) {
  const day = (x) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date(x + "T12:00:00").getDay()];
  const rows = d.map((x) => {
    const kcal = x.meals.reduce((s, m) => s + m.kcal, 0);
    return '<div class="line"><b>' + day(x.date) + '</b><span>' + x.meals.map((m) => esc(m.name)).join(" · ") + '</span><span class="m" style="color:var(--ink2)">' + kcal + ' kcal</span></div>';
  }).join("");
  root.innerHTML = '<div class="card"><p class="n">Your week</p>' + rows + (ORIGIN ? '<div class="row"><button class="btn" id="go">Open plan</button></div>' : "") + "</div>";
  const go = document.getElementById("go");
  if (go) go.onclick = () => ask("ui/open-link", { url: ORIGIN + "/plan" });
}
`;
const SHOPPING_RENDER = `
function render(d) {
  const rows = d.map((x) => '<div class="line"><span>' + esc(x.name) + '</span><span class="m" style="color:var(--ink2)">' + x.qty + " " + esc(x.unit) + "</span></div>").join("");
  root.innerHTML = '<div class="card"><p class="n">' + (d.length ? "Shopping list" : "Nothing to buy") + "</p>" + rows + (ORIGIN ? '<div class="row"><button class="btn" id="go">Open shopping</button></div>' : "") + "</div>";
  const go = document.getElementById("go");
  if (go) go.onclick = () => ask("ui/open-link", { url: ORIGIN + "/shopping" });
}
`;
// The today card asks and saves in place: each button calls a tool through the chat, then the card reloads itself.
const TODAY_RENDER = `
let busy = false;
async function act(name, args) {
  if (busy) return; busy = true;
  root.querySelectorAll("button").forEach((b) => (b.disabled = true));
  await call(name, args).catch(() => null);
  const fresh = await call("today_next", { date: day(), hour: new Date().getHours() }).catch(() => null);
  busy = false;
  if (fresh) draw(fresh);
}
const DIETS = [["anything", "Anything"], ["vegetarian", "Vegetarian"], ["eggetarian", "Eggetarian"], ["vegan", "Vegan"]];
const tick = (label, id) => '<div class="line"><span>' + label + '</span><button class="pill" data-tick="' + esc(id) + '">Done</button></div>';
function dayLine(x) {
  if (!x) return "";
  const pct = Math.min(100, Math.round((x.kcalEaten / x.range.max) * 100));
  const words = x.logged ? x.kcalEaten + " of " + x.range.min + "–" + x.range.max + " kcal" : "Nothing logged today";
  const macros = x.macros ? '<span class="m" style="color:var(--ink2)">' + x.macros.protein + " g protein · " + x.macros.carbs + " g carbs · " + x.macros.fat + " g fat</span>" : "";
  return '<div class="day"><span>' + words + "</span>" + macros + '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';
}
function render(d) {
  const items = d.items || [];
  if (!items.length) { root.innerHTML = '<div class="card">' + dayLine(d.day) + '<div class="tile"><span class="n">All done for now</span></div></div>'; return; }
  const parts = items.map((it, i) => {
    if (it.kind === "profile") return '<div class="tile"><span class="k">First, how do you eat?</span><div class="row">' + DIETS.map(([v, l]) => '<button class="pill" data-diet="' + v + '">' + l + "</button>").join("") + "</div></div>";
    if (it.kind === "meal") {
      return '<div class="tile">' + pic(it.image) + '<span class="k">' + (it.tomorrow ? "Tomorrow · " : "") + esc(it.meal) + '</span><span class="n">' + esc(it.name) + '</span><span class="m">' + it.minutes + " min · " + it.kcalPerServing + " kcal</span>"
        + (it.ask.length ? missing(it.ask)
          : '<div class="row">' + (ORIGIN ? '<button class="btn" id="cook">Start cooking</button>' : "")
            + '<span class="row step"><button class="pill" id="less" aria-label="Fewer servings">−</button><span id="sv">1</span><button class="pill" id="more" aria-label="More servings">+</button></span><button class="pill" id="ate">Mark eaten</button></div>')
        + "</div>";
    }
    if (it.kind === "prep") return tick(esc(it.action) + ' <span class="m" style="color:var(--ink2)">' + esc(it.dish) + (it.due === "tonight" ? " · tonight" : "") + "</span>", "p:" + it.id);
    if (it.kind === "chore") return tick(esc(it.title), "c:" + it.id);
    if (it.kind === "shopping") return '<div class="line"><span>' + it.count + " to buy" + ' <span class="m" style="color:var(--ink2)">' + it.names.map(esc).join(", ") + "</span></span>" + (ORIGIN ? '<button class="pill" id="shop">Open</button>' : "") + "</div>";
    return "";
  });
  root.innerHTML = '<div class="card">' + dayLine(d.day) + parts.join("") + "</div>";
  const meal = items.find((it) => it.kind === "meal");
  let sv = 1;
  const $ = (id) => document.getElementById(id);
  root.querySelectorAll("[data-diet]").forEach((b) => (b.onclick = () => act("set_profile", { diet: b.dataset.diet })));
  if (meal) wireMissing(meal.ask, act);
  root.querySelectorAll("[data-tick]").forEach((b) => (b.onclick = () => {
    const [k, id] = [b.dataset.tick.slice(0, 1), b.dataset.tick.slice(2)];
    act(k === "p" ? "set_prep_done" : "set_chore_done", k === "p" ? { id, done: true } : { id, done: true, date: day() });
  }));
  if ($("less")) { $("less").onclick = () => ($("sv").textContent = String((sv = Math.max(0.5, sv - 0.5)))); $("more").onclick = () => ($("sv").textContent = String((sv = Math.min(6, sv + 0.5)))); }
  if ($("ate")) $("ate").onclick = () => act("log_meal", { date: day(), slot: meal.meal.toLowerCase(), recipe_id: meal.recipeId, servings: sv });
  if ($("cook")) $("cook").onclick = () => ask("ui/open-link", { url: ORIGIN + "/cook/" + meal.recipeId });
  if ($("shop")) $("shop").onclick = () => ask("ui/open-link", { url: ORIGIN + "/shopping" });
}
`;
// Everything the week needs, all chosen; tap a row you already have to leave it out, then one button adds the rest.
const WEEK_SHOP_RENDER = `
let skip = new Set();
let done = false;
function render(d) {
  const items = d.toAdd || [];
  const on = d.alreadyOnList ? '<p class="m" style="color:var(--ink2)">' + d.alreadyOnList + " already on your list</p>" : "";
  if (done || !items.length) {
    root.innerHTML = '<div class="card"><p class="n">' + (done ? "Added to your list" : "You have everything for the week") + "</p>" + on
      + (ORIGIN ? '<div class="row"><button class="btn" id="go">Open shopping</button></div>' : "") + "</div>";
    const go = document.getElementById("go");
    if (go) go.onclick = () => ask("ui/open-link", { url: ORIGIN + "/shopping" });
    return;
  }
  const picked = items.filter((x) => !skip.has(x.name));
  const rows = items.map((x) => '<button class="line pick' + (skip.has(x.name) ? " off" : "") + '" data-n="' + esc(x.name) + '"><span>' + esc(x.name) + '</span><span class="m" style="color:var(--ink2)">' + (skip.has(x.name) ? "have it" : (x.qty ? x.qty + " " + esc(x.unit || "") : "")) + "</span></button>").join("");
  root.innerHTML = '<div class="card"><p class="n">For your week</p><p class="m" style="color:var(--ink2)">Tap anything you already have.</p>' + on + rows
    + '<div class="row"><button class="btn" id="add"' + (picked.length ? "" : " disabled") + ">Add " + picked.length + " to shopping</button></div></div>";
  root.querySelectorAll("[data-n]").forEach((b) => (b.onclick = () => { const n = b.dataset.n; skip.has(n) ? skip.delete(n) : skip.add(n); render(d); fit(); }));
  document.getElementById("add").onclick = async () => {
    document.getElementById("add").disabled = true;
    const list = picked.map((x) => ({ name: x.name, qty: x.qty, unit: x.unit }));
    for (let i = 0; i < list.length; i += 30) await call("add_to_shopping_list", { items: list.slice(i, i + 30) }).catch(() => null);
    const have = items.filter((x) => skip.has(x.name)).map((x) => ({ name: x.name, qty: 1 }));
    for (let i = 0; i < have.length; i += 30) await call("add_to_pantry", { items: have.slice(i, i + 30) }).catch(() => null);
    done = true; render(d); fit();
  };
}
`;
// Meal ideas as stories: swipe through the best pick and the other ideas, each with its picture and one main action.
// Calling what_to_eat again would write a different meal, so answers here update the card in place instead of reloading.
const MEALS_RENDER = `
let saved = false;
async function act(name, args) {
  root.querySelectorAll("button").forEach((b) => (b.disabled = true));
  await call(name, args).catch(() => null);
  const gone = name === "add_to_pantry" || name === "add_to_shopping_list" ? args.items.map((x) => x.name) : [];
  state.best.toCheck = (state.best.toCheck || []).filter((x) => !gone.includes(x));
  if (name === "keep_recipe") saved = true;
  render(state); fit();
}
let state = null;
let at = 0;
function slide(x, i) {
  const art = x.image && ORIGIN ? '<img class="pic big" alt="" onerror="this.hidden=true" src="' + esc(ORIGIN + x.image) + '">' : '<div class="pic big blank"></div>';
  const head = '<span class="k">' + (i === 0 ? "Best pick" : "Or") + "</span>";
  if (i === 0) {
    const meta = x.minutes + " min · " + x.kcalPerServing + " kcal · " + x.protein + " g protein" + (x.written ? " · estimate" : "");
    const gaps = x.toCheck || [];
    return '<div class="story">' + art + head + '<span class="n">' + esc(x.name) + '</span><span class="m">' + esc(x.blurb || "") + '</span><span class="m" style="opacity:.8">' + meta + "</span>"
      + (gaps.length ? missing(gaps) : "")
      + '<div class="row">' + (ORIGIN ? '<button class="' + (gaps.length ? "pill" : "btn") + '" id="cook">' + (gaps.length ? "Cook anyway" : "Cook this") + "</button>" : "")
      + (x.written ? '<button class="pill" id="save"' + (saved ? " disabled" : "") + ">" + (saved ? "Saved" : "Save") + "</button>" : "") + "</div></div>";
  }
  return '<div class="story">' + art + head + '<span class="n">' + esc(x.name) + '</span><span class="m">' + esc(x.blurb || "") + "</span>"
    + '<div class="row"><button class="btn" data-idea="' + i + '">' + (x.id ? "See recipe" : "Make this") + "</button></div></div>";
}
function render(d) {
  state = d;
  const all = [d.best].concat(d.ideas || []);
  root.innerHTML = '<div class="card"><div class="stories" id="rail">' + all.map(slide).join("") + "</div>"
    + '<div class="dots">' + all.map((_, i) => '<i class="' + (i === at ? "on" : "") + '"></i>').join("") + "</div></div>";
  const rail = document.getElementById("rail");
  rail.scrollLeft = at * rail.clientWidth * 0.86;
  rail.onscroll = () => {
    const i = Math.round(rail.scrollLeft / (rail.scrollWidth / all.length));
    if (i !== at) { at = i; root.querySelectorAll(".dots i").forEach((dot, j) => (dot.className = j === at ? "on" : "")); }
  };
  wireMissing(d.best.toCheck || [], act);
  const $ = (id) => document.getElementById(id);
  if ($("cook")) $("cook").onclick = () => ask("ui/open-link", { url: ORIGIN + "/cook/" + d.best.id });
  if ($("save")) $("save").onclick = () => act("keep_recipe", { id: d.best.id, keep: true });
  root.querySelectorAll("[data-idea]").forEach((b) => (b.onclick = () => {
    const x = all[Number(b.dataset.idea)];
    if (x.id && ORIGIN) ask("ui/open-link", { url: ORIGIN + "/recipes/" + x.id });
    else ask("ui/message", { role: "user", content: [{ type: "text", text: "Write the recipe for " + x.name }] });
  }));
}
`;
// Calorie range and diet, set in the card: steppers and chips, one Save.
const PROFILE_RENDER = `
let p = null;
const DIETS = [["anything", "Anything"], ["vegetarian", "Vegetarian"], ["eggetarian", "Eggetarian"], ["vegan", "Vegan"]];
function step(id, label, v) {
  return '<div class="line"><span>' + label + '</span><span class="row step"><button class="pill" data-step="' + id + ':-50" aria-label="Less">−</button><b>' + v + '</b><button class="pill" data-step="' + id + ':50" aria-label="More">+</button></span></div>';
}
function render(d) {
  p = p || { kcalMin: d.kcalMin, kcalMax: d.kcalMax, diet: d.diet, saved: d.saved };
  root.innerHTML = '<div class="card"><p class="n">Your daily calories</p>'
    + '<p class="m" style="color:var(--ink2)">' + (p.saved ? "Saved" : "Suggested, not saved yet") + "</p>"
    + step("kcalMin", "From", p.kcalMin) + step("kcalMax", "To", p.kcalMax)
    + '<p class="k">How you eat</p><div class="row">' + DIETS.map(([v, l]) => '<button class="pill' + (p.diet === v ? " ok" : "") + '" data-diet="' + v + '">' + l + "</button>").join("") + "</div>"
    + '<div class="row"><button class="btn" id="save">Save</button></div></div>';
  root.querySelectorAll("[data-step]").forEach((b) => (b.onclick = () => {
    const [k, by] = b.dataset.step.split(":");
    p[k] = Math.max(1000, Math.min(5000, p[k] + Number(by)));
    if (p.kcalMin > p.kcalMax) k === "kcalMin" ? (p.kcalMax = p.kcalMin) : (p.kcalMin = p.kcalMax);
    p.saved = false; render(d);
  }));
  root.querySelectorAll("[data-diet]").forEach((b) => (b.onclick = () => { p.diet = b.dataset.diet; p.saved = false; render(d); }));
  document.getElementById("save").onclick = async () => {
    document.getElementById("save").disabled = true;
    const ok = await call("set_profile", { kcal_min: p.kcalMin, kcal_max: p.kcalMax, diet: p.diet }).then((r) => r && !r.isError).catch(() => false);
    p.saved = !!ok; render(d); fit();
  };
}
`;
const TAIL = `
function fit() { send({ method: "ui/notifications/size-changed", params: { height: document.documentElement.scrollHeight } }); }
addEventListener("message", (e) => {
  const m = e.data; if (!m || m.jsonrpc !== "2.0") return;
  if (m.id && waiting[m.id]) { waiting[m.id](m.result); delete waiting[m.id]; return; }
  if (m.method === "ui/notifications/tool-result") draw(m.params);
});
ask("ui/initialize", { appInfo: { name: "nutriflow-__NAME__", version: "1.0.0" }, appCapabilities: {}, protocolVersion: "2025-06-18" })
  .then(() => send({ method: "ui/notifications/initialized", params: {} }));
`;

const page = (name: string, title: string, render: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>${STYLE}</style></head><body><div id="root"></div><script>${(HEAD + PARSE + render + TAIL).replace("__ORIGIN__", appOrigin()).replace("__NAME__", name)}</script></body></html>`;

export const eatNextHtml = () => page("eat-next", "Eat next", EAT_NEXT_RENDER);
export const weekPlanHtml = () => page("week-plan", "Week plan", WEEK_RENDER);
export const shoppingHtml = () => page("shopping", "Shopping list", SHOPPING_RENDER);
export const todayHtml = () => page("today", "Today", TODAY_RENDER);
export const weekShoppingHtml = () => page("week-shopping", "For your week", WEEK_SHOP_RENDER);
export const mealStoriesHtml = () => page("meal-stories", "Meal ideas", MEALS_RENDER);
export const profileHtml = () => page("profile", "Your calories", PROFILE_RENDER);

// MCP Apps cards: small self-contained pages the chat shows beside a tool's answer (SEP-1865: `ui://` resource,
// mime `text/html;profile=mcp-app`, tool `_meta.ui.resourceUri`). The page talks to the chat over postMessage JSON-RPC:
// it says hello (`ui/initialize`), then receives the tool's result (`ui/notifications/tool-result`) and draws it.
// A client that does not show cards still gets the tool's plain JSON text.

export const CARD_MIME = "text/html;profile=mcp-app";
export const EAT_NEXT_URI = "ui://nutriflow/eat-next";
export const WEEK_PLAN_URI = "ui://nutriflow/week-plan";
export const SHOPPING_URI = "ui://nutriflow/shopping";

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
`;

const PARSE = `
function draw(result) {
  let d = null;
  try { d = JSON.parse((result.content || []).find((c) => c.type === "text").text); } catch (e) {}
  if (!d) { root.innerHTML = '<div class="card"><p>Nothing to show yet.</p></div>'; return fit(); }
  render(d);
  fit();
}
`;
const EAT_NEXT_RENDER = `
function render(d) {
  if (!d.next) { root.innerHTML = '<div class="card"><div class="tile"><span class="n">All meals eaten for today</span></div></div>'; return; }
  const n = d.next;
  const status = d.canCook ? (d.toBuy && d.toBuy.length ? "Cook now with swaps or skips" : "Ready to cook")
    : "You are missing " + d.toBuy.map(esc).join(", ");
  const then = (d.thenToday || []).map((t) => '<span class="pill">' + esc(t.meal) + " · " + esc(t.name) + "</span>").join("");
  root.innerHTML = '<div class="card"><div class="tile"><span class="k">' + (n.tomorrow ? "Tomorrow · " : "") + esc(n.meal) + '</span><span class="n">' + esc(n.name) + '</span><span class="m">' + n.minutes + " min · " + n.kcalPerServing + ' kcal per serving</span></div>'
    + '<p><span class="pill ' + (d.canCook ? "ok" : "warn") + '">' + status + "</span></p>"
    + (ORIGIN ? '<div class="row"><button class="btn" id="go">' + (d.canCook ? "Start cooking" : "Cook anyway") + '</button></div>' : "")
    + (then ? '<div class="row"><span class="m" style="color:var(--ink2)">Then</span>' + then + "</div>" : "") + "</div>";
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

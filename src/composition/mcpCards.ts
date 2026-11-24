// MCP Apps cards: small self-contained pages the chat shows beside a tool's answer (SEP-1865: `ui://` resource,
// mime `text/html;profile=mcp-app`, tool `_meta.ui.resourceUri`). The page talks to the chat over postMessage JSON-RPC:
// it says hello (`ui/initialize`), then receives the tool's result (`ui/notifications/tool-result`) and draws it.
// A client that does not show cards still gets the tool's plain JSON text.

export const CARD_MIME = "text/html;profile=mcp-app";
export const EAT_NEXT_URI = "ui://nutriflow/eat-next";

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
`;

const SCRIPT = `
const ORIGIN = ${JSON.stringify("__ORIGIN__")};
let seq = 0; const waiting = {};
const send = (m) => parent.postMessage({ jsonrpc: "2.0", ...m }, "*");
const ask = (method, params) => new Promise((res) => { const id = ++seq; waiting[id] = res; send({ id, method, params }); });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const root = document.getElementById("root");
function draw(result) {
  let d = null;
  try { d = JSON.parse((result.content || []).find((c) => c.type === "text").text); } catch (e) {}
  if (!d) { root.innerHTML = '<div class="card"><p>Nothing to show yet.</p></div>'; return fit(); }
  if (!d.next) { root.innerHTML = '<div class="card"><div class="tile"><span class="n">All meals eaten for today</span></div></div>'; return fit(); }
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
  fit();
}
function fit() { send({ method: "ui/notifications/size-changed", params: { height: document.documentElement.scrollHeight } }); }
addEventListener("message", (e) => {
  const m = e.data; if (!m || m.jsonrpc !== "2.0") return;
  if (m.id && waiting[m.id]) { waiting[m.id](m.result); delete waiting[m.id]; return; }
  if (m.method === "ui/notifications/tool-result") draw(m.params);
});
ask("ui/initialize", { appInfo: { name: "nutriflow-eat-next", version: "1.0.0" }, appCapabilities: {}, protocolVersion: "2025-06-18" })
  .then(() => send({ method: "ui/notifications/initialized", params: {} }));
`;

export const eatNextHtml = () =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Eat next</title><style>${STYLE}</style></head><body><div id="root"></div><script>${SCRIPT.replace("__ORIGIN__", appOrigin())}</script></body></html>`;

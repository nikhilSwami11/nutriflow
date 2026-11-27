"use client";
import { useState } from "react";
import { useConnect, type Assistant } from "@/view-models/auth/useConnect";

const NAME: Record<Assistant, string> = { claude: "Claude", chatgpt: "ChatGPT" };
const STEPS: Record<Assistant, string[]> = {
  claude: [
    "In Claude, open Settings, then Connectors.",
    "Choose Add custom connector and paste the link.",
    "Press Connect, then Allow on the NutriFlow page.",
  ],
  chatgpt: [
    "In ChatGPT, open Settings, then Apps, and turn on Developer mode.",
    "Choose Create, name it NutriFlow and paste the link.",
    "Press Connect, then Allow on the NutriFlow page.",
  ],
};
const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Use NutriFlow from your own Claude or ChatGPT: the link to paste, three steps, and whether it is connected. */
export function ConnectCard() {
  const c = useConnect();
  const [who, setWho] = useState<Assistant>("claude");
  const since = c.connectedSince(who);

  return (
    <section aria-labelledby="connect-title" className="flex flex-col gap-3 rounded-[20px] bg-panel p-4">
      <div>
        <h2 id="connect-title" className="m-0 text-base font-medium">Use with Claude or ChatGPT</h2>
        <p className="m-0 mt-1 text-sm text-ink2">Ask what to eat, log meals and fill your list from your own chat.</p>
      </div>

      <div role="group" aria-label="Assistant" className="flex gap-2">
        {(["claude", "chatgpt"] as const).map((a) => (
          <button key={a} type="button" aria-pressed={who === a} onClick={() => setWho(a)} className={`touch rounded-full px-4 text-sm ${who === a ? "bg-mint font-medium text-onp" : "border border-line2 bg-transparent text-ink2"}`}>
            {NAME[a]}
          </button>
        ))}
      </div>

      <p className="m-0 text-sm">
        {since ? <span className="rounded-full bg-mint px-3 py-1.5 font-medium text-onp">Connected since {day(since)}</span> : <span className="text-ink2">{NAME[who]} is not connected yet</span>}
      </p>

      <div className="flex items-center gap-2">
        <input aria-label="Connector link" readOnly value={c.url} onFocus={(ev) => ev.currentTarget.select()} className="touch min-w-0 flex-1 rounded-2xl border border-line2 bg-bg px-4 text-sm" />
        <button type="button" onClick={c.copy} className="touch shrink-0 rounded-full border border-line2 bg-bg px-4 text-sm font-medium">
          {c.copied ? "Copied" : "Copy"}
        </button>
      </div>

      <ol className="m-0 flex flex-col gap-2 pl-5 text-sm text-ink2">
        {STEPS[who].map((s) => <li key={s}>{s}</li>)}
      </ol>
    </section>
  );
}

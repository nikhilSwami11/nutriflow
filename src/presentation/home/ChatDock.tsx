"use client";
import { useEffect, useRef } from "react";
import { CHAT_CHIPS, useChat } from "@/view-models/home/useChat";

const SPARK = <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />;
const icon = (d: React.ReactNode, s = 22) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);

/** Bottom-right chat: a colour-wheel orb that opens a small panel. Replies come with one tap, never a wall of text. */
export function ChatDock({ next }: { next: { id: string; name: string } | undefined }) {
  const c = useChat(next);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const { open, setOpen } = c;

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);
  useEffect(() => { end.current?.scrollIntoView({ block: "end" }); }, [c.msgs.length, c.busy]);

  const hello = c.hour < 11 ? "Good morning" : c.hour < 17 ? "Good afternoon" : "Good evening";

  if (!open) {
    return (
      <div className="chat-anchor">
        <button type="button" onClick={() => setOpen(true)} aria-label="Ask NutriFlow" className="chat-orb flex h-14 w-14 items-center justify-center p-0 text-ink shadow-[0_6px_22px_rgba(0,0,0,0.14)]">
          {icon(SPARK)}
        </button>
      </div>
    );
  }

  return (
    <div className="chat-anchor">
      <section role="dialog" aria-label="Ask NutriFlow" className="story-in flex max-h-[min(560px,calc(100dvh-150px))] w-[min(calc(100vw-32px),380px)] flex-col overflow-hidden rounded-[28px] border border-line bg-bg shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
        <header className="flex items-center gap-3 px-4 pb-3 pt-4">
          <span className="chat-orb flex h-9 w-9 items-center justify-center text-ink" data-live={c.listening || c.busy} aria-hidden="true">{icon(SPARK, 16)}</span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 text-base font-medium leading-tight">NutriFlow</h2>
            <p className="m-0 text-xs text-muted">{c.listening ? "Listening…" : "Ask, or tell me what you have"}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close chat" className="flex h-11 w-11 items-center justify-center rounded-full bg-track text-ink">{icon(<path d="M6 6l12 12M18 6L6 18" />, 18)}</button>
        </header>

        <div role="log" aria-live="polite" className="rail flex min-h-[180px] flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-3">
          <div className="max-w-[88%] self-start rounded-[20px] rounded-bl-md bg-lavender px-4 py-3 text-[15px] text-onp">
            {hello}. {next ? `${next.name} is next.` : "Your day is done."} What do you need?
          </div>
          {c.msgs.length === 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {CHAT_CHIPS.map((t, i) => (
                <button key={t} type="button" onClick={() => void c.send(t)} className="rise touch rounded-full border border-line2 bg-bg px-3.5 text-sm text-ink" style={{ "--i": i + 1 } as React.CSSProperties}>{t}</button>
              ))}
            </div>
          )}
          {c.msgs.map((m) =>
            m.from === "me" ? (
              <div key={m.id} className="max-w-[88%] self-end rounded-[20px] rounded-br-md bg-mint px-4 py-3 text-[15px] text-onp">{m.text}</div>
            ) : (
              <div key={m.id} className="flex max-w-[92%] flex-col items-start gap-2 self-start">
                <div className="rounded-[20px] rounded-bl-md bg-panel px-4 py-3 text-[15px] text-ink">{m.text}</div>
                {m.heard && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    {m.heard.chips.map((x) => <span key={x.name} className="rounded-full bg-panel px-3 py-1.5">{x.name} <span className="text-ink2">{x.qty}</span></span>)}
                  </div>
                )}
                {m.heard?.state === "open" && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void c.add(m)} className="touch rounded-full bg-mint px-4 text-sm font-medium text-onp">Add to pantry</button>
                    <button type="button" onClick={() => c.skip(m)} className="touch rounded-full border border-line2 px-4 text-sm">Not right</button>
                  </div>
                )}
                {m.go && <button type="button" onClick={() => c.go(m.go!.href)} className="touch rounded-full bg-ink px-4 text-sm font-medium text-bg">{m.go.label}</button>}
              </div>
            ),
          )}
          {c.busy && (
            <div className="flex gap-1 self-start rounded-[20px] rounded-bl-md bg-panel px-4 py-4" role="status" aria-label="Thinking">
              {[0, 1, 2].map((i) => <span key={i} className="chat-dot" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          )}
          <div ref={end} />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); void c.send(c.text); }} className="flex items-center gap-2 border-t border-line p-3">
          <input ref={input} value={c.text} onChange={(e) => c.setText(e.target.value)} aria-label="Message NutriFlow" placeholder="Message NutriFlow" className="min-h-11 min-w-0 flex-1 rounded-full bg-panel px-4 text-[15px] text-ink placeholder:text-muted" />
          <button type="button" onClick={c.mic} aria-label="Speak" aria-pressed={c.listening} className="flex h-11 w-11 items-center justify-center rounded-full text-ink2">
            {icon(<><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>, 20)}
          </button>
          <button type="submit" aria-label="Send" disabled={!c.text.trim()} className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-bg disabled:opacity-30">{icon(<path d="M5 12h14M13 6l6 6-6 6" />, 20)}</button>
        </form>
      </section>
    </div>
  );
}

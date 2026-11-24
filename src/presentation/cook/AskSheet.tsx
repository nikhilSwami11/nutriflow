"use client";
import { useEffect, useRef, useState } from "react";
import type { CookModel } from "@/view-models/cook/useCook";
import { useSwipeDismiss } from "../shared/useSwipeDismiss";

/**
 * Ask a question about the current step. Answers come from the written guide for this recipe, so it only says
 * what the recipe says; anything else gets a list of what it can help with.
 */
export function AskSheet({ ask }: { ask: CookModel["ask"] }) {
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const { setOpen } = ask;
  const { sheet, handle } = useSwipeDismiss(() => setOpen(false));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setOpen]);
  useEffect(() => {
    end.current?.scrollIntoView?.({ block: "end" });
  }, [ask.thread.length]);

  const send = (q: string) => {
    ask.send(q);
    setText("");
  };

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="absolute inset-0 bg-black/30" />
      <div ref={sheet} role="dialog" aria-modal="true" aria-label="Ask about this step" className="story-in relative mx-auto flex max-h-[85dvh] w-full max-w-[460px] flex-col rounded-t-[28px] bg-bg pb-[max(20px,env(safe-area-inset-bottom))] pt-2.5">
        <div {...handle} className="touch-none">
        <span className="mx-auto block h-1 w-10 rounded-sm bg-line2" aria-hidden="true" />
        <div className="flex items-center justify-between px-5 pb-2 pt-2">
          <h2 className="m-0 text-base font-medium">Ask about this step</h2>
          <button type="button" autoFocus onClick={() => setOpen(false)} aria-label="Close sheet" className="flex h-11 w-11 items-center justify-center rounded-full bg-track">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        </div>

        <div role="log" aria-label="Questions and answers" aria-live="polite" className="rail flex min-h-[120px] flex-1 flex-col gap-3 overflow-y-auto px-5 py-2">
          {ask.thread.length === 0 && <p className="m-0 text-[15px] leading-normal text-ink2">Ask how long a step takes, how to tell it is done, how much of something, what to use instead, or what to do if it goes wrong.</p>}
          {ask.thread.map((m) => (
            <p key={m.id} className={`m-0 max-w-[85%] rounded-[20px] px-4 py-3 text-[15px] leading-normal ${m.who === "you" ? "self-end bg-ink text-bg" : "self-start bg-panel"}`}>{m.text}</p>
          ))}
          <div ref={end} />
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pb-3 pt-1 rail" role="group" aria-label="Suggested questions">
          {ask.suggestions.map((q) => (
            <button key={q} type="button" onClick={() => send(q)} className="touch shrink-0 rounded-full border border-line2 px-4 text-sm">{q}</button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2 px-5">
          <input value={text} onChange={(e) => setText(e.target.value)} aria-label="Your question" placeholder="Ask about this step" autoComplete="off" className="min-h-12 min-w-0 flex-1 rounded-full border border-line2 bg-bg px-4 text-[15px]" />
          <button type="submit" disabled={!text.trim()} className="min-h-12 shrink-0 rounded-full bg-ink px-5 text-[15px] font-medium text-bg disabled:opacity-40">Ask</button>
        </form>
      </div>
    </div>
  );
}

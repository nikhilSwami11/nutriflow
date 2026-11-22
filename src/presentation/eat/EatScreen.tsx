"use client";
import Link from "next/link";
import { useState } from "react";
import { useEat, WANTS } from "@/view-models/eat/useEat";
import { AppShell } from "../shell/AppShell";

export function EatScreen() {
  const e = useEat();
  const [text, setText] = useState("");
  const [top, ...rest] = e.picks;

  return (
    <AppShell current="eat">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">What should I eat?</h1>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-4 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <form
          className="flex shrink-0 flex-col gap-3"
          onSubmit={async (ev) => {
            ev.preventDefault();
            const said = text;
            setText("");
            await e.ask(said);
          }}
        >
          <label htmlFor="eat-ask" className="sr-only">Tell me what you feel like</label>
          <div className="flex gap-2">
            <input id="eat-ask" value={text} onChange={(ev) => setText(ev.target.value)} placeholder="I need to eat something" maxLength={120} className="touch min-w-0 flex-1 rounded-2xl border border-line2 bg-bg px-4 text-[15px]" />
            <button type="submit" disabled={e.searching} className="touch shrink-0 rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">{e.searching ? "Finding" : "Find"}</button>
          </div>
          <div role="group" aria-label="What you feel like" className="flex flex-wrap gap-2">
            {WANTS.map((w) => (
              <button key={w.id} type="button" aria-pressed={e.wants.includes(w.id)} onClick={() => e.toggle(w.id)} className={`touch rounded-full border px-4 text-sm ${e.wants.includes(w.id) ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
                {w.label}
              </button>
            ))}
          </div>
        </form>

        {top && (
          <article aria-label="Best pick" className="flex shrink-0 flex-col gap-3 rounded-[20px] border border-line bg-bg p-4">
            <div>
              <div className="text-xs font-medium text-muted">Best pick</div>
              <h2 className="m-0 mt-1 text-xl font-medium tracking-[-0.01em]">{top.name}</h2>
              <p className="m-0 mt-1 text-sm text-ink2">{top.why}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/cook/${top.id}`} className="touch inline-flex items-center rounded-full bg-ink px-5 text-[15px] font-medium text-bg">Start cooking</Link>
              <Link href={`/recipes/${top.id}`} className="touch inline-flex items-center rounded-full border border-line2 px-4 text-sm font-medium">Recipe</Link>
            </div>
          </article>
        )}

        {rest.length > 0 && (
          <section aria-label="Other picks" className="flex flex-col gap-1">
            <h2 className="m-0 text-base font-medium">Or</h2>
            <ul className="m-0 list-none border-t border-line p-0">
              {rest.map((r) => (
                <li key={r.id} className="border-b border-line">
                  <Link href={`/recipes/${r.id}`} className="touch flex flex-col justify-center py-2">
                    <span className="text-[15px]">{r.name}</span>
                    <span className="text-sm text-muted">{r.why}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {!e.isLoading && e.picks.length === 0 && <p className="m-0 text-sm text-ink2">Nothing matches your diet and dislikes. Loosen them in your profile.</p>}

        {e.needsProfile && (
          <p className="m-0 text-sm text-ink2">
            This is a guess. <Link href="/profile" className="underline underline-offset-[3px]">Set your diet and calories</Link> for better picks.
          </p>
        )}
      </div>
    </AppShell>
  );
}

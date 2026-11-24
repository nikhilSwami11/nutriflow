"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useConsent } from "@/view-models/auth/useConsent";

/** Supabase Auth sends the browser here when ChatGPT or Claude asks to connect. Not on the Design canvas: built from the design system. */
export function ConsentScreen() {
  const c = useConsent(useSearchParams().get("authorization_id"));
  const s = c.state;

  useEffect(() => {
    if (s.kind === "leave") window.location.replace(s.to);
  }, [s]);

  return (
    <main className="flex min-h-dvh flex-col">
      <header className="mx-auto w-full max-w-md px-5 pt-4 lg:pt-8">
        <p className="m-0 text-[22px] font-medium tracking-[-0.02em]">NutriFlow</p>
      </header>
      <section className="mx-auto flex w-full max-w-md flex-1 flex-col gap-3 px-5 py-6" aria-busy={s.kind === "loading" || s.kind === "leave"}>
        {s.kind === "ask" && (
          <>
            <h1 className="m-0 text-[26px] font-medium leading-[1.15] tracking-[-0.025em]">Connect {s.appName}</h1>
            <p className="m-0 text-[15px] leading-[1.5]">
              {s.appName} will be able to see and change your meals, pantry, shopping list and chores.
            </p>
            <p className="m-0 text-sm text-ink2">To stop, remove NutriFlow from {s.appName}’s connectors.</p>
            <button type="button" onClick={c.allow} disabled={c.busy} className="touch mt-2 min-h-12 rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg disabled:opacity-60">
              Allow
            </button>
            <button type="button" onClick={c.refuse} disabled={c.busy} className="touch min-h-12 rounded-full border border-line2 bg-bg px-5 text-[15px] font-medium disabled:opacity-60">
              Cancel
            </button>
          </>
        )}
        {s.kind === "error" && (
          <>
            <h1 className="m-0 text-[26px] font-medium leading-[1.15] tracking-[-0.025em]">Could not connect</h1>
            <p role="alert" className="m-0 text-[15px] leading-[1.5]">{s.message}</p>
          </>
        )}
        {(s.kind === "loading" || s.kind === "leave") && (
          <p role="status" className="m-0 text-sm text-ink2">{s.kind === "leave" ? "Going back to the app…" : "Loading…"}</p>
        )}
      </section>
    </main>
  );
}

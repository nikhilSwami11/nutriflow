"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/view-models/auth/useAuth";
import { DIET_LABEL, DIETS, useProfile, type Diet } from "@/view-models/profile/useProfile";
import { AppShell } from "../shell/AppShell";

const field = "touch w-full rounded-2xl border border-line2 bg-bg px-4 text-[15px]";

function Form({ p }: { p: ReturnType<typeof useProfile> }) {
  const [diet, setDiet] = useState<Diet>(p.diet);
  const [min, setMin] = useState(String(p.min));
  const [max, setMax] = useState(String(p.max));
  const [dislikes, setDislikes] = useState(p.dislikes);
  const [done, setDone] = useState(false);
  const touched = () => setDone(false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={async (ev) => {
        ev.preventDefault();
        setDone(await p.save({ min: Number(min), max: Number(max), diet, dislikes }));
      }}
    >
      <section aria-label="Diet" className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-medium">How do you eat?</h2>
        <div role="group" aria-label="Diet" className="flex flex-wrap gap-2">
          {DIETS.map((d) => (
            <button key={d} type="button" aria-pressed={diet === d} onClick={() => (setDiet(d), touched())} className={`touch rounded-full border px-4 text-sm ${diet === d ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
              {DIET_LABEL[d]}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="Calories" className="flex flex-col gap-2">
        <h2 className="m-0 text-base font-medium">Calories a day</h2>
        <div className="flex items-center gap-3">
          <label className="flex flex-1 flex-col gap-1 text-sm text-ink2">From<input aria-label="Calories from" inputMode="numeric" value={min} onChange={(ev) => (setMin(ev.target.value), touched())} className={field} /></label>
          <label className="flex flex-1 flex-col gap-1 text-sm text-ink2">To<input aria-label="Calories to" inputMode="numeric" value={max} onChange={(ev) => (setMax(ev.target.value), touched())} className={field} /></label>
        </div>
      </section>

      <section aria-label="Dislikes" className="flex flex-col gap-2">
        <label htmlFor="dislikes" className="text-base font-medium">Foods to skip</label>
        <input id="dislikes" value={dislikes} onChange={(ev) => (setDislikes(ev.target.value), touched())} placeholder="mushrooms, peanuts" maxLength={200} className={field} />
        <p className="m-0 text-sm text-muted">Separate with commas. These stay out of what I suggest.</p>
      </section>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={p.saving} className="touch rounded-full border-0 bg-ink px-6 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">Save</button>
        {done && <span role="status" className="text-sm text-ink2">Saved</span>}
        {p.error && !done && <span role="alert" className="text-sm text-ink2">{p.error}</span>}
      </div>
    </form>
  );
}

export function ProfileScreen() {
  const p = useProfile();
  const a = useAuth();
  const router = useRouter();

  return (
    <AppShell current="profile">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Profile</h1>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-6 overflow-y-auto px-5 pb-6 pt-1 lg:max-w-3xl">
        <section aria-label="Account" className="flex flex-col gap-2 rounded-[20px] bg-panel p-4">
          {a.status === "in" ? (
            <>
              <h2 className="m-0 text-base font-medium">Signed in</h2>
              <p className="m-0 text-sm text-ink2">{a.email ?? "Google account"}</p>
              <button type="button" disabled={a.busy} onClick={async () => (await a.signOut(), router.replace("/signin"))} className="touch self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">Sign out</button>
            </>
          ) : (
            <>
              <h2 className="m-0 text-base font-medium">You are using a guest account</h2>
              <p className="m-0 text-sm text-ink2">Sign in with Google to keep your pantry, meals and preferences on every device.</p>
              <button type="button" disabled={a.busy} onClick={a.signInWithGoogle} className="touch self-start rounded-full border border-line2 bg-bg px-4 text-sm font-medium">Continue with Google</button>
              {/* A guest cannot get back in, so leaving loses its pantry and meals: ask first. */}
              <button type="button" disabled={a.busy} onClick={async () => { if (window.confirm("Sign out of the guest account? Its pantry and meals will be lost.")) { await a.signOut(); router.replace("/signin"); } }} className="touch self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium">Sign out</button>
              {a.error && <p role="alert" className="m-0 text-sm text-ink2">{a.error}</p>}
            </>
          )}
        </section>

        {!p.isLoading && <Form p={p} />}
      </div>
    </AppShell>
  );
}

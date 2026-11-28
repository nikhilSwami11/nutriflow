"use client";
import Link from "next/link";
import { useSuggested, WANTS, type Badge } from "@/view-models/eat/useSuggested";
import { RecipeArt } from "../recipes/RecipeArt";
import { AppShell } from "../shell/AppShell";

const btn = "touch inline-flex items-center rounded-full px-5 text-[15px] font-medium";

const BADGE: Record<Exclude<Badge, null>, { label: string; bg: string; icon: React.ReactNode }> = {
  leftover: { label: "Leftover", bg: "bg-butter", icon: <><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V6h8v4" /></> },
  prepped: { label: "Prepped", bg: "bg-sky", icon: <><circle cx="12" cy="12" r="8" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></> },
  instant: { label: "Instant", bg: "bg-mint", icon: <path d="M13 3L5 14h6l-1 7 8-11h-6z" /> },
};

function BadgeChip({ badge }: { badge: Exclude<Badge, null> }) {
  const b = BADGE[badge];
  return (
    <span className={`absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-onp ${b.bg}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{b.icon}</svg>
      {b.label}
    </span>
  );
}

type Pick = ReturnType<typeof useSuggested>["picks"][number];

function Card({ p }: { p: Pick }) {
  return (
    <li className="flex flex-col gap-2">
      <Link href={`/recipes/${p.id}`} aria-label={`${p.name}${p.badge ? `, ${BADGE[p.badge].label.toLowerCase()}` : ""}`} className="flex flex-col gap-2 text-ink">
        <span className="relative flex h-[132px] w-full items-center justify-center rounded-[20px]" style={{ background: p.tint }}>
          <RecipeArt image={p.image} size={100} />
          {p.badge && <BadgeChip badge={p.badge} />}
        </span>
        <span className="line-clamp-2 text-[15px] font-medium leading-snug">{p.name}</span>
        <span className="-mt-1 text-sm text-ink2 tabular-nums">{p.note}</span>
      </Link>
      {p.leftoverId && <button type="button" onClick={() => void p.eatPortion()} className="touch self-start rounded-full border border-line2 bg-transparent px-4 text-sm font-medium text-ink">Eat a portion</button>}
    </li>
  );
}

export function SuggestedScreen() {
  const s = useSuggested();
  const [first, ...rest] = s.picks;
  return (
    <AppShell current="eat">
      <header className="flex shrink-0 items-center justify-between gap-3 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Suggested</h1>
        <Link href="/recipes" className={`${btn} border border-line2 text-sm text-ink`}>My recipes</Link>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <div role="group" aria-label="What you feel like" className="-mx-5 flex shrink-0 gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-wrap lg:px-0">
          {WANTS.map((w) => (
            <button key={w.id} type="button" aria-pressed={s.wants.includes(w.id)} onClick={() => s.toggle(w.id)} className={`touch shrink-0 rounded-full border px-4 text-sm ${s.wants.includes(w.id) ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>{w.label}</button>
          ))}
        </div>

        {s.isLoading && (
          <div role="status" aria-label="Loading suggestions" className="flex flex-col gap-3">
            <div className="skeleton h-56 rounded-[20px] bg-track" />
            <div className="grid grid-cols-2 gap-3"><div className="skeleton h-40 rounded-[20px] bg-track" /><div className="skeleton h-40 rounded-[20px] bg-track" /></div>
          </div>
        )}

        {!s.isLoading && first && (
          <article aria-label="Top pick" className="flex shrink-0 flex-col overflow-hidden rounded-[20px] border border-line bg-bg">
            <Link href={`/recipes/${first.id}`} aria-label={`Open ${first.name}`} className="relative flex h-56 w-full items-center justify-center" style={{ background: first.tint }}>
              <RecipeArt image={first.image} size={190} eager />
              {first.badge && <BadgeChip badge={first.badge} />}
            </Link>
            <div className="flex flex-col gap-3 p-4">
              <div>
                <h2 className="m-0 text-[22px] font-medium leading-tight tracking-[-0.01em]">{first.name}</h2>
                <p className="m-0 mt-1 text-sm text-ink2 tabular-nums">{first.note} · {first.facts}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {first.leftoverId ? (
                  <button type="button" onClick={() => void first.eatPortion()} className={`${btn} border-0 bg-ink text-bg`}>Eat a portion</button>
                ) : (
                  <Link href={`/cook/${first.id}`} className={`${btn} bg-ink text-bg`}>Start cooking</Link>
                )}
              </div>
            </div>
          </article>
        )}

        {!s.isLoading && rest.length > 0 && (
          <ul aria-label="More suggestions" className="m-0 grid shrink-0 list-none grid-cols-2 gap-x-3 gap-y-5 p-0 lg:grid-cols-2">
            {rest.map((p) => <Card key={p.id} p={p} />)}
          </ul>
        )}

        <button type="button" onClick={s.refresh} className={`${btn} shrink-0 gap-2 self-start border border-line2 bg-transparent text-sm text-ink`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5l2-2.5M20 20v-5h-5" /></svg>
          New recipes
        </button>
      </div>
    </AppShell>
  );
}

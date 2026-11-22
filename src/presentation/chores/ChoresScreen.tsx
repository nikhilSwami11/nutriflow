"use client";
import { useState } from "react";
import { useChores, type ChoreRow, type Repeat } from "@/view-models/chores/useChores";
import { AppShell } from "../shell/AppShell";

const REPEATS: { value: Repeat; label: string }[] = [
  { value: "daily", label: "Every day" },
  { value: "weekly", label: "Every week" },
  { value: "once", label: "Once" },
];

function Row({ c, onToggle, onRemove }: { c: ChoreRow; onToggle: () => void; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-1 border-t border-line first:border-t-0">
      <button type="button" onClick={onToggle} aria-pressed={c.done} aria-label={`${c.title}, ${c.done ? "done" : "to do"}`} className="touch flex min-w-0 flex-1 items-center gap-3.5 border-0 bg-transparent py-1 pl-4 text-left">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${c.done ? "border-mint bg-mint text-onp" : "border-line2 bg-bg"}`} aria-hidden="true">
          {c.done && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          )}
        </span>
        <span className="min-w-0 flex-1 py-2">
          <span className={`block text-[15px] ${c.done ? "text-muted line-through" : "font-medium"}`}>{c.title}</span>
          <span className="mt-0.5 block text-sm text-muted">{c.when}</span>
        </span>
      </button>
      <button type="button" onClick={onRemove} aria-label={`Remove ${c.title}`} className="touch flex shrink-0 items-center justify-center border-0 bg-transparent text-muted">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </li>
  );
}

function Section({ title, rows, toggle, remove }: { title: string; rows: ChoreRow[]; toggle: (id: string) => void; remove: (id: string) => void }) {
  if (!rows.length) return null;
  return (
    <section aria-label={title} className="flex flex-col gap-2">
      <h2 className="m-0 text-base font-medium">{title}</h2>
      <ul className="m-0 list-none overflow-hidden rounded-[20px] border border-line bg-bg p-0">
        {rows.map((c) => (
          <Row key={c.id} c={c} onToggle={() => toggle(c.id)} onRemove={() => remove(c.id)} />
        ))}
      </ul>
    </section>
  );
}

export function ChoresScreen() {
  const s = useChores();
  const [title, setTitle] = useState("");
  const [repeat, setRepeat] = useState<Repeat>("daily");

  return (
    <AppShell current="chores">
      <header className="shrink-0 px-5 pb-2 pt-4 lg:max-w-3xl">
        <h1 className="m-0 text-[26px] font-medium tracking-[-0.02em]">Chores</h1>
        <p className="mt-1 text-sm text-muted tabular-nums">{s.countText}</p>
      </header>

      <div className="rail flex min-h-0 w-full flex-1 flex-col gap-5 overflow-y-auto px-5 pb-4 pt-1 lg:max-w-3xl">
        <Section title="To do" rows={s.toDo} toggle={s.toggle} remove={s.remove} />
        <Section title="Done" rows={s.done} toggle={s.toggle} remove={s.remove} />

        <form
          className="flex shrink-0 flex-col gap-3 rounded-[20px] bg-panel p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await s.add(title, repeat)) setTitle("");
          }}
        >
          <label htmlFor="new-chore" className="text-[15px] font-medium">Add a chore</label>
          <input
            id="new-chore"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Water the plants"
            maxLength={120}
            className="touch rounded-2xl border border-line2 bg-bg px-4 text-[15px]"
          />
          <div role="group" aria-label="How often" className="flex flex-wrap gap-2">
            {REPEATS.map((r) => (
              <button key={r.value} type="button" aria-pressed={repeat === r.value} onClick={() => setRepeat(r.value)} className={`touch rounded-full border px-4 text-sm font-medium ${repeat === r.value ? "border-transparent bg-mint text-onp" : "border-line2 bg-bg"}`}>
                {r.label}
              </button>
            ))}
          </div>
          <button type="submit" disabled={!title.trim()} className="touch self-start rounded-full border-0 bg-ink px-5 text-[15px] font-medium text-bg disabled:bg-track disabled:text-muted">
            Add
          </button>
        </form>
      </div>
    </AppShell>
  );
}

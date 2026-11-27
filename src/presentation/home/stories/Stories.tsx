"use client";
import { useRef, useState } from "react";
import type { HomeModel } from "@/view-models/home/useHome";
import { RecipeArt } from "../../recipes/RecipeArt";
import { StoryViewer } from "./StoryViewer";

const ICON = {
  chore: <><path d="M5 12.5l4.5 4.5L19 7.5" /></>,
  pantry: <><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></>,
  prep: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  plan: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
};

type Item = HomeModel["stories"]["items"][number];
const isDone = (s: Item) => (s.kind === "prep" && s.tasks.every((t) => t.done)) || (s.kind === "chore" && s.chore.done);
const stateWord = (s: Item) => (isDone(s) ? "done" : s.seen ? "seen" : "new");

/** The row of circles above the feed. Which ones exist comes from the server-driven feed. */
export function Stories({ s }: { s: HomeModel["stories"] }) {
  const [at, setAt] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  if (!s.items.length) return null;

  return (
    <>
      <div role="list" aria-label="Stories" className="rail flex shrink-0 gap-3.5 overflow-x-auto px-5 py-2 lg:px-2">
        {s.items.map((st, i) => {
          const eaten = isDone(st);
          return (
            <div role="listitem" key={st.id} className="flex w-[68px] shrink-0 flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label={`${st.label} story, ${stateWord(st)}`}
                onClick={(e) => { opener.current = e.currentTarget; setAt(i); }}
                className="relative flex h-[68px] w-[68px] items-center justify-center rounded-full p-[3px]"
                style={{ background: st.seen || eaten ? "var(--line2)" : "conic-gradient(from 200deg, var(--mint), var(--lavender), var(--rose), var(--mint))" }}
              >
                <span className="flex h-full w-full items-center justify-center rounded-full border-[3px] border-bg" style={{ background: st.tint }}>
                  {st.kind === "meal" ? <RecipeArt image={st.meal.image} size={st.meal.image ? 46 : 50} /> : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[st.kind]}</svg>
                  )}
                </span>
                {eaten && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-bg bg-mint text-onp" aria-hidden="true">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                )}
              </button>
              <span className="line-clamp-2 max-w-full text-center text-xs leading-tight text-ink2">{st.label}</span>
            </div>
          );
        })}
      </div>
      {at !== null && (
        <StoryViewer
          s={s}
          index={at}
          setIndex={setAt}
          onClose={() => { setAt(null); opener.current?.focus(); }}
        />
      )}
    </>
  );
}

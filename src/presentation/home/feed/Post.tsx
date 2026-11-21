"use client";
import { useState } from "react";

const heart = "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z";
const bookmark = "M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z";

function Toggle({ label, path, on, onClick }: { label: string; path: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on} aria-label={label} className="flex h-11 w-11 items-center justify-center bg-transparent text-ink">
      <svg key={String(on)} className={on ? "pop" : ""} width="24" height="24" viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={path} />
      </svg>
    </button>
  );
}

/**
 * One post of the mobile feed, as in the design: a header (coloured icon, title, subtitle), a media area,
 * Like and Save, and a caption. Comment and Share are social, so they are not here. Like and Save stay local for now.
 */
export function Post({ label, color, icon, title, sub, media, caption }: { label: string; color: string; icon: React.ReactNode; title: string; sub: string; media: React.ReactNode; caption?: React.ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  return (
    <article aria-label={label} className="flex shrink-0 flex-col border-b border-line pb-4">
      <div className="flex items-center gap-2.5 px-4 py-3.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-onp" style={{ background: color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted">{sub}</div>
        </div>
      </div>
      {media}
      <div className="flex items-center justify-between px-2 pt-1">
        <Toggle label="Like" path={heart} on={liked} onClick={() => setLiked(!liked)} />
        <Toggle label="Save" path={bookmark} on={saved} onClick={() => setSaved(!saved)} />
      </div>
      {caption && <div className="flex flex-col gap-2.5 px-4">{caption}</div>}
    </article>
  );
}

"use client";
import { useHome } from "@/view-models/home/useHome";
import Link from "next/link";
import { AppShell } from "../shell/AppShell";
import { useMediaQuery } from "../shared/useMediaQuery";
import { ChatDock } from "./ChatDock";
import { Feed } from "./feed/Feed";
import { FeedGrid } from "./feed/FeedGrid";
import { Stories } from "./stories/Stories";
import { Skeleton } from "../shared/Skeleton";

/** One server-driven feed, two renderers: posts on mobile, dashboard cards on desktop. */
export function HomeScreen() {
  const h = useHome();
  const desktop = useMediaQuery("(min-width: 1024px)");
  return (
    <AppShell current="home">
      <header className="flex items-center justify-between pb-1.5 pl-5 pr-2 pt-3.5 lg:block lg:p-2 lg:pb-5">
        <div className="text-[22px] font-semibold tracking-[-0.01em] lg:hidden">NutriFlow</div>
        <div className="flex items-center lg:hidden">
          <Link href="/eat" className="touch inline-flex items-center px-3 text-sm text-ink2">Hungry?</Link>
          <Link href="/profile" aria-label="Profile" className="touch flex w-11 items-center justify-center text-ink2">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></svg>
          </Link>
        </div>
        {!h.isLoading && desktop && (
          <div className="rise">
            <div className="mb-2.5 text-sm text-muted">{h.dateLabel}</div>
            <h1 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">What are we cooking tonight?</h1>
          </div>
        )}
      </header>

      {h.isLoading && <Skeleton />}
      {!h.isLoading && !desktop && <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-6"><Stories s={h.stories} /><Feed h={h} /></div>}
      {!h.isLoading && desktop && (
        <div className="rail grid min-h-0 flex-1 grid-flow-dense grid-cols-12 content-start gap-4 overflow-y-auto p-2 pb-10">
          <div className="col-span-12"><Stories s={h.stories} /></div>
          <FeedGrid h={h} />
        </div>
      )}
      {!h.isLoading && <ChatDock next={h.next ? { id: h.next.id, name: h.next.name } : undefined} />}
    </AppShell>
  );
}

"use client";
import { useHome } from "@/view-models/home/useHome";
import Link from "next/link";
import { AppShell } from "../shell/AppShell";
import { useMediaQuery } from "../shared/useMediaQuery";
import { OnboardingSheet } from "./OnboardingSheet";
import { Feed } from "./feed/Feed";
import { FeedGrid } from "./feed/FeedGrid";
import { Stories } from "./stories/Stories";
import { Skeleton } from "../shared/Skeleton";

/** One server-driven feed, two renderers: posts on mobile, dashboard cards on desktop. */
export function HomeScreen() {
  const h = useHome();
  const desktop = useMediaQuery("(min-width: 1024px)");
  return (
    <AppShell current="home" chatNext={h.next ? { id: h.next.id, name: h.next.name } : undefined}>
      <header className="flex items-start justify-between pb-1.5 pl-5 pr-2 pt-3.5 lg:p-2 lg:pb-5">
        {!h.isLoading && (
          <div className="rise min-w-0">
            <div className="text-sm text-muted">{h.dateLabel}</div>
            <h1 className="m-0 mt-0.5 text-[26px] font-medium leading-tight tracking-[-0.02em]">{h.headline}</h1>
          </div>
        )}
        <Link href="/profile" aria-label="Profile" className="touch flex w-11 shrink-0 items-center justify-center text-ink2 lg:hidden">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></svg>
        </Link>
      </header>

      {h.isLoading && <Skeleton />}
      {!h.isLoading && !desktop && <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-6"><Stories s={h.stories} /><Feed h={h} /></div>}
      {!h.isLoading && desktop && (
        <div className="rail grid min-h-0 flex-1 grid-flow-dense grid-cols-12 content-start gap-4 overflow-y-auto p-2 pb-10">
          <div className="col-span-12"><Stories s={h.stories} /></div>
          <FeedGrid h={h} />
        </div>
      )}
      {!h.isLoading && <OnboardingSheet />}
    </AppShell>
  );
}

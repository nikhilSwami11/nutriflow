"use client";
import { useHome } from "@/view-models/home/useHome";
import { AppShell } from "../shell/AppShell";
import { useMediaQuery } from "../shared/useMediaQuery";
import { Feed } from "./feed/Feed";
import { MacroChart } from "./MacroChart";
import { NextMealHero } from "./NextMealHero";
import { PantryNudge } from "./Nudges";
import { TodayLine } from "./TodayLine";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Mobile is a feed of posts (next meal, your day, pantry alert). Desktop is the same three things as a dashboard. */
export function HomeScreen() {
  const h = useHome();
  const desktop = useMediaQuery("(min-width: 1024px)");
  return (
    <AppShell current="home">
      <header className="flex items-center justify-between pb-1.5 pl-5 pr-2 pt-3.5 lg:block lg:p-2 lg:pb-5">
        <div className="text-[22px] font-semibold tracking-[-0.01em] lg:hidden">NutriFlow</div>
        {!h.isLoading && desktop && (
          <div className="rise">
            <div className="mb-2.5 text-[13px] text-muted">{h.dateLabel}</div>
            <h1 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">What are we cooking tonight?</h1>
          </div>
        )}
      </header>

      {!h.isLoading && !desktop && <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-6"><Feed h={h} /></div>}
      {!h.isLoading && desktop && (
        <div className="rail grid min-h-0 flex-1 grid-cols-12 content-start gap-4 overflow-y-auto p-2 pb-10">
          <div className="rise col-span-5" style={rise(1)}><NextMealHero next={h.next} then={h.then} /></div>
          <div className="rise col-span-7 row-span-2" style={rise(2)}>
            <MacroChart
              c={h.chart}
              above={<TodayLine t={h.today} />}
            />
          </div>
          {h.pantry && <div className="rise col-span-5 self-start" style={rise(3)}><PantryNudge p={h.pantry} /></div>}
        </div>
      )}
    </AppShell>
  );
}

"use client";
import Link from "next/link";
import { useHome } from "@/view-models/home/useHome";
import { AppShell } from "../shell/AppShell";
import { MacroChart } from "./MacroChart";
import { NextMealHero } from "./NextMealHero";
import { PantryNudge } from "./Nudges";
import { TodayLine } from "./TodayLine";

const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/** Three things: what to cook next, one chart that holds today, 7 days and 30 days, and what is running low. */
export function HomeScreen() {
  const h = useHome();
  return (
    <AppShell current="home">
      <header className="flex items-center justify-between pb-1.5 pl-5 pr-2 pt-3.5 lg:block lg:p-2 lg:pb-5">
        <div className="text-[22px] font-semibold tracking-[-0.01em] lg:hidden">NutriFlow</div>
        {!h.isLoading && (
          <div className="rise hidden lg:block">
            <div className="mb-2.5 text-[13px] text-muted">{h.dateLabel}</div>
            <h1 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">What are we cooking tonight?</h1>
          </div>
        )}
      </header>

      <div className="rail flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pb-6 pt-2 lg:grid lg:grid-cols-12 lg:content-start lg:gap-4 lg:p-2 lg:pb-10">
        {!h.isLoading && (
          <>
            <div className="rise lg:col-span-5" style={rise(1)}><NextMealHero next={h.next} then={h.then} /></div>
            <div className="rise lg:col-span-7 lg:row-span-2" style={rise(2)}>
              <MacroChart
                c={h.chart}
                above={<TodayLine t={h.today} />}
                below={<Link href="/plan" className="hoverable touch -mb-1 flex items-center self-start rounded-full border border-line2 px-4 text-[13px] font-medium">Plan the week →</Link>}
              />
            </div>
            {h.pantry && <div className="rise lg:col-span-5 lg:self-start" style={rise(3)}><PantryNudge p={h.pantry} /></div>}
          </>
        )}
      </div>
    </AppShell>
  );
}

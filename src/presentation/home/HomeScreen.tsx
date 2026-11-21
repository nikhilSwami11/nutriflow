"use client";
import { useHome } from "@/view-models/home/useHome";
import { AppShell } from "../shell/AppShell";
import { MacroChart } from "./MacroChart";
import { PantryAlert } from "./PantryAlert";
import { SuggestedCard } from "./SuggestedCard";
import { TodayTiles } from "./TodayTiles";
import { TodayVsPlan } from "./TodayVsPlan";
import { TonightCard } from "./TonightCard";
import { UpNextCard } from "./UpNextCard";

const slot = "flex min-w-0 [&>*]:flex-1";
const rise = (i: number) => ({ "--i": i }) as React.CSSProperties;

/**
 * DOM order is the desktop reading order; `order-*` rearranges it for the mobile column.
 * The two desktop columns use `contents` on mobile so their children join the single column.
 */
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

      <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 lg:grid lg:grid-cols-12 lg:content-start lg:gap-4 lg:p-2 lg:pb-10">
        {!h.isLoading && (
          <>
            <div className={`rise order-1 lg:order-none lg:col-span-12 [&>*]:mt-3.5 lg:[&>*]:m-0`} style={rise(1)}><TodayTiles tiles={h.tiles} /></div>
            <div className={`rise ${slot} order-3 lg:order-none lg:col-span-8`} style={rise(2)}><MacroChart c={h.chart} /></div>
            <div className={`rise ${slot} order-4 lg:order-none lg:col-span-4`} style={rise(3)}><TodayVsPlan p={h.plan} /></div>
            <div className="contents lg:col-span-7 lg:flex lg:flex-col lg:gap-4 lg:self-start">
              <div className={`rise ${slot} order-5 lg:order-none`} style={rise(4)}><UpNextCard tasks={h.tasks} toggleBuy={h.toggleBuy} /></div>
              {h.pantryAlert && <div className={`rise ${slot} order-7 lg:order-none`} style={rise(6)}><PantryAlert alert={h.pantryAlert} /></div>}
            </div>
            <div className="contents lg:col-span-5 lg:flex lg:flex-col lg:gap-4 lg:self-start">
              <div className={`rise ${slot} order-6 lg:order-none`} style={rise(5)}><TonightCard t={h.tonight} /></div>
              <div className={`rise ${slot} order-2 lg:order-none`} style={rise(5)}><SuggestedCard items={h.suggestions} /></div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

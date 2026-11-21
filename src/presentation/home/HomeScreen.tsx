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

/** DOM order is the desktop reading order; `order-*` rearranges it for the mobile column. */
export function HomeScreen() {
  const h = useHome();
  return (
    <AppShell current="home">
      <header className="flex items-center justify-between pb-1.5 pl-5 pr-2 pt-3.5 lg:block lg:p-2 lg:pb-5">
        <div className="text-[22px] font-semibold tracking-[-0.01em] lg:hidden">NutriFlow</div>
        {!h.isLoading && (
          <div className="hidden lg:block">
            <div className="mb-2.5 text-[13px] text-muted">{h.dateLabel}</div>
            <h1 className="m-0 text-[28px] font-medium leading-tight tracking-[-0.02em]">What are we cooking tonight?</h1>
          </div>
        )}
      </header>

      <div className="rail flex min-h-0 flex-1 flex-col overflow-y-auto pb-4 lg:grid lg:grid-cols-12 lg:content-start lg:gap-4 lg:p-2 lg:pb-10">
        {!h.isLoading && (
          <>
            <div className="order-1 lg:order-none lg:col-span-12 [&>*]:mt-3.5 lg:[&>*]:m-0"><TodayTiles tiles={h.tiles} /></div>
            <div className="order-3 flex min-w-0 lg:order-none lg:col-span-8 [&>*]:flex-1"><MacroChart c={h.chart} /></div>
            <div className="order-4 flex min-w-0 lg:order-none lg:col-span-4 [&>*]:flex-1"><TodayVsPlan p={h.plan} /></div>
            <div className="order-5 flex min-w-0 lg:order-none lg:col-span-7 lg:row-span-2 [&>*]:flex-1"><UpNextCard tasks={h.tasks} toggleBuy={h.toggleBuy} /></div>
            <div className="order-6 flex min-w-0 lg:order-none lg:col-span-5 [&>*]:flex-1"><TonightCard t={h.tonight} /></div>
            <div className="order-2 flex min-w-0 lg:order-none lg:col-span-5 [&>*]:flex-1"><SuggestedCard items={h.suggestions} /></div>
            {h.pantryAlert && <div className="order-7 flex min-w-0 lg:order-none lg:col-span-12 [&>*]:flex-1"><PantryAlert alert={h.pantryAlert} /></div>}
          </>
        )}
      </div>
    </AppShell>
  );
}

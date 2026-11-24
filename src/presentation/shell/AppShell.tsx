import { CaptureSheet } from "../capture/CaptureSheet";
import { BottomNav } from "./BottomNav";
import { CommandMenu } from "./CommandMenu";
import { SectionTabs } from "./SectionTabs";
import { Sidebar } from "./Sidebar";
import { ViewTransition } from "react";
import type { Page } from "./pages";

/** Mobile layout is the design: one column + bottom nav. From lg up it gains the sidebar. */
export function AppShell({ current, children }: { current: Page; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg text-ink lg:max-w-[1440px] lg:flex-row lg:gap-6 lg:p-6">
      <Sidebar current={current} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SectionTabs current={current} />
        <ViewTransition>{children}</ViewTransition>
      </div>
      <BottomNav current={current} />
      <CaptureSheet />
      <CommandMenu />
    </div>
  );
}

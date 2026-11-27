import { CaptureSheet } from "../capture/CaptureSheet";
import { ChatDock } from "../home/ChatDock";
import { BottomNav } from "./BottomNav";
import { CommandMenu } from "./CommandMenu";
import { SectionTabs } from "./SectionTabs";
import { Sidebar } from "./Sidebar";
import { ViewTransition } from "react";
import type { Page } from "./pages";

/** Mobile layout is the design: one column + bottom nav. From lg up it gains the sidebar. */
/** The voice and chat orb sits bottom right on every screen. `chatNext` lets Home offer "Start cooking" in it. */
export function AppShell({ current, children, chatNext }: { current: Page; children: React.ReactNode; chatNext?: { id: string; name: string } }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg text-ink lg:max-w-[1440px] lg:flex-row lg:gap-6 lg:p-6">
      <Sidebar current={current} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <SectionTabs current={current} />
        <ViewTransition>{children}</ViewTransition>
      </div>
      <BottomNav current={current} />
      <ChatDock next={chatNext} />
      <CaptureSheet />
      <CommandMenu />
    </div>
  );
}

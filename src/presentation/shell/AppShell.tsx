import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

/** Mobile layout is the design: one column + bottom nav. From lg up it gains the sidebar. */
export function AppShell({ current, children }: { current: "home" | "pantry"; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bg text-ink lg:max-w-[1440px] lg:flex-row lg:gap-6 lg:p-6">
      <Sidebar current={current} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      <BottomNav current={current} />
    </div>
  );
}

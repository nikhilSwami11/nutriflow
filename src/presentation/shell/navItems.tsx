import type { Section } from "./pages";

/** The main nav, shared by the phone bar and the sidebar. Icon paths drawn on a 24px grid. */
export const NAV: { section: Section; href: string; label: string; icon: React.ReactNode }[] = [
  { section: "today", href: "/", label: "Today", icon: <path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" /> },
  { section: "food", href: "/eat", label: "Food", icon: <path d="M5 3v8a3 3 0 0 0 3 3v7M8 3v6M11 3v8a3 3 0 0 1-3 3M17 21V3c-2.2 1.5-3 4-3 7v4h3" /> },
  { section: "kitchen", href: "/pantry", label: "Kitchen", icon: <><rect x="6" y="8" width="12" height="13" rx="3" /><path d="M8 4h8v4H8z" /></> },
  { section: "chores", href: "/chores", label: "Chores", icon: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8.5 12l2.5 2.5 4.5-5" /></> },
];

export const PROFILE_ICON = <><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></>;

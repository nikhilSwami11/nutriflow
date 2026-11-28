export type Page = "home" | "recipes" | "plan" | "prep" | "history" | "pantry" | "chores" | "shopping" | "eat" | "profile";

/** The four places in the nav. Food and Kitchen hold several pages, switched at the top of each. */
export type Section = "today" | "food" | "kitchen" | "chores" | "profile";

export const SECTION: Record<Page, Section> = {
  home: "today", eat: "food", recipes: "food", plan: "food", prep: "food", history: "profile", pantry: "kitchen", shopping: "kitchen", chores: "chores", profile: "profile",
};

/** Pages inside a section, in switch order. The first is where the nav link goes. */
export const SECTION_PAGES: Partial<Record<Section, { page: Page; href: string; label: string }[]>> = {
  food: [
    { page: "eat", href: "/eat", label: "Suggested" },
    { page: "plan", href: "/plan", label: "Plan" },
    { page: "prep", href: "/prep", label: "Cook plan" },
  ],
  kitchen: [
    { page: "pantry", href: "/pantry", label: "Pantry" },
    { page: "shopping", href: "/shopping", label: "Shopping" },
  ],
};

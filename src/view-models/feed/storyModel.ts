export interface StoryMeal {
  id: string;
  name: string;
  minutes: number;
  image?: string;
  kcal: number;
  protein: number;
  ready: boolean;
  readyText: string;
  /** "Tomorrow" when nothing is left today; empty otherwise. No meal names: the clock already chose. */
  when: string;
  /** The one main action, as on Home: cook when nothing blocks, else shop for what is missing. */
  actionText: string;
  actionDone: boolean;
  addMissing: () => Promise<void>;
  /** Only for today's meals. */
  toggle?: () => void;
}

export interface StoryPrep {
  id: string;
  action: string;
  /** "Tonight, for rajma chawal tomorrow". */
  sub: string;
  done: boolean;
  toggle: () => void;
}

export interface StoryChore {
  id: string;
  title: string;
  when: string;
  done: boolean;
  /** Epoch ms when "Start doing" was tapped this visit; null before. The timer reads the clock, not ticks. */
  startedAt: number | null;
  start: () => void;
  complete: () => void;
  undo: () => void;
}

/** A story ready to draw: the feed said which, the view-model bound the live data. */
export type StoryModel = { id: string; label: string; seen: boolean; tint: string } & (
  | { kind: "meal"; meal: StoryMeal }
  | { kind: "prep"; tasks: StoryPrep[] }
  | { kind: "chore"; chore: StoryChore }
  | { kind: "pantry"; rows: { id: string; name: string; qty: string }[]; listed: boolean; toggleList: () => void }
  | { kind: "plan"; notes: string[] }
);

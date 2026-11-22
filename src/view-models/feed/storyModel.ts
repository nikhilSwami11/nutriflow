export interface StoryMeal {
  id: string;
  meal: string;
  name: string;
  minutes: number;
  kcal: number;
  protein: number;
  ready: boolean;
  readyText: string;
  state: "eaten" | "next" | "later";
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
  | { kind: "chore"; chore: StoryChore }
  | { kind: "pantry"; rows: { id: string; name: string; qty: string }[]; listed: boolean; toggleList: () => void }
  | { kind: "plan"; notes: string[] }
);

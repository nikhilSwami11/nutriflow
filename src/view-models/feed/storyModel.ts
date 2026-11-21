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

/** A story ready to draw: the feed said which, the view-model bound the live data. */
export type StoryModel = { id: string; label: string; seen: boolean; tint: string } & (
  | { kind: "meal"; meal: StoryMeal }
  | { kind: "pantry"; rows: { id: string; name: string; qty: string }[]; listed: boolean; toggleList: () => void }
  | { kind: "plan"; notes: string[] }
);

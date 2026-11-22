import type { Chore, ChoreRepository } from "@/domain/chores";

export class InMemoryChoreRepository implements ChoreRepository {
  private items: Map<string, Chore>;
  constructor(seed: Chore[] = []) {
    this.items = new Map(seed.map((c) => [c.id, c]));
  }
  async list() {
    return [...this.items.values()];
  }
  async save(chore: Chore) {
    this.items.set(chore.id, chore);
  }
  async remove(id: string) {
    this.items.delete(id);
  }
}

/** The design's example chores. */
export const SEED_CHORES: Chore[] = [
  { id: "c-dishes", title: "Dishes after dinner", repeat: "daily", lastDone: null },
  { id: "c-counters", title: "Wipe the kitchen counters", repeat: "daily", lastDone: null },
  { id: "c-bathroom", title: "Clean the bathroom", repeat: "weekly", day: 6, lastDone: null },
  { id: "c-bins", title: "Take the bins out", repeat: "weekly", day: 4, lastDone: null },
];

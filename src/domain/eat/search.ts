/** Finds recipes by meaning ("something warm and spicy"). Implemented behind an edge function over a vector table. */
export interface RecipeSearch {
  /** Recipe ids with a similarity from 0 to 1, best first. */
  search(query: string): Promise<{ id: string; similarity: number }[]>;
}

const TIMEOUT_MS = 4000;
/** Below this the match is noise: embeddings of unrelated short texts still score a little. */
const MIN_SIMILARITY = 0.2;

/** Score boosts for the best three matches (3, 2, 1). Empty when search is missing, slow, down, or finds nothing close. */
export async function boostFromSearch(search: RecipeSearch | undefined, query: string): Promise<Record<string, number>> {
  if (!search || !query.trim()) return {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const found = await Promise.race([
      search.search(query),
      new Promise<never>((_, reject) => (timer = setTimeout(() => reject(new Error("search timed out")), TIMEOUT_MS))),
    ]);
    const good = found.filter((m) => m.similarity >= MIN_SIMILARITY).slice(0, 3);
    return Object.fromEntries(good.map((m, i) => [m.id, 3 - i]));
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}

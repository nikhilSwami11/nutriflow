import { foodKey as norm } from "./foodKey";
import type { PantryRepository, UtteranceParser } from "./ports";
import { clampQty } from "./quantity";
import type { ParsedItem, PantryItem } from "./types";

export interface AddDeps {
  repo: PantryRepository;
  parser: UtteranceParser;
  newId: () => string;
}


/** Step 1 of voice add: what did I hear? Nothing is saved. */
export const hearUtterance = (parser: UtteranceParser, text: string): Promise<ParsedItem[]> => parser.parse(text);

/**
 * Step 2 (user confirmed): merge heard items into the pantry, adding to an existing item or creating one.
 * New items default to "Dry goods", "pcs", lowAt 1 when the parser gives no hint.
 */
export async function addParsedItems(
  deps: Pick<AddDeps, "repo" | "newId">,
  parsed: ParsedItem[],
): Promise<PantryItem[]> {
  const items = await deps.repo.list();
  const changed = new Map<string, PantryItem>();

  for (const p of parsed) {
    if (!(p.qty > 0)) continue;
    const existing = [...items, ...changed.values()].find((i) => norm(i.name) === norm(p.name));
    if (existing) {
      changed.set(existing.id, { ...existing, qty: clampQty(existing.qty + p.qty) });
    } else {
      const created: PantryItem = {
        id: deps.newId(),
        name: p.name.trim(),
        group: p.group ?? "Dry goods",
        qty: p.qty,
        unit: p.unit ?? "pcs",
        lowAt: 1,
      };
      changed.set(created.id, created);
      items.push(created);
    }
  }
  const out = [...changed.values()];
  if (out.length) await deps.repo.save(out);
  return out;
}

export async function addItemsFromUtterance(deps: AddDeps, text: string): Promise<PantryItem[]> {
  return addParsedItems(deps, await hearUtterance(deps.parser, text));
}

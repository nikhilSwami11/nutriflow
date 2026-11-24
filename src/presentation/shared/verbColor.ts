/** The pastel chip behind a cooking verb, shared by the recipe page and the cook screen. */
const VERB: Record<string, string> = { Chop: "var(--peach)", Simmer: "var(--sky)", Stir: "var(--lavender)", "Sauté": "var(--butter)", Serve: "var(--mint)", Mix: "var(--lavender-soft)" };
export const verbColor = (verb: string) => VERB[verb] ?? "var(--lavender-soft)";

const TINTS = ["bg-peach", "bg-rose", "bg-butter", "bg-sky", "bg-lavender", "bg-mint"];

/** A steady pastel for a name, so the same item always looks the same. */
export const tint = (name: string): string => TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length];

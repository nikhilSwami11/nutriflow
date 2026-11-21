/** Quantities never go below zero. */
export const clampQty = (n: number): number => Math.max(0, n);

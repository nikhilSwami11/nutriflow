export interface CookStep {
  index: number;
  count: number;
  isFirst: boolean;
  isLast: boolean;
}

export const stepAt = (index: number, count: number): CookStep => {
  const i = Math.min(Math.max(0, index), Math.max(0, count - 1));
  return { index: i, count, isFirst: i === 0, isLast: i === count - 1 };
};

/** Next step, or null when the last step is done and it is time to finish. */
export const nextStep = (s: CookStep): CookStep | null => (s.isLast ? null : stepAt(s.index + 1, s.count));
export const prevStep = (s: CookStep): CookStep => stepAt(s.index - 1, s.count);

/** What to look for (always shown, one short card) and a tip (one tap away, so the step text stays the main thing). */
export function GuideCards({ look, tip }: { look: string; tip: string }) {
  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Look for" className="rounded-[20px] bg-panel p-4">
        <h3 className="m-0 text-xs font-medium text-muted">Look for</h3>
        <p className="m-0 mt-1 text-[15px] leading-normal">{look}</p>
      </section>
      <section aria-label="Tip" className="rounded-[20px] bg-panel px-4">
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-ink2 [&::-webkit-details-marker]:hidden">
            Tip
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform group-open:rotate-180"><path d="M6 9l6 6 6-6" /></svg>
          </summary>
          <p className="m-0 pb-4 text-[15px] leading-normal">{tip}</p>
        </details>
      </section>
    </div>
  );
}

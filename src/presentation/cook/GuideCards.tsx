/** What to look for and one tip, for the current step. Same two cards on every step so they are easy to find. */
export function GuideCards({ look, tip }: { look: string; tip: string }) {
  const card = "rounded-[20px] bg-panel p-4";
  const label = "m-0 text-xs font-medium text-muted";
  const text = "m-0 mt-1 text-[15px] leading-normal";
  return (
    <div className="flex flex-col gap-3">
      <section aria-label="Look for" className={card}>
        <h3 className={label}>Look for</h3>
        <p className={text}>{look}</p>
      </section>
      <section aria-label="Tip" className={card}>
        <h3 className={label}>Tip</h3>
        <p className={text}>{tip}</p>
      </section>
    </div>
  );
}

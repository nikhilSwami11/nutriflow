/** Grey card shapes while a screen's data loads, instead of a blank page or a spinner. */
export function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col gap-3 px-5 pt-4 lg:px-2">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={`skeleton rounded-[20px] bg-track ${i === 0 ? "h-40" : "h-20"}`} />
      ))}
    </div>
  );
}

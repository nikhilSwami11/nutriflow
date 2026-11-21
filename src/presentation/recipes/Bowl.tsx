export function Bowl({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M38 100h124a62 62 0 0 1-124 0z" fill="#FFFFFF" fillOpacity=".55" />
      <ellipse cx="100" cy="100" rx="62" ry="12" fill="#FFFFFF" fillOpacity=".8" />
    </svg>
  );
}

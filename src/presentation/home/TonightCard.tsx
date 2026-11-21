import type { HomeModel } from "@/view-models/home/useHome";

export function TonightCard({ t }: { t: HomeModel["tonight"] }) {
  return (
    <article aria-label="Tonight" className="mx-4 mt-4 flex shrink-0 flex-col gap-2.5 rounded-[20px] border border-line bg-bg px-5 py-[18px] lg:m-0">
      <div className="flex flex-wrap gap-2">
        {t.tags.map((tag, i) => (
          <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${i === 0 ? "bg-[#BFE5D2] text-onp" : "bg-track text-ink2"}`}>{tag}</span>
        ))}
      </div>
      <h2 className="m-0 text-xl font-medium tracking-[-0.01em]">{t.title}</h2>
      <p className="m-0 text-[13px] leading-[1.55] text-ink2">{t.blurb}</p>
      <div className="pt-0.5">
        <button type="button" className="touch rounded-full bg-ink px-[18px] text-[13px] font-medium text-bg hover:opacity-85">Start cooking</button>
      </div>
    </article>
  );
}

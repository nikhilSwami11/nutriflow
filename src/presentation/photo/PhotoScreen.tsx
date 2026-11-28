"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCapture } from "@/view-models/capture/store";
import { usePhotoFlow, type PhotoModel } from "@/view-models/photo/usePhotoFlow";
import { Bowl } from "../recipes/Bowl";

const circle = "absolute flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-onp";
const corner = "absolute h-7 w-7 border-ink";

function Viewfinder({ p, scanning }: { p: PhotoModel; scanning: boolean }) {
  const router = useRouter();
  const { openSheet, clearImage } = useCapture();
  const back = p.phase === "detect";
  return (
    <div className="relative h-[46dvh] shrink-0 overflow-hidden bg-panel">
      {p.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- a local object URL from the camera; next/image cannot optimise it
        <img src={p.imageUrl} alt="Your meal" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center pt-14" aria-label="Example meal" role="img"><Bowl size={250} /></div>
      )}
      {scanning && <div className="scan" aria-hidden="true" />}
      {scanning && (
        <>
          <span aria-hidden="true" className={`${corner} left-6 top-[84px] rounded-tl-lg border-l-[2.5px] border-t-[2.5px]`} />
          <span aria-hidden="true" className={`${corner} right-6 top-[84px] rounded-tr-lg border-r-[2.5px] border-t-[2.5px]`} />
          <span aria-hidden="true" className={`${corner} bottom-24 left-6 rounded-bl-lg border-b-[2.5px] border-l-[2.5px]`} />
          <span aria-hidden="true" className={`${corner} bottom-24 right-6 rounded-br-lg border-b-[2.5px] border-r-[2.5px]`} />
        </>
      )}
      <div className="absolute inset-0">
        {p.boxes.map((b) => (
          <div key={b.id} className="absolute" style={{ left: `${b.box.x * 100}%`, top: `${b.box.y * 100}%`, width: `${b.box.w * 100}%`, height: `${b.box.h * 100}%` }}>
            <div className="bx absolute inset-0 rounded-2xl border-2" style={{ borderColor: b.color, animationPlayState: p.phase === "detect" ? "running" : "paused" }} />
            <span className="absolute -left-0.5 -top-[26px] whitespace-nowrap rounded-full px-2.5 py-[3px] text-xs font-medium text-onp" style={{ background: b.color }}>{p.phase === "detect" ? b.label : b.labelWithAmount}</span>
          </div>
        ))}
      </div>
      {back ? (
        <Link href="/" aria-label="Close" className={`${circle} left-3 top-3.5`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></Link>
      ) : (
        <button type="button" onClick={p.toDetect} aria-label="Back" className={`${circle} left-3 top-3.5`}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
      )}
      <button type="button" onClick={() => { clearImage(); router.push("/"); openSheet(); }} className="absolute right-3 top-3.5 min-h-11 rounded-full bg-white/85 px-4 text-sm text-onp">Retake</button>
      <span className="absolute bottom-3.5 left-4 rounded-full bg-white/85 px-3.5 py-1.5 text-xs text-onp">{p.dish}, {p.confidence}% sure</span>
    </div>
  );
}

function Detect({ p }: { p: PhotoModel }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-6 pt-4">
      <div className="flex items-center justify-between">
        <div><h1 className="m-0 text-lg font-medium">What I can see</h1><p className="m-0 mt-0.5 text-xs text-muted">Tap to include or leave out.</p></div>
        <span className="rounded-full bg-track px-3 py-1 text-xs font-medium tabular-nums">{p.count}</span>
      </div>
      {p.source !== "vision" && <p role="note" className="m-0 rounded-2xl bg-butter px-3 py-2 text-xs text-onp">Photo recognition is not connected yet, so this is an example, not read from your photo.</p>}
      <div className="grid grid-cols-2 gap-2.5">
        {p.tiles.map((t) => (
          <button key={t.id} type="button" onClick={t.toggle} aria-pressed={t.on} className={`flex min-h-[72px] flex-col items-start justify-between gap-1.5 rounded-2xl border p-3 text-left ${t.on ? "border-transparent bg-mint text-onp" : "border-line2 bg-panel text-ink"}`}>
            <span className="flex w-full items-center justify-between gap-2"><span className="text-sm font-medium">{t.name}</span><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: t.color }} /></span>
            <span className="text-xs tabular-nums opacity-75">{t.sub}</span>
          </button>
        ))}
        <div className="relative">
          <button type="button" onClick={p.menu.toggle} aria-expanded={p.menu.open} aria-label="Add an item I missed" className="flex min-h-[72px] w-full flex-col items-start justify-between gap-1.5 rounded-2xl border-[1.5px] border-dashed border-line2 bg-transparent p-3 text-sm text-ink2">
            <span className="text-xl leading-none">+</span><span className="text-xs">Add item I missed</span>
          </button>
          {p.menu.open && (
            <ul role="menu" aria-label="Add an item" className="absolute bottom-full left-0 z-10 m-0 mb-2 w-44 list-none rounded-2xl border border-line bg-bg p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
              {p.menu.foods.map((f) => <li key={f.name} role="none"><button role="menuitem" type="button" onClick={f.add} className="touch w-full rounded-2xl px-3 text-left text-sm hover:bg-panel">{f.name}</button></li>)}
            </ul>
          )}
        </div>
      </div>
      {p.matchedText && <div className="text-xs leading-[1.4] text-ink2">{p.matchedText}</div>}
      <div className="flex-1" />
      <button type="button" onClick={p.toEstimate} disabled={!p.canEstimate} className="min-h-[52px] shrink-0 rounded-full bg-ink text-[15px] font-medium text-bg disabled:opacity-50">{p.cta}</button>
    </div>
  );
}

function Estimate({ p }: { p: PhotoModel }) {
  const e = p.estimate;
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="rail flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-2 pt-4">
        <div>
          <div className="flex flex-wrap items-baseline gap-2"><span aria-label={`${e.kcal} kilocalories`} className="text-[40px] font-light leading-none tracking-[-0.02em] tabular-nums">{e.kcal}</span><span className="text-sm text-muted">kcal, likely {e.low} to {e.high}</span></div>
          <div className="mt-1.5 text-xs leading-[1.4] text-ink2">{e.dayText}</div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {e.macros.map((m) => (
            <div key={m.label} className="flex flex-col gap-1.5"><span className="text-xs text-muted">{m.label}</span><span className="text-[15px] font-medium tabular-nums">{m.val}</span>
              <span className="block h-1.5 overflow-hidden rounded-[3px] bg-track"><span className="block h-full rounded-[3px] transition-[width] duration-300" style={{ width: `${m.pct}%`, background: m.color }} /></span></div>
          ))}
        </div>
        <div className="flex flex-col">
          {e.items.map((i) => (
            <div key={i.id} className="flex min-h-[52px] items-center gap-2.5 border-t border-line">
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: i.color }} />
              <span className="flex-1 text-sm">{i.name}</span>
              <button type="button" onClick={i.minus} aria-label={`Less ${i.name}`} className="h-11 w-11 bg-transparent p-0 text-xl">&minus;</button>
              <span className="min-w-[60px] text-center text-sm tabular-nums">{i.amount}</span>
              <button type="button" onClick={i.plus} aria-label={`More ${i.name}`} className="h-11 w-11 bg-transparent p-0 text-xl">+</button>
            </div>
          ))}
        </div>
        <div>
          <button type="button" onClick={e.toggleWhy} aria-expanded={e.why} className="min-h-11 bg-transparent p-0 text-sm text-ink2 underline underline-offset-[3px]">Why this estimate</button>
          {e.why && (
            <div className="flex flex-col gap-2 pb-2">
              {e.reasons.map((r) => <div key={r.text} className="flex items-start gap-2.5 text-sm leading-[1.45] text-ink2"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: r.color }} /><span>{r.text}</span></div>)}
            </div>
          )}
        </div>
        {p.error && <p role="alert" className="m-0 text-sm">{p.error}</p>}
      </div>
      <div className="flex shrink-0 gap-2.5 border-t border-line px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-2.5">
        <button type="button" onClick={p.toDetect} className="min-h-[52px] rounded-full border border-line2 px-5 text-[15px]">Wrong dish</button>
        <button type="button" onClick={() => void p.log()} className="min-h-[52px] flex-1 rounded-full bg-ink text-[15px] font-medium text-bg">Log it</button>
      </div>
    </div>
  );
}

function Logged({ p }: { p: PhotoModel }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-3.5 px-5 pt-4">
        <div role="status" className="flex flex-col gap-2 rounded-[20px] bg-ink p-6 text-bg">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-mint text-onp"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 12.5l4 4 8-9" /></svg></span>
          <div className="text-4xl font-light tracking-[-0.02em] tabular-nums">{p.logged?.kcal} kcal</div>
          <div className="text-sm">Logged for {p.logged?.slot}.</div>
        </div>
        <div className="rounded-[20px] border border-line px-4 py-3.5 text-sm leading-normal text-ink2">{p.rememberNote}</div>
        {p.error && <p role="alert" className="m-0 text-sm">{p.error}</p>}
      </div>
      <div className="flex shrink-0 gap-2.5 border-t border-line px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-2.5">
        <button type="button" onClick={() => void p.undo()} className="min-h-[52px] flex-1 rounded-full border border-line2 text-[15px] font-medium">Undo</button>
        <Link href="/" className="flex min-h-[52px] flex-1 items-center justify-center rounded-full bg-ink text-[15px] font-medium text-bg">Back to home</Link>
      </div>
    </div>
  );
}

export function PhotoScreen() {
  const p = usePhotoFlow();
  if (p.isLoading) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-[460px] flex-col bg-bg">
        <div className="relative h-[46dvh] overflow-hidden bg-panel" role="status" aria-label="Reading your meal"><div className="scan" aria-hidden="true" /></div>
        <p className="px-5 pt-4 text-sm text-muted">Looking at your meal</p>
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[460px] flex-col overflow-hidden bg-bg text-ink">
      <Viewfinder p={p} scanning={p.phase === "detect"} />
      {p.phase === "detect" ? <Detect p={p} /> : p.phase === "estimate" ? <Estimate p={p} /> : <Logged p={p} />}
    </div>
  );
}

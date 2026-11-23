// Cooking loops: one small kitchen scene per step verb (23), no loop borrowed by another verb.
// CSS lives in app/cook-motions.css, scoped under .cook-motion. Each scene's resting frame reads as a still picture (reduced motion).
import type { CSSProperties, ReactNode, JSX } from "react";
import { Bowl } from "../recipes/Bowl";

const BUTTER = "#F4E3A1", ROSE = "#F2A3A9", PEACH = "#F7C9BB", MINT = "#8FD3C0", SKY = "#9EC8F3", LAV = "#B9A7EE", WHITE = "#FFFFFF";
const ln = { stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round" } as const;
type Vars = CSSProperties & Record<`--${string}`, string>;

function Scene({ label, children }: { label: string; children: ReactNode }) {
  return <svg viewBox="0 0 200 200" width="100%" role="img" aria-label={label} style={{ display: "block", color: "var(--ink)", overflow: "hidden" }}>{children}</svg>;
}
const Shadow = ({ cx = 100, rx = 74 }: { cx?: number; rx?: number }) => <ellipse cx={cx} cy="188" rx={rx} ry="5" fill="currentColor" opacity=".06" />;

/** Bubbles, sparks, puffs: appear, grow, fade. */
function Pop({ d, dl = "0s", children }: { d: string; dl?: string; children: ReactNode }) {
  return <g className="pop" style={{ animationDuration: d, animationDelay: dl }}>{children}</g>;
}
/** Spatter, crumbs, falling flour: leave a spot and travel (dx, dy) while fading. */
function Fly({ dx, dy, d, dl = "0s", children }: { dx: string; dy: string; d: string; dl?: string; children: ReactNode }) {
  return <g className="fly" style={{ "--dx": dx, "--dy": dy, animationDuration: d, animationDelay: dl } as Vars}>{children}</g>;
}
function Steam({ xs, y }: { xs: number[]; y: number }) {
  return <>{xs.map((x, i) => <g key={x} className={`wisp w${(i % 2) + 1}`}><path d={`M${x} ${y}c-6-7 6-12 0-19s6-12 0-18`} fill="none" {...ln} strokeWidth="2.2" /></g>)}</>;
}
function Flames({ y, color = ROSE, xs = [76, 100, 124], small }: { y: number; color?: string; xs?: number[]; small?: boolean }) {
  return <>{xs.map((x, i) => (
    <g key={x} transform={`translate(${x} ${y})${small ? " scale(.75)" : ""}`}><g className={`flame fd${i % 3}`}>
      <path d="M0 0c-6 0-8-5-6-10 1-3 5-6 6-12 1 6 5 9 6 12 2 5 0 10-6 10z" fill={color} {...ln} strokeWidth="2" />
      <path d="M0-3c-2 0-3-2-2-4l2-5 2 5c1 2 0 4-2 4z" fill={BUTTER} />
    </g></g>
  ))}</>;
}
function Burner({ y, color, xs, small }: { y: number; color?: string; xs?: number[]; small?: boolean }) {
  return <><Flames y={y} color={color} xs={xs} small={small} /><rect x="46" y={y} width="108" height="7" rx="3.5" fill="var(--panel)" {...ln} strokeWidth="2.2" /><path d={`M56 ${y + 7}v9M144 ${y + 7}v9`} {...ln} strokeWidth="2.4" /></>;
}
function Board({ y, x = 14, w = 172 }: { y: number; x?: number; w?: number }) {
  return <>
    <rect x={x} y={y} width={w} height="16" rx="8" fill={BUTTER} {...ln} strokeWidth="2.5" />
    <path d={`M${x + 16} ${y + 8}h30M${x + 64} ${y + 8}h18M${x + 100} ${y + 8}h34`} {...ln} strokeWidth="2" opacity=".25" />
    <circle cx={x + w - 14} cy={y + 8} r="3" fill="var(--bg)" {...ln} strokeWidth="1.8" />
  </>;
}
/** A hand seen from above, palm down, fingers toward +y. */
function Hand({ x, y, flip, sleeve = LAV }: { x: number; y: number; flip?: boolean; sleeve?: string }) {
  return <g transform={`translate(${x} ${y})${flip ? " scale(-1 1)" : ""}`}>
    <path d="M-15-38h30l-2 30h-26z" fill={sleeve} {...ln} strokeWidth="2.4" />
    <path d="M-13-14h26" {...ln} strokeWidth="2" opacity=".3" />
    <path d="M-14-8h28v22c0 9-6 15-14 15s-14-6-14-15z" fill={PEACH} {...ln} strokeWidth="2.4" />
    <path d="M-7 20v8M0 22v8M7 20v8" {...ln} strokeWidth="2" opacity=".35" />
    <path d="M14 0c7 1 9 7 7 13" fill="none" {...ln} strokeWidth="2.4" />
  </g>;
}

function Chop() {
  return <Scene label="Knife chopping a carrot into coins on a board">
    <Shadow rx={88} />
    <Board y={144} x={8} w={184} />
    <rect x="22" y="137" width="22" height="7" rx="3.5" fill={PEACH} {...ln} strokeWidth="2.2" />
    <rect x="42" y="137" width="22" height="7" rx="3.5" fill={PEACH} {...ln} strokeWidth="2.2" />
    <rect x="30" y="130" width="22" height="7" rx="3.5" fill={PEACH} {...ln} strokeWidth="2.2" transform="rotate(-6 41 133)" />
    <rect x="58" y="131" width="22" height="7" rx="3.5" fill={PEACH} {...ln} strokeWidth="2.2" transform="rotate(9 69 134)" />
    <path d="M40 133v4M50 126v4M66 130v4" stroke={BUTTER} strokeWidth="2.4" strokeLinecap="round" />
    <g className="ch-carrot">
      <path d="M186 124c4-12 2-22-4-28M190 128c8-8 10-18 8-26" fill="none" stroke={MINT} strokeWidth="5" strokeLinecap="round" />
      <path d="M186 124c4-12 2-22-4-28M190 128c8-8 10-18 8-26" fill="none" {...ln} strokeWidth="1.6" opacity=".5" />
      <path d="M104 118h70c10 0 18 6 18 13s-8 13-18 13h-70z" fill={PEACH} {...ln} strokeWidth="2.5" />
      <path d="M126 124v6M148 136v-5M170 123v7" {...ln} strokeWidth="2" opacity=".35" />
      <path d="M116 126h40" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".6" />
    </g>
    <g className="ch-coin"><rect x="96" y="118" width="8" height="26" rx="3" fill={PEACH} {...ln} strokeWidth="2.5" /><path d="M100 124v14" stroke={BUTTER} strokeWidth="2.4" strokeLinecap="round" /></g>
    <g className="ch-hit"><path d="M92 112l-8-6M90 124l-10-1M124 110l7-7" {...ln} strokeWidth="2.4" /></g>
    <g className="ch-knife">
      <path d="M104 144l10-3 2-45h-10z" fill="var(--bg)" {...ln} strokeWidth="2.5" />
      <path d="M108.5 136l1.5-34" {...ln} strokeWidth="1.8" opacity=".3" />
      <rect x="104" y="90" width="13" height="7" rx="2" fill="var(--panel)" {...ln} strokeWidth="2.4" />
      <rect x="103.5" y="58" width="14" height="33" rx="6" fill={LAV} {...ln} strokeWidth="2.5" />
      <circle cx="110.5" cy="68" r="1.8" fill="currentColor" /><circle cx="110.5" cy="80" r="1.8" fill="currentColor" />
    </g>
  </Scene>;
}

function Stir() {
  return <Scene label="Spoon stirring a pot of dal on the stove">
    <Shadow rx={70} />
    <Steam xs={[84, 116]} y={70} />
    <Fly dx="18px" dy="44px" d="1.8s"><circle cx="58" cy="44" r="2.4" fill={ROSE} {...ln} strokeWidth="1.4" /></Fly>
    <Fly dx="22px" dy="46px" d="1.8s" dl=".15s"><circle cx="54" cy="50" r="2" fill={BUTTER} {...ln} strokeWidth="1.4" /></Fly>
    <Fly dx="16px" dy="40px" d="1.8s" dl=".3s"><circle cx="62" cy="48" r="2" fill={ROSE} {...ln} strokeWidth="1.4" /></Fly>
    <Burner y={172} xs={[60, 100, 140]} />
    <path d="M44 98v42c0 17 13 30 30 30h52c17 0 30-13 30-30V98z" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <path d="M54 112v28c0 10 6 18 14 20" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <path d="M44 108c-10 0-14 4-14 9s4 9 14 9M156 108c10 0 14 4 14 9s-4 9-14 9" fill="none" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="98" rx="56" ry="12" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="100" rx="49" ry="8.5" fill={BUTTER} />
    <g transform="translate(100 100) scale(1 .17)"><g className="swirl">
      <path d="M-34 0A34 34 0 0 1 0-34M34 0A34 34 0 0 1 0 34" fill="none" {...ln} strokeWidth="9" opacity=".35" />
      <circle cx="20" cy="-14" r="7" fill={ROSE} /><circle cx="-20" cy="14" r="7" fill={MINT} /><circle cx="-6" cy="-26" r="6" fill={ROSE} /><circle cx="6" cy="26" r="6" fill={MINT} />
    </g></g>
    <Pop d="1.2s"><circle cx="70" cy="99" r="3" fill={WHITE} {...ln} strokeWidth="1.6" /></Pop>
    <Pop d="1.2s" dl=".6s"><circle cx="132" cy="101" r="3" fill={WHITE} {...ln} strokeWidth="1.6" /></Pop>
    <g className="sp-y"><g className="sp-x">
      <path d="M101 101L140 34" {...ln} strokeWidth="8" /><path d="M101 101L140 34" stroke={PEACH} strokeWidth="3.6" strokeLinecap="round" />
      <ellipse cx="100" cy="103" rx="10" ry="5.5" fill={PEACH} {...ln} strokeWidth="2.4" />
    </g></g>
    <path d="M51 100a49 8.5 0 0 0 98 0z" fill={BUTTER} />
    <path d="M44 98a56 12 0 0 0 112 0" fill="none" {...ln} strokeWidth="2.5" />
  </Scene>;
}

function Mix() {
  return <Scene label="Cup pouring flour while a spatula folds batter in a mixing bowl">
    <Shadow rx={64} />
    <g className="mx-cup">
      <path d="M26 34h32l-4 28H30z" fill="var(--panel)" {...ln} strokeWidth="2.4" />
      <ellipse cx="42" cy="36" rx="14" ry="3.5" fill={WHITE} {...ln} strokeWidth="1.8" />
      <path d="M27 42c-8 0-11 4-11 8s3 8 11 8" fill="none" {...ln} strokeWidth="2.4" />
      <path d="M36 44v12M42 44v8" stroke={ROSE} strokeWidth="2.6" strokeLinecap="round" />
    </g>
    {[0, 0.12, 0.24, 0.36].map((dl, i) => (
      <g key={dl} className="mx-fl" style={{ animationDelay: `${dl}s` }}><circle cx={68 + i * 2} cy="58" r="2.6" fill={WHITE} {...ln} strokeWidth="1.5" /></g>
    ))}
    <rect x="72" y="166" width="56" height="10" rx="5" fill={SKY} {...ln} strokeWidth="2.4" />
    <path d="M34 104h132c0 38-28 66-66 66s-66-28-66-66z" fill={SKY} {...ln} strokeWidth="2.5" />
    <path d="M48 118c4 22 16 36 30 42" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <path d="M42 134c32 10 84 10 116 0" fill="none" {...ln} strokeWidth="2" opacity=".2" />
    <ellipse cx="100" cy="104" rx="66" ry="12" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="106" rx="58" ry="8.5" fill={BUTTER} />
    <g transform="translate(100 106) scale(1 .16)"><g className="swirl mx-sw">
      <circle r="46" fill="none" />
      <path d="M-30-10C-20-34 20-36 32-12S10 30-8 20" fill="none" stroke={PEACH} strokeWidth="10" strokeLinecap="round" />
      <circle cx="22" cy="22" r="8" fill={WHITE} /><circle cx="-26" cy="18" r="7" fill={WHITE} />
      <circle cx="6" cy="-24" r="5" fill="currentColor" opacity=".7" /><circle cx="-14" cy="-6" r="5" fill="currentColor" opacity=".7" /><circle cx="30" cy="-2" r="4.5" fill="currentColor" opacity=".7" />
    </g></g>
    <g className="mx-puff"><path d="M72 102c-5 0-7-4-5-7-1-4 4-7 8-4 2-4 9-4 10 1 5 0 7 5 4 8z" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="mx-spat">
      <path d="M154 24L120 92" {...ln} strokeWidth="9" /><path d="M154 24L120 92" stroke={LAV} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M114 88c4-4 12-2 14 3l-3 16c-1 5-6 7-10 5l-6-3c-4-2-5-6-3-10z" fill={ROSE} {...ln} strokeWidth="2.4" />
      <g className="mx-dollop"><ellipse cx="117" cy="95" rx="7" ry="4" fill={BUTTER} {...ln} strokeWidth="1.8" /></g>
    </g>
    <path d="M42 106a58 8.5 0 0 0 116 0z" fill={BUTTER} />
    <path d="M34 104a66 12 0 0 0 132 0" fill="none" {...ln} strokeWidth="2.5" />
  </Scene>;
}

function Simmer() {
  return <Scene label="Covered pot simmering on a low flame">
    <Shadow rx={68} />
    <Steam xs={[92, 108]} y={56} />
    <Burner y={170} small xs={[80, 100, 120]} />
    <path d="M46 92v34c0 16 12 28 28 28h52c16 0 28-12 28-28V92z" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <path d="M56 104v22c0 8 5 14 12 16" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <path d="M60 132c14 4 66 4 80 0" fill="none" stroke={MINT} strokeWidth="4" strokeLinecap="round" />
    <path d="M46 102c-10 0-14 4-14 8s4 8 14 8M154 102c10 0 14 4 14 8s-4 8-14 8" fill="none" {...ln} strokeWidth="2.5" />
    <Pop d="2s" dl=".2s"><circle cx="52" cy="92" r="3" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <Pop d="2s" dl="1.1s"><circle cx="148" cy="92" r="3" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <g className="puff p1"><circle cx="50" cy="86" r="6" fill="var(--bg)" {...ln} strokeWidth="2" /></g>
    <g className="puff p2"><circle cx="150" cy="86" r="6" fill="var(--bg)" {...ln} strokeWidth="2" /></g>
    <g className="lid">
      <path d="M48 92c6-18 30-26 52-26s46 8 52 26z" fill={MINT} {...ln} strokeWidth="2.5" />
      <path d="M68 84c8-7 18-10 26-10" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <circle cx="126" cy="84" r="2" fill={WHITE} {...ln} strokeWidth="1.4" /><circle cx="134" cy="88" r="1.6" fill={WHITE} {...ln} strokeWidth="1.4" />
      <rect x="91" y="58" width="18" height="10" rx="5" fill={ROSE} {...ln} strokeWidth="2.4" />
      <path d="M42 92h116" {...ln} strokeWidth="2.5" />
    </g>
  </Scene>;
}

function Saute() {
  return <Scene label="Wooden spoon moving onions and peppers around a hot pan">
    <Shadow rx={80} />
    <Steam xs={[74, 124]} y={98} />
    <Burner y={168} />
    <g className="sa-pan">
      <path d="M36 117h120" stroke={BUTTER} strokeWidth="3" strokeLinecap="round" />
      <g className="sa-jig">
        <path d="M44 117a8 6 0 0 1 16 0M134 117a8 6 0 0 1 16 0" fill="none" {...ln} strokeWidth="6.5" />
        <path d="M44 117a8 6 0 0 1 16 0M134 117a8 6 0 0 1 16 0" fill="none" stroke={LAV} strokeWidth="3" strokeLinecap="round" />
        <rect x="70" y="111" width="14" height="6" rx="3" fill={ROSE} {...ln} strokeWidth="2.2" />
        <rect x="104" y="110" width="16" height="7" rx="3.5" fill={MINT} {...ln} strokeWidth="2.2" />
        <ellipse cx="126" cy="114" rx="5" ry="3.5" fill={BUTTER} {...ln} strokeWidth="2" />
      </g>
      <g className="sa-up sa-u1"><g className="sa-spin"><rect x="58" y="106" width="16" height="7" rx="3.5" fill={ROSE} {...ln} strokeWidth="2.2" /></g></g>
      <g className="sa-up sa-u2"><g className="sa-spin">
        <path d="M86 114a8 6 0 0 1 16 0" fill="none" {...ln} strokeWidth="6.5" /><path d="M86 114a8 6 0 0 1 16 0" fill="none" stroke={LAV} strokeWidth="3" strokeLinecap="round" />
      </g></g>
      <g className="sa-up sa-u3"><g className="sa-spin"><path d="M112 114c0-8 5-12 12-12 0 8-5 12-12 12z" fill={MINT} {...ln} strokeWidth="2.2" /></g></g>
    </g>
    <g className="sa-spoon">
      <path d="M88 114L54 36" {...ln} strokeWidth="8" /><path d="M88 114L54 36" stroke={PEACH} strokeWidth="3.6" strokeLinecap="round" />
      <ellipse cx="90" cy="116" rx="11" ry="5.5" transform="rotate(-24 90 116)" fill={PEACH} {...ln} strokeWidth="2.4" />
    </g>
    <g className="sa-pan">
      <path d="M30 118h126l-8 24c-2 5-6 8-12 8H50c-6 0-10-3-12-8z" fill={SKY} {...ln} strokeWidth="2.5" />
      <path d="M48 140h34" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".8" />
      <path d="M27 118h132" {...ln} strokeWidth="3" />
      <path d="M156 121l32-6c4-1 7 1 7 4s-2 5-5 6l-34 5z" fill={LAV} {...ln} strokeWidth="2.5" />
      <circle cx="161" cy="123" r="1.8" fill="currentColor" />
    </g>
    <Pop d=".8s"><circle cx="40" cy="113" r="3" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <Pop d=".8s" dl=".4s"><circle cx="152" cy="112" r="3" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <Fly dx="-12px" dy="-22px" d="1.6s" dl=".9s"><circle cx="48" cy="108" r="2.4" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <Fly dx="12px" dy="-24px" d="1.6s" dl="1.1s"><circle cx="144" cy="106" r="2.4" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
  </Scene>;
}

/** The recipe's own plate lands on a tinted mat, settles, steams and sparkles. */
function Plated({ tint, image }: { tint: string; image: string }) {
  return <Scene label="The finished dish set down on the table">
    <ellipse cx="100" cy="182" rx="70" ry="5" fill="currentColor" opacity=".06" />
    <circle cx="100" cy="112" r="74" fill={tint} />
    <g className="pl-wisp w1"><path d="M80 44c-6-7 6-12 0-19s6-12 0-18" fill="none" {...ln} strokeWidth="2.2" /></g>
    <g className="pl-wisp w2"><path d="M120 44c-6-7 6-12 0-19s6-12 0-18" fill="none" {...ln} strokeWidth="2.2" /></g>
    <g className="pl-dish"><image href={image} x="28" y="40" width="144" height="144" /></g>
    <g className="pl-sp pl-s1"><path d="M30 70v12M24 76h12" {...ln} strokeWidth="2.2" /></g>
    <g className="pl-sp pl-s2"><path d="M170 60v12M164 66h12" {...ln} strokeWidth="2.2" /></g>
    <g className="pl-sp pl-s3"><path d="M172 150v10M167 155h10" {...ln} strokeWidth="2.2" /></g>
  </Scene>;
}

function Serve({ tint, image }: { tint: string; image?: string }) {
  if (image) return <Plated tint={tint} image={image} />;
  return <Scene label="Ladle pouring curry over rice on a plate">
    <Shadow rx={84} />
    <Steam xs={[78, 118]} y={112} />
    <ellipse cx="100" cy="154" rx="80" ry="18" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="152" rx="60" ry="11" fill="var(--bg)" {...ln} strokeWidth="2" />
    <g className="sv-pool"><ellipse cx="100" cy="152" rx="52" ry="8.5" fill={tint} {...ln} strokeWidth="2" /></g>
    <path d="M70 150c0-16 13-26 30-26s30 10 30 26c-8 4-52 4-60 0z" fill={WHITE} {...ln} strokeWidth="2.4" />
    <path d="M86 136l4 2M100 130l4 1M112 138l4-2M94 144l4 1M118 146l3-2" {...ln} strokeWidth="1.8" opacity=".3" />
    <g className="sv-stream"><path d="M110 70c-2 18-5 38-6 56" fill="none" stroke={tint} strokeWidth="6" strokeLinecap="round" /><path d="M110 70c-2 18-5 38-6 56" fill="none" {...ln} strokeWidth="1.4" opacity=".3" /></g>
    <g className="sv-leaf"><path d="M100 126c0-10 7-16 15-16 0 10-7 16-15 16z" fill={MINT} {...ln} strokeWidth="2.3" /><path d="M101 125l8-9" {...ln} strokeWidth="1.8" opacity=".4" /></g>
    <g className="sv-ladle">
      <path d="M178 26L146 78" {...ln} strokeWidth="8" /><path d="M178 26L146 78" stroke={LAV} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M126 80c0 10 8 16 18 16s16-6 16-14z" fill="var(--panel)" {...ln} strokeWidth="2.4" />
      <ellipse cx="143" cy="81" rx="17" ry="4" fill={tint} {...ln} strokeWidth="2" />
    </g>
  </Scene>;
}

function Bake() {
  return <Scene label="Muffins rising in a warm oven">
    <g className="bk-heat"><path d="M74 40c-5-6 5-10 0-16s5-10 0-15" fill="none" {...ln} strokeWidth="2.2" /></g>
    <g className="bk-heat bk-h2"><path d="M100 40c-5-6 5-10 0-16s5-10 0-15" fill="none" {...ln} strokeWidth="2.2" /></g>
    <g className="bk-heat bk-h3"><path d="M126 40c-5-6 5-10 0-16s5-10 0-15" fill="none" {...ln} strokeWidth="2.2" /></g>
    <Shadow rx={78} />
    <rect x="28" y="44" width="144" height="132" rx="14" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <path d="M28 72h144" {...ln} strokeWidth="2.5" />
    <g className="bk-knob"><circle cx="48" cy="58" r="7" fill={ROSE} {...ln} strokeWidth="2.2" /><path d="M48 58v-5" {...ln} strokeWidth="2.2" /></g>
    <circle cx="68" cy="58" r="7" fill={SKY} {...ln} strokeWidth="2.2" /><path d="M68 58h4" {...ln} strokeWidth="2.2" />
    <rect x="104" y="52" width="52" height="12" rx="6" fill="var(--bg)" {...ln} strokeWidth="2.2" />
    <g className="bk-led"><path d="M114 58h8M126 58h8M138 58h8" stroke={ROSE} strokeWidth="3" strokeLinecap="round" /></g>
    <rect x="46" y="80" width="108" height="6" rx="3" fill="var(--bg)" {...ln} strokeWidth="2.2" />
    <rect x="44" y="94" width="112" height="70" rx="8" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <rect className="bk-glow" x="48" y="98" width="104" height="62" rx="5" fill={BUTTER} opacity=".5" />
    <path d="M52 152h96" {...ln} strokeWidth="2.4" />
    {[72, 100, 128].map((x, i) => (
      <g key={x}>
        <g className={`bk-rise bk-r${i}`} style={{ transformOrigin: `${x}px 138px` }}>
          <path d={`M${x - 14} 138c0-10 6-16 14-16s14 6 14 16z`} fill={PEACH} {...ln} strokeWidth="2.3" />
          <circle cx={x - 3} cy="128" r="1.6" fill="currentColor" opacity=".5" /><circle cx={x + 5} cy="131" r="1.6" fill="currentColor" opacity=".5" />
        </g>
        <path d={`M${x - 13} 138h26l-3 14h-20z`} fill={i === 1 ? LAV : ROSE} {...ln} strokeWidth="2.3" />
        <path d={`M${x - 6} 141l1 8M${x + 6} 141l-1 8`} {...ln} strokeWidth="1.6" opacity=".35" />
      </g>
    ))}
    <path d="M52 104l10-6" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <g className="bk-mitt">
      <path d="M150 86v8" {...ln} strokeWidth="2" />
      <path d="M142 94h16v20c0 6-4 10-8 10s-8-4-8-10z" fill={ROSE} {...ln} strokeWidth="2.3" />
      <path d="M158 100c5 0 7 3 7 6s-2 6-7 6" fill={ROSE} {...ln} strokeWidth="2.3" />
      <path d="M142 100h16" {...ln} strokeWidth="1.8" opacity=".35" />
    </g>
  </Scene>;
}

function Toast() {
  return <Scene label="Toaster popping up two browned slices">
    <Shadow rx={80} />
    {[62, 112].map((x, i) => (
      <g key={x} className={`ts-sl${i ? " ts-s2" : ""}`}>
        <path d={`M${x} 106V86c-9-2-11-14-3-21 7-6 19-6 26 0 8 7 6 19-3 21v20z`} fill={BUTTER} {...ln} strokeWidth="2.5" />
        <path className="ts-brown" d={`M${x + 3} 104V88c-6-2-8-11-2-16 5-4 13-4 18 0 6 5 4 14-2 16v16z`} fill={PEACH} />
        <path d={`M${x + 6} 92c0-6 6-10 10-10`} fill="none" {...ln} strokeWidth="2" opacity=".3" />
      </g>
    ))}
    <Fly dx="-14px" dy="-18px" d="1.8s" dl=".5s"><circle cx="70" cy="92" r="2" fill={PEACH} {...ln} strokeWidth="1.4" /></Fly>
    <Fly dx="16px" dy="-20px" d="1.8s" dl=".55s"><circle cx="132" cy="90" r="2" fill={PEACH} {...ln} strokeWidth="1.4" /></Fly>
    <Fly dx="4px" dy="-24px" d="1.8s" dl=".6s"><circle cx="104" cy="94" r="1.8" fill={BUTTER} {...ln} strokeWidth="1.4" /></Fly>
    <path d="M38 150c-14 4-22 14-18 26 2 6 10 8 18 6" fill="none" {...ln} strokeWidth="2.2" />
    <rect x="38" y="100" width="124" height="66" rx="16" fill={SKY} {...ln} strokeWidth="2.5" />
    <rect x="56" y="106" width="40" height="5" rx="2.5" fill="currentColor" opacity=".3" />
    <rect x="104" y="106" width="40" height="5" rx="2.5" fill="currentColor" opacity=".3" />
    <g className="ts-glow"><rect x="56" y="106" width="40" height="5" rx="2.5" fill={ROSE} /><rect x="104" y="106" width="40" height="5" rx="2.5" fill={ROSE} /></g>
    <path d="M54 142h52" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <circle cx="136" cy="146" r="7" fill="var(--bg)" {...ln} strokeWidth="2.2" /><path d="M136 146l3-4" {...ln} strokeWidth="2" />
    <rect x="48" y="164" width="14" height="6" rx="3" fill="var(--panel)" {...ln} strokeWidth="2" /><rect x="138" y="164" width="14" height="6" rx="3" fill="var(--panel)" {...ln} strokeWidth="2" />
    <path d="M168 112v34" {...ln} strokeWidth="2.2" opacity=".35" />
    <g className="ts-lever"><rect x="160" y="112" width="16" height="9" rx="4.5" fill="var(--panel)" {...ln} strokeWidth="2.3" /></g>
  </Scene>;
}

function Blend() {
  return <Scene label="Blender whizzing strawberries and banana into a smoothie">
    <Shadow rx={78} />
    <g className="bl-jar">
      <path d="M66 50h68l-8 90H74z" fill="var(--panel)" {...ln} strokeWidth="2.5" />
      <path d="M71 90h58l-4 50H75z" fill={ROSE} />
      <ellipse cx="100" cy="90" rx="29" ry="6" fill={PEACH} />
      <g transform="translate(100 90) scale(1 .2)"><g className="swirl bl-sw">
        <path d="M-22 0A22 22 0 0 1 0-22M22 0A22 22 0 0 1 0 22" fill="none" {...ln} strokeWidth="7" opacity=".35" />
        <circle cx="14" cy="-10" r="5" fill={BUTTER} /><circle cx="-14" cy="10" r="5" fill={WHITE} />
      </g></g>
      <g transform="translate(100 116) scale(1 .5)"><g className="bl-orbit">
        <circle r="24" fill="none" />
        <path d="M18 -4c0-5 4-8 8-6 3 2 2 7-2 10-3 2-6 0-6-4z" fill={ROSE} {...ln} strokeWidth="2.6" />
        <circle cx="-20" cy="4" r="6" fill={BUTTER} {...ln} strokeWidth="2.6" />
        <circle cx="2" cy="-20" r="5" fill={BUTTER} {...ln} strokeWidth="2.6" />
        <path d="M-2 18c0-5 4-8 8-6 3 2 2 7-2 10-3 2-6 0-6-4z" fill={ROSE} {...ln} strokeWidth="2.6" />
      </g></g>
      <path d="M74 140l-8-90h68l-8 90" fill="none" {...ln} strokeWidth="2.5" />
      <path d="M76 60l5 60" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".6" />
      <path d="M126 64h6M127 80h5M128 96h5" {...ln} strokeWidth="2" opacity=".4" />
      <g transform="translate(100 134) scale(1 .35)"><g className="bl-blade"><path d="M-18 0h36M0-10v20" {...ln} strokeWidth="5" /></g></g>
      <rect x="62" y="42" width="76" height="10" rx="5" fill={MINT} {...ln} strokeWidth="2.4" />
      <rect x="94" y="34" width="12" height="8" rx="3" fill={MINT} {...ln} strokeWidth="2.2" />
    </g>
    <Pop d=".9s"><circle cx="86" cy="86" r="2.6" fill={WHITE} {...ln} strokeWidth="1.4" /></Pop>
    <Pop d=".9s" dl=".45s"><circle cx="114" cy="85" r="2.2" fill={WHITE} {...ln} strokeWidth="1.4" /></Pop>
    <rect x="60" y="140" width="80" height="30" rx="9" fill={LAV} {...ln} strokeWidth="2.5" />
    <circle cx="88" cy="155" r="5" fill="var(--bg)" {...ln} strokeWidth="2.2" />
    <rect x="102" y="151" width="22" height="8" rx="4" fill="var(--bg)" {...ln} strokeWidth="2" />
    <g className="bl-led"><circle cx="88" cy="155" r="2" fill={MINT} /></g>
    <path d="M26 170c0-9 6-14 12-14s12 5 12 14z" fill={ROSE} {...ln} strokeWidth="2.3" />
    <path d="M32 158c2-4 6-6 6-6s4 2 6 6" fill={MINT} {...ln} strokeWidth="2" />
    <path d="M152 170c4-10 14-16 26-14-2 10-12 16-26 14z" fill={BUTTER} {...ln} strokeWidth="2.3" />
  </Scene>;
}

function Chill() {
  return <Scene label="Jar of overnight oats chilling on a fridge shelf">
    <rect x="24" y="22" width="152" height="156" rx="12" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <rect className="cl-light" x="30" y="28" width="140" height="144" rx="8" fill={SKY} opacity=".18" />
    <rect x="88" y="30" width="24" height="5" rx="2.5" fill={BUTTER} {...ln} strokeWidth="1.8" />
    <path d="M30 70h140M30 164h140" {...ln} strokeWidth="2.4" />
    <path d="M42 58h14v12H42zM60 54h12v16H60z" fill={MINT} {...ln} strokeWidth="2" />
    <path d="M140 46h14l2 24h-18z" fill={WHITE} {...ln} strokeWidth="2" /><path d="M142 46l2-6h6l2 6" fill={WHITE} {...ln} strokeWidth="2" />
    <g className="cl-fr"><circle cx="100" cy="76" r="3.5" fill={SKY} {...ln} strokeWidth="1.6" /></g>
    <g className="cl-fr cl-f2"><circle cx="50" cy="80" r="3.5" fill={SKY} {...ln} strokeWidth="1.6" /></g>
    <g className="cl-fr cl-f3"><circle cx="150" cy="78" r="3.5" fill={SKY} {...ln} strokeWidth="1.6" /></g>
    <g className="cl-air"><path d="M36 110c8-6 16 6 24 0" fill="none" stroke={SKY} strokeWidth="3" strokeLinecap="round" /></g>
    <g className="cl-air cl-a2"><path d="M140 128c8-6 16 6 24 0" fill="none" stroke={SKY} strokeWidth="3" strokeLinecap="round" /></g>
    <path d="M44 140v12M38 146h12M156 100v12M150 106h12" stroke={SKY} strokeWidth="3" strokeLinecap="round" />
    <g className="cl-jar">
      <path d="M72 96h56v56c0 7-5 12-12 12H84c-7 0-12-5-12-12z" fill="var(--bg)" {...ln} strokeWidth="2.5" />
      <path d="M76 122h48v30c0 5-4 9-9 9H85c-5 0-9-4-9-9z" fill={BUTTER} />
      <circle cx="90" cy="122" r="5" fill={ROSE} {...ln} strokeWidth="1.8" /><circle cx="104" cy="124" r="5" fill={LAV} {...ln} strokeWidth="1.8" /><circle cx="117" cy="122" r="4" fill={ROSE} {...ln} strokeWidth="1.8" />
      <path d="M72 96h56v56c0 7-5 12-12 12H84c-7 0-12-5-12-12z" fill="none" {...ln} strokeWidth="2.5" />
      <path d="M80 106l2 40" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <rect x="68" y="82" width="64" height="14" rx="6" fill={SKY} {...ln} strokeWidth="2.5" />
    </g>
  </Scene>;
}

function Whisk() {
  return <Scene label="Hand whisking eggs in a bowl">
    <Shadow rx={84} />
    <path d="M14 172c0-8 6-12 12-12s12 4 12 12l-4-3-4 4-4-4-4 4-4-4z" fill={WHITE} {...ln} strokeWidth="2.2" />
    <path d="M160 168c0-7 6-12 12-12s12 5 12 12l-4-3-4 4-4-4-4 4-4-4z" fill={WHITE} {...ln} strokeWidth="2.2" transform="rotate(-14 172 164)" />
    <path d="M40 106h120c0 36-24 62-60 62s-60-26-60-62z" fill={MINT} {...ln} strokeWidth="2.5" />
    <path d="M52 120c4 18 14 30 26 36" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <ellipse cx="100" cy="106" rx="60" ry="10" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="108" rx="52" ry="7" fill={BUTTER} />
    <g className="wh-foam"><path d="M70 106c2-4 6-4 8 0 2-4 6-4 8 0M114 107c2-4 6-4 8 0 2-4 6-4 8 0" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" /></g>
    <g className="wh-whisk">
      <path d="M97 66C78 82 78 100 96 110M103 66c19 16 19 34 1 44M100 66c-7 16-7 30 0 44M100 66c7 16 7 30 0 44" fill="none" {...ln} strokeWidth="2.2" />
      <rect x="94" y="58" width="12" height="8" rx="2" fill="var(--panel)" {...ln} strokeWidth="2.2" />
      <rect x="93" y="30" width="14" height="30" rx="6" fill={LAV} {...ln} strokeWidth="2.4" />
      <path d="M88 36c0-6 5-10 12-10s12 4 12 10v14c0 5-5 8-12 8s-12-3-12-8z" fill={PEACH} {...ln} strokeWidth="2.4" />
      <path d="M92 42h16M92 48h16" {...ln} strokeWidth="1.8" opacity=".35" />
      <path d="M90 28l-2-28h24l-2 28" fill={LAV} {...ln} strokeWidth="2.4" />
    </g>
    <path d="M48 108a52 7 0 0 0 104 0z" fill={BUTTER} />
    <path d="M40 106a60 10 0 0 0 120 0" fill="none" {...ln} strokeWidth="2.5" />
    <Pop d=".6s"><circle cx="68" cy="106" r="3.5" fill={WHITE} {...ln} strokeWidth="1.8" /></Pop>
    <Pop d=".6s" dl=".2s"><circle cx="132" cy="108" r="3.5" fill={WHITE} {...ln} strokeWidth="1.8" /></Pop>
    <Pop d=".6s" dl=".4s"><circle cx="118" cy="103" r="3" fill={WHITE} {...ln} strokeWidth="1.8" /></Pop>
    <Fly dx="-14px" dy="-18px" d="1.2s" dl=".2s"><circle cx="64" cy="100" r="2.2" fill={BUTTER} {...ln} strokeWidth="1.4" /></Fly>
    <Fly dx="14px" dy="-16px" d="1.2s" dl=".8s"><circle cx="136" cy="100" r="2.2" fill={BUTTER} {...ln} strokeWidth="1.4" /></Fly>
  </Scene>;
}

function Fry() {
  return <Scene label="Two eggs frying in a pan while a spatula nudges them">
    <Shadow rx={80} />
    <Burner y={170} />
    <path d="M32 140l-24-4c-4-1-7 2-7 5s2 5 5 5l26 2z" fill={LAV} {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="140" rx="70" ry="24" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="140" rx="60" ry="17" fill={BUTTER} opacity=".5" {...ln} strokeWidth="2" />
    <path d="M58 140c0-9 9-14 20-14 7-2 18 2 23 7 5 7 1 16-7 19-9 4-18 2-25-2-7-3-11-6-11-10z" fill={WHITE} {...ln} strokeWidth="2.3" />
    <circle cx="80" cy="138" r="8" fill={BUTTER} {...ln} strokeWidth="2.2" /><circle cx="77" cy="135" r="2.2" fill={WHITE} opacity=".8" />
    <path d="M106 136c0-8 8-12 17-12 8 0 17 4 17 11s-8 12-17 12-17-4-17-11z" fill={WHITE} {...ln} strokeWidth="2.3" />
    <circle cx="124" cy="135" r="7" fill={BUTTER} {...ln} strokeWidth="2.2" />
    <Pop d="1.2s"><circle cx="48" cy="140" r="4" fill="var(--bg)" {...ln} strokeWidth="1.8" /></Pop>
    <Pop d="1.2s" dl=".4s"><circle cx="146" cy="146" r="4" fill="var(--bg)" {...ln} strokeWidth="1.8" /></Pop>
    <Pop d="1.2s" dl=".8s"><circle cx="104" cy="152" r="3.5" fill="var(--bg)" {...ln} strokeWidth="1.8" /></Pop>
    <Fly dx="-14px" dy="-26px" d="1.2s"><circle cx="60" cy="122" r="2.6" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <Fly dx="8px" dy="-30px" d="1.2s" dl=".3s"><circle cx="100" cy="120" r="2.6" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <Fly dx="16px" dy="-22px" d="1.2s" dl=".7s"><circle cx="140" cy="124" r="2.6" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <g className="fr-zz"><path d="M52 104l-4-8M90 98v-9M128 104l4-8" {...ln} strokeWidth="2.4" /></g>
    <g className="fr-spat">
      <path d="M196 64L156 116" {...ln} strokeWidth="8" /><path d="M196 64L156 116" stroke={PEACH} strokeWidth="3.6" strokeLinecap="round" />
      <path d="M150 112l14 10-10 14-18-6z" fill="var(--panel)" {...ln} strokeWidth="2.4" />
      <path d="M150 120l6 4M146 126l6 3" {...ln} strokeWidth="1.6" opacity=".4" />
    </g>
  </Scene>;
}

function Boil() {
  return <Scene label="Spaghetti in a big pot at a rolling boil">
    <Shadow rx={68} />
    <g className="bo-cloud"><path d="M72 46c-7 0-10-6-6-10-2-7 6-11 11-7 3-6 13-6 15 1 7-1 10 7 5 11 2 4-1 7-5 7z" fill="var(--bg)" {...ln} strokeWidth="2" /></g>
    <g className="bo-cloud bo-c2"><path d="M114 40c-6 0-9-5-5-9-1-6 5-9 10-6 3-5 11-5 13 1 6-1 9 6 4 9 2 4-1 6-4 6z" fill="var(--bg)" {...ln} strokeWidth="2" /></g>
    <Burner y={170} color={SKY} />
    <path d="M50 86v62c0 10 8 18 18 18h64c10 0 18-8 18-18V86z" fill={LAV} {...ln} strokeWidth="2.5" />
    <path d="M60 100v42c0 6 3 10 8 12" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <path d="M50 98H40c-4 0-6 3-6 6s2 6 6 6h10M150 98h10c4 0 6 3 6 6s-2 6-6 6h-10" fill="none" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="86" rx="50" ry="10" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <g className="bo-w"><ellipse cx="100" cy="88" rx="43" ry="7" fill={SKY} /></g>
    <g className="bo-pasta">
      <path d="M108 88L146 30M116 89L158 38M100 88L130 26" fill="none" {...ln} strokeWidth="5.5" />
      <path d="M108 88L146 30M116 89L158 38M100 88L130 26" fill="none" stroke={BUTTER} strokeWidth="2.6" strokeLinecap="round" />
    </g>
    <g className="bo-bub"><circle cx="72" cy="88" r="4.5" fill={WHITE} {...ln} strokeWidth="1.9" /></g>
    <g className="bo-bub bo-b2"><circle cx="92" cy="90" r="5.5" fill={WHITE} {...ln} strokeWidth="1.9" /></g>
    <g className="bo-bub bo-b3"><circle cx="128" cy="88" r="4" fill={WHITE} {...ln} strokeWidth="1.9" /></g>
    <g className="bo-foam"><circle cx="60" cy="86" r="5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="bo-foam bo-fm2"><circle cx="140" cy="86" r="5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <Fly dx="-10px" dy="-22px" d="1.2s"><circle cx="80" cy="80" r="2.4" fill={SKY} {...ln} strokeWidth="1.5" /></Fly>
    <Fly dx="10px" dy="-20px" d="1.2s" dl=".6s"><circle cx="120" cy="80" r="2.4" fill={SKY} {...ln} strokeWidth="1.5" /></Fly>
    <path d="M50 86a50 10 0 0 0 100 0" fill="none" {...ln} strokeWidth="2.5" />
  </Scene>;
}

function Mash() {
  return <Scene label="Hand pressing a masher into hot potatoes">
    <Shadow rx={70} />
    <Steam xs={[60, 140]} y={92} />
    <path d="M40 106h120c0 34-24 58-60 58s-60-24-60-58z" fill={ROSE} {...ln} strokeWidth="2.5" />
    <path d="M52 120c4 16 14 28 26 32" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <ellipse cx="100" cy="106" rx="60" ry="10" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <g className="ms-food">
      <path d="M52 106C52 90 74 80 100 80S148 90 148 106A48 9 0 0 1 52 106z" fill={BUTTER} {...ln} strokeWidth="2.3" />
      <path d="M76 98l5 3M104 90l5 3M122 100l5 2M92 104l4-3" {...ln} strokeWidth="2" opacity=".3" />
      <g className="ms-butter"><rect x="62" y="84" width="14" height="9" rx="2" fill={WHITE} {...ln} strokeWidth="2" /></g>
    </g>
    <g className="ms-ch"><circle cx="56" cy="98" r="5" fill={BUTTER} {...ln} strokeWidth="2" /></g>
    <g className="ms-ch ms-c2"><circle cx="144" cy="98" r="5" fill={BUTTER} {...ln} strokeWidth="2" /></g>
    <g className="ms-masher">
      <rect x="96" y="40" width="8" height="24" rx="3" fill="var(--panel)" {...ln} strokeWidth="2.3" />
      <rect x="68" y="62" width="64" height="10" rx="5" fill="var(--panel)" {...ln} strokeWidth="2.5" />
      <circle cx="84" cy="67" r="1.8" fill="currentColor" /><circle cx="100" cy="67" r="1.8" fill="currentColor" /><circle cx="116" cy="67" r="1.8" fill="currentColor" />
      <rect x="86" y="20" width="28" height="22" rx="10" fill={LAV} {...ln} strokeWidth="2.5" />
      <path d="M84 18c0-7 7-12 16-12s16 5 16 12v8c0 5-7 8-16 8s-16-3-16-8z" fill={PEACH} {...ln} strokeWidth="2.4" />
      <path d="M92 16v8M100 14v10M108 16v8" {...ln} strokeWidth="1.8" opacity=".35" />
    </g>
    <path d="M44 108a56 10 0 0 0 112 0" fill="none" {...ln} strokeWidth="2.5" />
  </Scene>;
}

function Grate() {
  return <Scene label="Hand sliding a carrot down a box grater">
    <Shadow rx={84} />
    <Board y={158} x={16} w={168} />
    <g className="gr-pile"><path d="M54 158c4-8 10-10 14-6 4-6 12-6 16 0 4-4 10-2 12 6zM112 158c4-6 10-8 14-4 4-6 12-4 14 4z" fill={PEACH} {...ln} strokeWidth="2" /></g>
    <path d="M30 154l7-2M38 156l7-3M154 154l7-2M164 156l7-3" stroke={PEACH} strokeWidth="3" strokeLinecap="round" />
    <path d="M70 38h60l14 120H56z" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <path d="M82 38c0-16 36-16 36 0" fill="none" {...ln} strokeWidth="2.5" />
    <path d="M74 50l-4 98" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".8" />
    <path d="M82 62h8M100 62h8M116 62h8M80 82h8M98 82h8M116 82h8M78 102h8M96 102h8M114 102h8M76 122h8M94 122h8M112 122h8M74 142h8M92 142h8M110 142h8" {...ln} strokeWidth="2.4" opacity=".35" />
    <g className="gr-sh"><path d="M80 112l2 12M96 110l-1 12" {...ln} strokeWidth="5" /><path d="M80 112l2 12M96 110l-1 12" stroke={PEACH} strokeWidth="2.4" strokeLinecap="round" /></g>
    <g className="gr-sh gr-s2"><path d="M110 112l1 12M124 110l2 12" {...ln} strokeWidth="5" /><path d="M110 112l1 12M124 110l2 12" stroke={PEACH} strokeWidth="2.4" strokeLinecap="round" /></g>
    <g className="gr-blk">
      <rect x="82" y="56" width="36" height="22" rx="7" fill={PEACH} {...ln} strokeWidth="2.5" />
      <path d="M92 63v8M104 65v6" {...ln} strokeWidth="2" opacity=".35" />
      <path d="M90 60h16" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    </g>
  </Scene>;
}

function Knead() {
  return <Scene label="Two hands kneading dough on a floured board">
    <Shadow rx={86} />
    <Board y={152} />
    <circle cx="32" cy="148" r="2.4" fill={WHITE} {...ln} strokeWidth="1.5" /><circle cx="44" cy="150" r="2" fill={WHITE} {...ln} strokeWidth="1.5" />
    <circle cx="160" cy="149" r="2.4" fill={WHITE} {...ln} strokeWidth="1.5" /><circle cx="170" cy="147" r="2" fill={WHITE} {...ln} strokeWidth="1.5" />
    <g className="kn-dough">
      <path d="M46 152c0-24 24-38 54-38s54 14 54 38z" fill="var(--bg)" {...ln} strokeWidth="2.5" />
      <path d="M56 148c10-5 30-7 44-7s34 2 44 7" fill="none" stroke={BUTTER} strokeWidth="4" strokeLinecap="round" />
      <path d="M68 130c6-6 14-9 22-10" fill="none" {...ln} strokeWidth="2" opacity=".25" />
      <path d="M90 140c6 3 16 3 22-1" fill="none" {...ln} strokeWidth="2" opacity=".3" />
    </g>
    <g className="kn-puff"><circle cx="44" cy="142" r="5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="kn-puff kn-p2"><circle cx="156" cy="142" r="5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="kn-hl"><Hand x={73} y={84} /></g>
    <g className="kn-hr"><Hand x={127} y={84} flip /></g>
  </Scene>;
}

function Roll() {
  return <Scene label="Hands rolling a pin over dough on a floured board">
    <defs><clipPath id="ro-clip"><rect x="44" y="122" width="112" height="22" rx="11" /></clipPath></defs>
    <Shadow rx={86} />
    <Board y={152} />
    <circle cx="30" cy="148" r="2.4" fill={WHITE} {...ln} strokeWidth="1.5" /><circle cx="168" cy="148" r="2.4" fill={WHITE} {...ln} strokeWidth="1.5" />
    <g className="ro-dough"><ellipse cx="100" cy="148" rx="66" ry="12" fill="var(--bg)" {...ln} strokeWidth="2.5" /><ellipse cx="100" cy="150" rx="52" ry="6" fill="none" stroke={BUTTER} strokeWidth="3" /></g>
    <g className="kn-puff"><circle cx="34" cy="140" r="4.5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="kn-puff kn-p2"><circle cx="166" cy="140" r="4.5" fill={WHITE} {...ln} strokeWidth="1.8" /></g>
    <g className="ro-pin">
      <rect x="44" y="122" width="112" height="22" rx="11" fill={PEACH} {...ln} strokeWidth="2.5" />
      <g clipPath="url(#ro-clip)"><g className="ro-grain"><path d="M48 112h104M48 120h104M48 128h104M48 136h104M48 144h104M48 152h104" {...ln} strokeWidth="2" opacity=".22" /></g></g>
      <path d="M56 127h40" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
      <g transform="translate(34 134) rotate(-90)"><path d="M-10-6h20v22c0 6-4 10-10 10s-10-4-10-10z" fill={PEACH} {...ln} strokeWidth="2.4" /><path d="M-6 10h12M-6 16h12" {...ln} strokeWidth="1.8" opacity=".35" /><path d="M-12-30h24l-2 24h-20z" fill={LAV} {...ln} strokeWidth="2.4" /></g>
      <g transform="translate(166 134) rotate(90)"><path d="M-10-6h20v22c0 6-4 10-10 10s-10-4-10-10z" fill={PEACH} {...ln} strokeWidth="2.4" /><path d="M-6 10h12M-6 16h12" {...ln} strokeWidth="1.8" opacity=".35" /><path d="M-12-30h24l-2 24h-20z" fill={LAV} {...ln} strokeWidth="2.4" /></g>
    </g>
  </Scene>;
}

function Top({ tint }: { tint: string }) {
  const bits: [number, number, string, number][] = [[88, 0, MINT, 0], [100, 4, BUTTER, 0.15], [94, 2, "currentColor", 0.3], [106, 0, MINT, 0.45], [98, 6, BUTTER, 0.6]];
  return <Scene label="Fingers sprinkling herbs and cheese over a bowl">
    <Shadow rx={72} />
    <path d="M38 118h124c0 32-26 54-62 54s-62-22-62-54z" fill={SKY} {...ln} strokeWidth="2.5" />
    <path d="M50 130c4 16 14 28 28 32" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <ellipse cx="100" cy="118" rx="62" ry="12" fill="var(--bg)" {...ln} strokeWidth="2.5" />
    <path d="M46 118c4-14 28-22 54-22s50 8 54 22c-14 6-94 6-108 0z" fill={tint} {...ln} strokeWidth="2.3" />
    <path d="M66 108c8-5 18-7 26-7" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".6" />
    <g className="tp-land"><path d="M76 110l4-2M118 106l4 2M96 104l3 3M132 112l3-2M64 114l3 1" stroke={MINT} strokeWidth="3.4" strokeLinecap="round" /><path d="M86 112h4M108 110h4M124 114h3" stroke={BUTTER} strokeWidth="3" strokeLinecap="round" /></g>
    {bits.map(([x, dx, c, dl]) => (
      <g key={dl} className="tp-bit" style={{ animationDelay: `${dl}s`, "--dx": `${dx}px` } as Vars}><circle cx={x} cy="62" r="2.4" fill={c} {...ln} strokeWidth="1.3" /></g>
    ))}
    <g className="tp-hand">
      <path d="M86 6h28l-2 26H88z" fill={LAV} {...ln} strokeWidth="2.4" />
      <path d="M86 32c0-4 6-6 14-6s14 2 14 6v12c0 6-4 10-8 12l-6 4-6-4c-4-2-8-6-8-12z" fill={PEACH} {...ln} strokeWidth="2.4" />
      <path d="M94 44l6 12 6-12" fill="none" {...ln} strokeWidth="2" opacity=".4" />
    </g>
  </Scene>;
}

function Assemble() {
  return <Scene label="Filling a tortilla with lettuce, tomato and cheese, then folding it">
    <Shadow rx={84} />
    <ellipse cx="100" cy="132" rx="84" ry="30" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="130" rx="64" ry="20" fill="var(--bg)" {...ln} strokeWidth="2" />
    <path d="M100 104a50 26 0 0 1 0 52z" fill={BUTTER} {...ln} strokeWidth="2.4" />
    <path d="M118 116l3 2M132 126l2 3M120 142l3-1" {...ln} strokeWidth="2" opacity=".3" />
    <g className="as-f as-f1"><path d="M106 120c8-6 18-4 22 2-6 6-16 8-22-2zM104 134c8-4 18-2 22 4-8 4-16 4-22-4z" fill={MINT} {...ln} strokeWidth="2" /></g>
    <g className="as-f as-f2"><circle cx="122" cy="128" r="6" fill={ROSE} {...ln} strokeWidth="2" /><circle cx="110" cy="142" r="5" fill={ROSE} {...ln} strokeWidth="2" /></g>
    <g className="as-f as-f3"><path d="M110 124l10 4M116 134l10 2M106 130l8 6M124 140l6-4" stroke={BUTTER} strokeWidth="3.4" strokeLinecap="round" /><path d="M110 124l10 4M116 134l10 2M106 130l8 6M124 140l6-4" {...ln} strokeWidth="1" opacity=".5" /></g>
    <g className="as-fold"><path d="M100 104a50 26 0 0 0 0 52z" fill={BUTTER} {...ln} strokeWidth="2.4" /><path d="M66 124l3 2M80 138l2-3" {...ln} strokeWidth="2" opacity=".3" /></g>
  </Scene>;
}

function Toss() {
  return <Scene label="Two salad servers tossing leaves in a bowl">
    <Shadow rx={80} />
    {([[70, MINT, "tl1"], [92, LAV, "tl2"], [112, MINT, "tl3"], [130, ROSE, "tl4"]] as const).map(([x, c, k]) => (
      <g key={k} className={`to-up ${k}`}><g className="sa-spin">
        {c === ROSE ? <circle cx={x} cy="104" r="6" fill={c} {...ln} strokeWidth="2.2" /> : <path d={`M${x - 8} 108c0-10 8-16 16-16 0 10-8 16-16 16z`} fill={c} {...ln} strokeWidth="2.2" />}
      </g></g>
    ))}
    <g className="to-l"><path d="M24 40l46 66" {...ln} strokeWidth="8" /><path d="M24 40l46 66" stroke={PEACH} strokeWidth="3.6" strokeLinecap="round" /><ellipse cx="72" cy="110" rx="10" ry="6" transform="rotate(55 72 110)" fill={PEACH} {...ln} strokeWidth="2.4" /></g>
    <g className="to-r"><path d="M176 40l-46 66" {...ln} strokeWidth="8" /><path d="M176 40l-46 66" stroke={PEACH} strokeWidth="3.6" strokeLinecap="round" /><path d="M124 104l4 12M130 102l4 12M136 100l4 12" {...ln} strokeWidth="2.6" /></g>
    <path d="M30 108h140c0 36-30 64-70 64s-70-28-70-64z" fill={BUTTER} {...ln} strokeWidth="2.5" />
    <path d="M44 122c6 20 18 34 34 40" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".7" />
    <path d="M40 132c34 12 86 12 120 0" fill="none" stroke={MINT} strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="100" cy="108" rx="70" ry="12" fill="none" {...ln} strokeWidth="2.5" />
    <path d="M46 106c6-8 16-10 22-4 6-8 18-8 22 0 6-8 18-6 22 0 6-6 18-6 22 2 6-4 12-2 16 4" fill={MINT} {...ln} strokeWidth="2.2" />
    <Fly dx="-6px" dy="-20px" d="1.6s" dl=".3s"><circle cx="84" cy="98" r="2" fill={BUTTER} {...ln} strokeWidth="1.3" /></Fly>
    <Fly dx="8px" dy="-22px" d="1.6s" dl=".5s"><circle cx="118" cy="96" r="2" fill={BUTTER} {...ln} strokeWidth="1.3" /></Fly>
  </Scene>;
}

function Slice() {
  return <Scene label="Bread knife sawing a loaf into slices">
    <Shadow rx={88} />
    <Board y={150} x={8} w={184} />
    <g className="sl-fall"><path d="M52 150v-34c0-8 4-12 8-12h2v46z" fill={BUTTER} {...ln} strokeWidth="2.3" /><path d="M54 112h6" stroke={PEACH} strokeWidth="3" strokeLinecap="round" /></g>
    <path d="M24 150l10-30 8 2-6 28zM38 150l10-32 8 2-6 30z" fill={BUTTER} {...ln} strokeWidth="2.3" />
    <path d="M64 150v-36c0-14 18-24 46-24s52 10 52 24v36z" fill={PEACH} {...ln} strokeWidth="2.5" />
    <path d="M64 114c0-10 6-16 10-16v52H64z" fill={BUTTER} {...ln} strokeWidth="2.3" />
    <path d="M90 100l8-6M112 96l8-6M134 100l8-6" {...ln} strokeWidth="2.2" opacity=".35" />
    <path d="M100 106c14-6 34-6 50 0" fill="none" stroke={WHITE} strokeWidth="3" strokeLinecap="round" opacity=".6" />
    <g className="sl-knife">
      <path d="M78 96l4 54h8l-4-54z" fill="var(--bg)" {...ln} strokeWidth="2.4" />
      <path d="M80 104l2 6 2-6 1 6 2-6" fill="none" {...ln} strokeWidth="1.6" opacity=".4" />
      <rect x="74" y="64" width="14" height="34" rx="6" fill={LAV} {...ln} strokeWidth="2.5" />
      <circle cx="81" cy="74" r="1.8" fill="currentColor" /><circle cx="81" cy="86" r="1.8" fill="currentColor" />
    </g>
    <Fly dx="-10px" dy="-12px" d="1.6s" dl=".2s"><circle cx="72" cy="140" r="1.8" fill={PEACH} {...ln} strokeWidth="1.3" /></Fly>
    <Fly dx="8px" dy="-14px" d="1.6s" dl=".9s"><circle cx="90" cy="142" r="1.8" fill={BUTTER} {...ln} strokeWidth="1.3" /></Fly>
  </Scene>;
}

function Sear() {
  return <Scene label="Tongs pressing a steak in a smoking hot pan">
    <Shadow rx={80} />
    <g className="se-smoke"><path d="M70 66c-7 0-10-6-6-10-2-7 6-11 11-7 3-6 13-6 15 1 7-1 10 7 5 11 2 4-1 7-5 7z" fill="var(--panel)" {...ln} strokeWidth="2" /></g>
    <g className="se-smoke se-s2"><path d="M116 58c-6 0-9-5-5-9-1-6 5-9 10-6 3-5 11-5 13 1 6-1 9 6 4 9 2 4-1 6-4 6z" fill="var(--panel)" {...ln} strokeWidth="2" /></g>
    <Burner y={170} />
    <path d="M32 140l-24-4c-4-1-7 2-7 5s2 5 5 5l26 2z" fill="currentColor" opacity=".8" />
    <ellipse cx="100" cy="140" rx="70" ry="24" fill={LAV} {...ln} strokeWidth="2.5" />
    <ellipse cx="100" cy="140" rx="60" ry="17" fill="var(--panel)" {...ln} strokeWidth="2" />
    <g className="se-steak">
      <path d="M66 138c0-12 14-18 34-18 22 0 36 6 36 16s-12 18-34 18c-22 0-36-6-36-16z" fill={ROSE} {...ln} strokeWidth="2.4" />
      <path d="M70 146c8 6 22 8 34 8 16 0 28-4 32-12" fill="none" stroke={PEACH} strokeWidth="5" strokeLinecap="round" />
      <g className="se-marks"><path d="M82 128l-8 14M98 126l-8 18M114 126l-8 18M128 128l-6 12" {...ln} strokeWidth="3.2" opacity=".55" /></g>
    </g>
    <Pop d="1s"><circle cx="58" cy="142" r="3.5" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <Pop d="1s" dl=".5s"><circle cx="144" cy="140" r="3.5" fill="var(--bg)" {...ln} strokeWidth="1.6" /></Pop>
    <Fly dx="-14px" dy="-24px" d="1.4s" dl=".2s"><circle cx="62" cy="126" r="2.4" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <Fly dx="14px" dy="-26px" d="1.4s" dl=".7s"><circle cx="140" cy="124" r="2.4" fill={BUTTER} {...ln} strokeWidth="1.5" /></Fly>
    <g className="se-tongs">
      <path d="M186 40l-70 82M192 48l-72 78" fill="none" {...ln} strokeWidth="6" />
      <path d="M186 40l-70 82M192 48l-72 78" fill="none" stroke="var(--panel)" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="176" y="34" width="22" height="14" rx="5" transform="rotate(40 187 41)" fill={ROSE} {...ln} strokeWidth="2.2" />
    </g>
  </Scene>;
}

function Roast() {
  return <Scene label="Tray of vegetables browning under the oven grill">
    <Shadow rx={84} />
    <rect x="18" y="30" width="164" height="144" rx="12" fill="var(--panel)" {...ln} strokeWidth="2.5" />
    <path className="ra-coil" d="M32 48c8-8 16 8 24 0s16 8 24 0 16 8 24 0 16 8 24 0 16 8 24 0 16 8 16 0" fill="none" stroke={ROSE} strokeWidth="4" strokeLinecap="round" />
    <path d="M32 48c8-8 16 8 24 0s16 8 24 0 16 8 24 0 16 8 24 0 16 8 24 0 16 8 16 0" fill="none" {...ln} strokeWidth="1.2" opacity=".4" />
    <g className="ra-heat"><path d="M60 70l-3 8 3 8M100 70l-3 8 3 8M140 70l-3 8 3 8" fill="none" {...ln} strokeWidth="2" /></g>
    <g transform="translate(-20 -22) scale(1.2)">
    <path d="M24 156h152M24 164h152" {...ln} strokeWidth="2" opacity=".35" />
    <path d="M30 150h140l-6 10H36z" fill="var(--bg)" {...ln} strokeWidth="2.4" />
    <g>
      <rect x="40" y="134" width="16" height="14" rx="4" fill={BUTTER} {...ln} strokeWidth="2.2" />
      <rect x="62" y="136" width="14" height="12" rx="4" fill={BUTTER} {...ln} strokeWidth="2.2" />
      <path d="M86 148v-8M86 140c-8 0-10-8-4-12 0-6 8-8 12-4 6-2 10 4 6 10-2 4-8 6-14 6z" fill={MINT} {...ln} strokeWidth="2.2" />
      <path d="M108 140h24c4 0 6 4 6 6s-2 4-6 4h-24z" fill={PEACH} {...ln} strokeWidth="2.2" transform="rotate(-8 120 145)" />
      <path d="M150 148v-8M150 140c-8 0-10-8-4-12 0-6 8-8 12-4 6-2 10 4 6 10-2 4-8 6-14 6z" fill={MINT} {...ln} strokeWidth="2.2" />
      <g className="ra-brown"><circle cx="46" cy="140" r="2" fill="currentColor" opacity=".45" /><circle cx="70" cy="142" r="2" fill="currentColor" opacity=".45" /><circle cx="118" cy="143" r="2" fill="currentColor" opacity=".45" /><circle cx="90" cy="132" r="1.8" fill="currentColor" opacity=".45" /></g>
    </g>
    <Pop d="1.3s"><circle cx="58" cy="128" r="2.6" fill="var(--bg)" {...ln} strokeWidth="1.5" /></Pop>
    <Pop d="1.3s" dl=".65s"><circle cx="136" cy="130" r="2.6" fill="var(--bg)" {...ln} strokeWidth="1.5" /></Pop>
    </g>
  </Scene>;
}

/** Which loop plays for which step verb. Every verb has its own scene. */
const BY_VERB: Record<string, (p: { tint: string; image?: string }) => JSX.Element> = {
  Chop, Stir, Mix, Simmer, "Sauté": Saute, Serve, Bake, Toast, Blend, Chill, Whisk, Fry, Boil, Mash, Grate, Knead, Roll,
  Top, Assemble, Toss, Slice, Sear, Roast,
};

export function CookMotion({ verb, tint = BUTTER, image }: { verb: string; tint?: string; image?: string }) {
  const Loop = BY_VERB[verb];
  return (
    <div className="cook-motion rounded-2xl bg-panel px-7 pb-2 pt-[18px]">
      {Loop ? <Loop tint={tint} image={image} /> : <div className="flex h-[200px] items-center justify-center"><Bowl size={110} /></div>}
    </div>
  );
}

/** The served plate on its own (Finish screen): same loop, no panel. */
export function ServedDish({ tint, image }: { tint: string; image?: string }) {
  return <div className="cook-motion w-44">{image ? <Plated tint={tint} image={image} /> : <Serve tint={tint} />}</div>;
}

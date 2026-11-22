"use client";
import { useEffect, useState } from "react";
import { useMediaQuery } from "@/presentation/shared/useMediaQuery";

// The food loop on the sign-in screen: decide, shop, cook, log. One 20s cycle, CSS only (app/loop-motion.css).
// Timing lives in the CSS; `--d` is an element's start time inside the cycle. Colours are the `--lp-*` set in that file.

type D = React.CSSProperties;
// Times below are written on a 12s scale; SLOW stretches them to the 20s cycle the CSS runs.
const SLOW = 20 / 12;
const sec = (s: number) => `${(s * SLOW).toFixed(3)}s`;
const at = (s: number): D => ({ "--d": sec(s) }) as D;

const Check = ({ x, y, r = 10 }: { x: number; y: number; r?: number }) => (
  <g>
    <circle cx={x} cy={y} r={r} fill="var(--mint)" />
    <path
      d={`M${x - r * 0.4} ${y} l${r * 0.3} ${r * 0.3} l${r * 0.5} -${r * 0.6}`}
      fill="none"
      stroke="var(--ink)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </g>
);

// Ingredients are drawn around 0,0; animations go on a wrapper so they never fight the SVG transform.
const Place = ({
  x,
  y,
  r = 0,
  s = 1,
  children,
}: {
  x: number;
  y: number;
  r?: number;
  s?: number;
  children: React.ReactNode;
}) => <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>{children}</g>;

const Leaf = () => (
  <>
    <path
      d="M-18 0 C-12 -11 12 -11 18 0 C12 7 -12 7 -18 0 Z"
      fill="var(--lp-leaf)"
      stroke="var(--lp-leaf-d)"
      strokeWidth="1"
    />
    <path
      d="M-13 0 H13 M-5 0 l-4 -4 M3 0 l-4 -4"
      fill="none"
      stroke="var(--lp-leaf-d)"
      strokeWidth="0.8"
      strokeLinecap="round"
    />
  </>
);

const Tomato = () => (
  <>
    <circle r="9" fill="var(--lp-tomato)" stroke="var(--lp-tomato-d)" strokeWidth="1" />
    <ellipse cx="-3.5" cy="-2" rx="2.4" ry="1.5" fill="#fff" opacity="0.55" />
    <path
      d="M-5 -8 L0 -6 L5 -8 L2 -10 L0 -13 L-2 -10 Z"
      fill="var(--lp-leaf)"
      stroke="var(--lp-leaf-d)"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </>
);

const Slice = () => (
  <>
    <circle r="8" fill="var(--lp-tomato)" stroke="var(--lp-tomato-d)" strokeWidth="1" />
    <circle r="5" fill="var(--lp-tomato-in)" />
    {[45, 135, 225, 315].map((a) => (
      <ellipse key={a} cx="2.6" rx="1.3" ry="0.7" fill="var(--lp-seed)" transform={`rotate(${a})`} />
    ))}
  </>
);

const Bread = () => (
  <>
    <path
      d="M-12 5 V-1 C-12 -10 12 -10 12 -1 V5 Z"
      fill="var(--lp-bread)"
      stroke="var(--lp-crust)"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M-6 -5 l3 3 M-1 -6 l3 3 M4 -5 l3 3"
      fill="none"
      stroke="var(--lp-crust)"
      strokeWidth="1"
      strokeLinecap="round"
    />
  </>
);

const Crouton = () => (
  <>
    <rect
      x="-3.5"
      y="-3.5"
      width="7"
      height="7"
      rx="1.5"
      fill="var(--lp-crouton)"
      stroke="var(--lp-crust)"
      strokeWidth="0.9"
    />
    <circle cx="-1" cy="-1" r="0.7" fill="var(--lp-crust)" />
  </>
);

const Cucumber = () => (
  <>
    <circle r="7" fill="var(--lp-cuke)" stroke="var(--lp-leaf-d)" strokeWidth="0.9" />
    <circle r="5" fill="var(--lp-cuke-in)" />
    <circle r="2.2" fill="none" stroke="var(--lp-cuke)" strokeWidth="1.2" />
  </>
);

const Onion = () => (
  <>
    <ellipse rx="7" ry="5" fill="none" stroke="var(--lp-onion)" strokeWidth="2.6" />
    <ellipse rx="7" ry="5" fill="none" stroke="var(--lp-onion-d)" strokeWidth="0.6" />
  </>
);

const Blueberry = () => (
  <>
    <circle r="3.6" fill="var(--lp-berry)" stroke="var(--lp-berry-d)" strokeWidth="0.8" />
    <path d="M-1 -1.4 h2" stroke="var(--lp-berry-d)" strokeWidth="0.8" strokeLinecap="round" />
  </>
);

const Strawberry = () => (
  <>
    <path
      d="M0 7 C-7 2 -7 -5 -3 -6 C-1 -6.5 1 -6.5 3 -6 C7 -5 7 2 0 7 Z"
      fill="var(--lp-straw)"
      stroke="var(--lp-tomato-d)"
      strokeWidth="0.9"
    />
    <path
      d="M-4 -6 L-1 -8 L0 -10 L1 -8 L4 -6"
      fill="var(--lp-leaf)"
      stroke="var(--lp-leaf-d)"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <circle cx="-2" cy="-1" r="0.7" fill="var(--lp-seed)" />
    <circle cx="2" cy="0" r="0.7" fill="var(--lp-seed)" />
    <circle cx="0" cy="3" r="0.7" fill="var(--lp-seed)" />
  </>
);

const PARTS = {
  leaf: Leaf,
  cucumber: Cucumber,
  onion: Onion,
  blueberry: Blueberry,
  strawberry: Strawberry,
  slice: Slice,
  crouton: Crouton,
};
type Item = { k: keyof typeof PARTS; x: number; y: number; r?: number; s?: number };

// Already in the pantry: greens, cucumber, onion and fruit. Tomatoes and croutons (the bread) come in while cooking.
const HAVE: Item[] = [
  { k: "leaf", x: 192, y: 119, r: -28, s: 0.7 },
  { k: "leaf", x: 248, y: 118, r: 26, s: 0.7 },
  { k: "leaf", x: 221, y: 115, s: 0.6 },
  { k: "cucumber", x: 204, y: 122, s: 0.85 },
  { k: "cucumber", x: 246, y: 125, s: 0.85 },
  { k: "onion", x: 232, y: 120, r: 20, s: 0.8 },
  { k: "strawberry", x: 236, y: 112, r: 12, s: 0.85 },
  { k: "blueberry", x: 184, y: 125 },
  { k: "blueberry", x: 216, y: 127 },
  { k: "blueberry", x: 259, y: 125 },
];
const ADDED: Item[] = [
  { k: "slice", x: 210, y: 114, s: 0.8 },
  { k: "slice", x: 226, y: 125, s: 0.8 },
  { k: "crouton", x: 197, y: 113, r: 20 },
  { k: "crouton", x: 240, y: 123, r: -15 },
  { k: "crouton", x: 252, y: 112, r: 10 },
];

const Food = ({ k, x, y, r, s }: Item) => {
  const Part = PARTS[k];
  return (
    <Place x={x} y={y} r={r} s={s}>
      <Part />
    </Place>
  );
};

// Pieces lift when the servers lift: same beat, a slightly different height and spin each so it reads as a toss.
const toss = (i: number): D =>
  ({
    "--h": `${-10 - ((i * 7) % 9)}px`,
    "--rot": `${((i * 37) % 40) - 20}deg`,
    "--t": `${(i % 3) * 0.03}s`,
  }) as D;

// The app's bowl: white, thin ink line. Back rim first, food in between, then the front wall hides what sits below the rim.
const BowlBack = () => (
  <ellipse cx="220" cy="124" rx="52" ry="11" fill="var(--lp-glaze)" stroke="var(--ink)" strokeWidth="1.2" />
);

const Bowl = () => (
  <>
    <path
      d="M168 124 A52 11 0 0 0 272 124 A52 38 0 0 1 168 124 Z"
      fill="var(--bg)"
      stroke="var(--ink)"
      strokeWidth="1.2"
    />
    <path d="M208 162 H232" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
  </>
);

const SaladBowl = ({ all = false }: { all?: boolean }) => (
  <>
    <BowlBack />
    {(all ? [...HAVE, ...ADDED] : HAVE).map((f, i) => (
      <Food key={i} {...f} />
    ))}
    <Bowl />
  </>
);

// Soft reveal and exit: a mask with blurred edges sweeps left to right, in at `d`, out at `o` (seconds into the cycle).
// The mask rect is 4w wide; at rest its transparent right quarter covers the text, mid-way its opaque middle does.
type WipeProps = {
  id: string;
  d: number;
  o: number;
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
};
const Wipe = ({ id, d, o, x, y, w, h, children }: WipeProps) => (
  <g mask={`url(#${id})`}>
    <mask id={id} maskUnits="userSpaceOnUse" x={x - 3 * w} y={y} width={4 * w} height={h}>
      <rect
        className="lp-mask"
        style={{ "--d": sec(d), "--o": sec(o), "--w": `${1.5 * w}px` } as D}
        x={x - 3 * w}
        y={y}
        width={4 * w}
        height={h}
        fill="url(#lp-soft-edge)"
      />
    </mask>
    {children}
  </g>
);

// Drawings leave with a short blur and fade at `o`; the scene's gate hides them right after.
const Out = ({ o, children }: { o: number; children: React.ReactNode }) => (
  <g className="lp-out" style={{ "--o": sec(o) } as D}>
    {children}
  </g>
);

const COOK_STEPS = [
  { c: "lp-s1", d: 6, o: 6.55, label: "Step 1 of 3 · Add tomatoes" },
  { c: "lp-s2", d: 7, o: 7.55, label: "Step 2 of 3 · Add croutons" },
  { c: "lp-s3", d: 8, o: 8.79, label: "Step 3 of 3 · Toss and serve" },
];

// Step 1 mirrors the "What should I eat?" screen: what it checks, then the best pick.
const CHECKS = [
  { y: 90, label: "Goal: eat lighter", at: 0.1 },
  { y: 130, label: "Calories left: 450", at: 0.35 },
  { y: 170, label: "Pantry: 6 things", at: 0.6 },
];

const Chip = ({
  id,
  x,
  w,
  label,
  icon,
}: {
  id: string;
  x: number;
  w: number;
  label: string;
  icon: React.ReactNode;
}) => (
  <g className={`lp-chip-${id}`}>
    <rect
      className="lp-chipfill"
      x={x}
      y="184"
      width={w}
      height="30"
      rx="15"
      stroke="var(--ink)"
      strokeWidth="1"
    />
    <Place x={x + 17} y={201} s={0.75}>
      {icon}
    </Place>
    <text x={x + 31} y="204" fontSize="14" fontWeight="500" fill="var(--ink)">
      {label}
    </text>
  </g>
);

// Log: the day so far. Kcal scale 0 to 2,400; target band 1,800 to 2,100.
const BAR = { x: 114, w: 218 };
const MEALS = [
  { y: 134, name: "Oats and banana", kcal: "420", fill: "var(--lp-bread)" },
  { y: 170, name: "Dal and rice", kcal: "1,030", fill: "var(--butter)" },
];
const CONFETTI = [
  [-26, -7, "var(--lp-blue)"],
  [-18, 8, "var(--butter)"],
  [-8, -9, "var(--lp-tomato)"],
  [6, 9, "var(--mint)"],
  [16, -8, "var(--lavender)"],
  [26, 6, "var(--peach)"],
  [34, -5, "var(--lp-leaf)"],
] as const;

const CAPTIONS = [
  { c: "lp-c0", title: "Reading your day.", line: "Your goal, calories left, pantry and what you like." },
  { c: "lp-c1", title: "Salad bowl it is.", line: "Fits your goal. Missing tomatoes and bread." },
  { c: "lp-c2a", title: "Two things to grab.", line: "Tomatoes and bread go on your list." },
  { c: "lp-c2b", title: "Bought. Pantry updated.", line: "Ticked off as they land in the cart." },
  { c: "lp-c3", title: "Cook along, hands free.", line: "One step at a time, with timers and voice." },
  { c: "lp-c4", title: "Logged. Right on target.", line: "1,890 kcal today, inside 1,800 to 2,100." },
];

// Plays twice (2 x 20s), then rests on the Log frame; the replay button restarts it. Reduced motion rests at once.
const REST_MS = 39000;

export function LoopAnimation() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [run, setRun] = useState(0);
  const [rested, setRested] = useState(false);
  const rest = reduced || rested;

  useEffect(() => {
    const id = setTimeout(() => setRested(true), REST_MS);
    return () => clearTimeout(id);
  }, [run]);

  const replay = () => {
    setRested(false);
    setRun((r) => r + 1);
  };

  return (
    <figure className={`lp relative m-0 w-full max-w-[190px] lg:max-w-[320px] ${rest ? "lp-rest" : ""}`}>
      <figcaption className="sr-only">
        How NutriFlow works: it reads your goal, calories and pantry, decides a meal, shops for what is
        missing, guides you while you cook, and logs what you ate against your daily range.
      </figcaption>
      <div key={run} aria-hidden="true">
        <div className="grid min-h-[22px] lg:min-h-[76px]">
          {CAPTIONS.map((k) => (
            <div key={k.c} className={`${k.c} [grid-area:1/1]`}>
              <p className="m-0 text-sm font-medium text-ink lg:text-lg">{k.title}</p>
              <p className="m-0 mt-1 hidden text-sm leading-snug text-ink2 lg:block lg:text-[15px]">
                {k.line}
              </p>
            </div>
          ))}
        </div>

        <svg viewBox="114 22 218 210" className="mt-3 block h-auto w-full overflow-visible lg:mt-5">
          <defs>
            <linearGradient id="lp-soft-edge" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0.27" stopColor="#000" />
              <stop offset="0.375" stopColor="#fff" />
              <stop offset="0.625" stopColor="#fff" />
              <stop offset="0.73" stopColor="#000" />
            </linearGradient>
          </defs>

          {/* 1a Checking (0 to 1.6s): what it looks at, ticked one by one. */}
          <g className="lp-v0">
            <Wipe id="lp-w-check" d={0} o={1.39} x={114} y={26} w={110} h={26}>
              <text x="114" y="46" fontSize="14" fontWeight="500" fill="var(--ink)">
                Checking
              </text>
            </Wipe>
            <Out o={1.39}>
              <g className="lp-pop" style={at(0.3)}>
                {[184, 194, 204].map((x, i) => (
                  <circle
                    key={x}
                    className="lp-dot"
                    style={{ "--t": `${i * 0.15}s` } as D}
                    cx={x}
                    cy="42"
                    r="2.5"
                    fill="var(--ink)"
                  />
                ))}
              </g>
              {CHECKS.map((c) => (
                <g key={c.y}>
                  <g className="lp-pop" style={at(c.at)}>
                    <circle cx="124" cy={c.y} r="8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                  </g>
                  <g className="lp-pop" style={at(c.at + 0.3)}>
                    <Check x={124} y={c.y} r={8} />
                  </g>
                </g>
              ))}
            </Out>
            {CHECKS.map((c, i) => (
              <Wipe key={c.y} id={`lp-w-row${i}`} d={c.at} o={1.39} x={142} y={c.y - 14} w={190} h={26}>
                <text x="142" y={c.y + 5} fontSize="14" fill="var(--ink)">
                  {c.label}
                </text>
              </Wipe>
            ))}
          </g>

          {/* 1b Best pick (1.6 to 3s), like the app's. */}
          <g className="lp-v1b">
            <Out o={2.79}>
              <g className="lp-rise" style={at(1.6)}>
                {/* .lp g centres transform-origin, so this moves the bowl's centre (220,137) to (146,100). */}
                <g transform="translate(-74 -37) scale(0.6)">
                  <SaladBowl />
                </g>
              </g>
            </Out>
            <Wipe id="lp-w-pick" d={1.7} o={2.79} x={206} y={56} w={126} h={100}>
              <text x="206" y="76" fontSize="14" fill="var(--ink2)">
                Best pick
              </text>
              <text x="206" y="100" fontSize="16" fontWeight="500" fill="var(--ink)">
                Salad bowl
              </text>
              <text x="206" y="124" fontSize="14" fill="var(--ink2)">
                440 kcal · 15 min
              </text>
              <text x="206" y="146" fontSize="14" fill="var(--ink2)">
                Missing 2
              </text>
            </Wipe>
          </g>

          {/* 2 Shop (3 to 6s): the chips become list rows, the items arc into the cart, the rows turn green and get a check. */}
          <g className="lp-v2">
            <Wipe id="lp-w-list" d={3} o={5.79} x={114} y={26} w={140} h={26}>
              <text x="114" y="46" fontSize="14" fontWeight="500" fill="var(--ink)">
                Shopping list
              </text>
            </Wipe>
            <Out o={5.79}>
              {[90, 130].map((y, i) => (
                <g key={y} className="lp-pop" style={at(3.1 + i * 0.1)}>
                  <circle cx="124" cy={y} r="8" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
                </g>
              ))}
              <g className="lp-slide" style={at(3.6)}>
                <g transform="translate(-12 62)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round">
                  <path d="M262 92 H344 L334 128 H270 Z" fill="var(--panel)" />
                  <path d="M286 92 L289 128 M310 92 L307 128 M266 110 H339" strokeOpacity="0.35" />
                  <path d="M244 80 H257 L270 128 H334" fill="none" strokeLinecap="round" />
                  <circle cx="280" cy="140" r="6" fill="var(--bg)" />
                  <circle cx="326" cy="140" r="6" fill="var(--bg)" />
                </g>
              </g>
              <g className="lp-arc-t" style={at(4.2)}>
                <Place x={278} y={166}>
                  <Tomato />
                </Place>
              </g>
              <g className="lp-arc-b" style={at(4.35)}>
                <Place x={304} y={170}>
                  <Bread />
                </Place>
              </g>
            </Out>
          </g>

          {/* 3 Cook (6 to 9s): tomatoes, then croutons, then the toss; the named step underneath says which. */}
          <g className="lp-v3">
            <Out o={8.79}>
              <BowlBack />
              {HAVE.map((f, i) => (
                <g key={i} className="lp-toss" style={toss(i)}>
                  <Food {...f} />
                </g>
              ))}
              {ADDED.map((f, i) => (
                <g key={i} className="lp-drop" style={at(i < 2 ? 6.2 + i * 0.12 : 7.1 + (i - 2) * 0.12)}>
                  <g className="lp-toss" style={toss(i + HAVE.length)}>
                    <Food {...f} />
                  </g>
                </g>
              ))}
              <g stroke="var(--ink)" strokeWidth="3" strokeLinecap="round">
                <line className="lp-srv-l" x1="210" y1="120" x2="196" y2="48" />
                <line className="lp-srv-r" x1="230" y1="120" x2="244" y2="48" />
              </g>
              <Bowl />
            </Out>
            {COOK_STEPS.map((k) => (
              <g key={k.c} className={k.c}>
                <Wipe id={`lp-w-${k.c}`} d={k.d} o={k.o} x={114} y={192} w={218} h={28}>
                  <text x="114" y="212" fontSize="14" fill="var(--ink)">
                    {k.label}
                  </text>
                </Wipe>
              </g>
            ))}
          </g>

          {/* 4 Log (9 to 12s): today; the salad is added with a tick and the day slides into its target band. */}
          <g className="lp-v4">
            <Wipe id="lp-w-today" d={9} o={11.55} x={114} y={26} w={218} h={200}>
              <text x="114" y="46" fontSize="14" fontWeight="500" fill="var(--ink)">
                Today
              </text>
              <rect x={BAR.x} y="60" width={BAR.w} height="8" rx="4" fill="var(--track)" />
              <rect
                className="lp-band"
                x={BAR.x + BAR.w * 0.75}
                y="55"
                width={BAR.w * 0.125}
                height="18"
                rx="4"
                fill="var(--mint)"
              />
              <rect className="lp-kcal" x={BAR.x} y="60" width={BAR.w} height="8" rx="4" fill="var(--ink)" />
              <text x="114" y="96" fontSize="14" fill="var(--ink2)">
                Target 1,800 to 2,100
              </text>
              <line x1="114" y1="110" x2="332" y2="110" stroke="var(--line2)" />
              {MEALS.map((m) => (
                <g key={m.name}>
                  <circle cx="126" cy={m.y} r="11" fill={m.fill} stroke="var(--ink)" strokeWidth="0.9" />
                  <text x="146" y={m.y + 5} fontSize="14" fill="var(--ink)">
                    {m.name}
                  </text>
                  <text x="302" y={m.y + 5} textAnchor="end" fontSize="14" fill="var(--ink2)">
                    {m.kcal}
                  </text>
                  <Check x={322} y={m.y} r={8} />
                </g>
              ))}
              <g className="lp-ph">
                <circle
                  cx="126"
                  cy="206"
                  r="11"
                  fill="none"
                  stroke="var(--line2)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <text x="146" y="211" fontSize="14" fill="var(--ink2)">
                  Dinner
                </text>
              </g>
            </Wipe>
            <g className="lp-n1">
              <Wipe id="lp-w-n1" d={9} o={10.15} x={250} y={26} w={82} h={26}>
                <text x="332" y="46" textAnchor="end" fontSize="14" fontWeight="500" fill="var(--ink)">
                  1,450 kcal
                </text>
              </Wipe>
            </g>
            <g className="lp-n2">
              <Wipe id="lp-w-n2" d={10.6} o={11.55} x={250} y={26} w={82} h={26}>
                <text x="332" y="46" textAnchor="end" fontSize="14" fontWeight="500" fill="var(--ink)">
                  1,890 kcal
                </text>
              </Wipe>
            </g>
            <g className="lp-row">
              <Out o={11.55}>
                <g className="lp-pop" style={at(9.8)}>
                  {/* Same centring rule: the bowl's centre (220,137) lands on the row's thumbnail (126,206). */}
                  <g transform="translate(-94 69) scale(0.24)">
                    <SaladBowl all />
                  </g>
                </g>
                <g className="lp-pop" style={at(10.25)}>
                  <Check x={322} y={206} r={8} />
                </g>
              </Out>
              <Wipe id="lp-w-salad" d={9.85} o={11.55} x={146} y={194} w={160} h={26}>
                <text x="146" y="211" fontSize="14" fontWeight="500" fill="var(--ink)">
                  Salad
                </text>
                <text x="302" y="211" textAnchor="end" fontSize="14" fill="var(--ink2)">
                  440
                </text>
              </Wipe>
            </g>
            <g className="lp-g11">
              <Wipe id="lp-w-range" d={11} o={11.55} x={258} y={80} w={74} h={26}>
                <rect x="258" y="82" width="74" height="22" rx="11" fill="var(--mint)" />
                <text x="295" y="97.5" textAnchor="middle" fontSize="12" fontWeight="500" fill="var(--ink)">
                  In range
                </text>
              </Wipe>
            </g>
            <Out o={11.55}>
              <g className="lp-confetti-all">
                {CONFETTI.map(([x, y, c]) => (
                  <circle
                    key={c}
                    cx="291"
                    cy="64"
                    r="2.4"
                    fill={c}
                    style={{ "--x": `${x}px`, "--y": `${y}px` } as D}
                  />
                ))}
              </g>
            </Out>
          </g>

          {/* Chips live outside the scenes: they travel from Best pick into the shopping list. */}
          <g className="lp-v12">
            <g className="lp-out-soft" style={{ "--o": sec(5.79) } as D}>
              <Chip id="t" x={114} w={104} label="Tomatoes" icon={<Tomato />} />
              <Chip id="b" x={226} w={80} label="Bread" icon={<Bread />} />
            </g>
          </g>
          {/* Bought: checks over the rings. */}
          <g className="lp-v2">
            <Out o={5.79}>
              <g className="lp-pop" style={at(4.9)}>
                <Check x={124} y={90} r={8} />
              </g>
              <g className="lp-pop" style={at(5)}>
                <Check x={124} y={130} r={8} />
              </g>
            </Out>
          </g>
        </svg>
      </div>
      {!reduced && (
        <button
          type="button"
          onClick={replay}
          tabIndex={rested ? 0 : -1}
          aria-hidden={!rested}
          className={`touch absolute bottom-0 right-0 inline-flex min-h-11 lg:static lg:mt-1 items-center gap-2 rounded-full border-0 bg-transparent px-0 text-sm font-medium text-ink2 ${rested ? "" : "invisible"}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 8a5.5 5.5 0 1 0 1.8-4.1M2.5 2.5v3h3" />
          </svg>
          Replay
        </button>
      )}
    </figure>
  );
}

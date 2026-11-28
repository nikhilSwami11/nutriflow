"use client";
import type { ReactNode } from "react";

/**
 * An isometric kitchen drawn in SVG: white, clean outlines, soft pastel accents. Tap an appliance to say you have it
 * (mint tick); one you do not have fades. Flat shapes with three tones per box (top, left face, right face) give the 3D look.
 * Colours are literal on purpose: this is an illustration and sits on a pastel panel in light and dark.
 */
const S = 20; // pixels per grid unit
const OX = 180, OY = 128;
const P = (x: number, y: number, z: number) => `${OX + (x - y) * S},${OY + (x + y) * S * 0.577 - z}`;
const pt = (x: number, y: number, z: number) => [OX + (x - y) * S, OY + (x + y) * S * 0.577 - z] as const;
const poly = (pts: [number, number, number][]) => pts.map(([x, y, z]) => P(x, y, z)).join(" ");

const INK = "#3a3f4b";
const TONE = { top: "#ffffff", left: "#eef1f5", right: "#dfe4eb" };
const OFF = { top: "#f1f1f1", left: "#e7e7e7", right: "#dddddd" };

interface BoxProps { x: number; y: number; z?: number; w: number; d: number; h: number; on?: boolean; tint?: string; children?: ReactNode }

/** One box: top, the face toward lower left (+y), and the face toward lower right (+x). `children` draw on the faces. */
function Box({ x, y, z = 0, w, d, h, on = true, tint, children }: BoxProps) {
  const t = on ? TONE : OFF;
  const stroke = { stroke: INK, strokeWidth: 1.1, strokeLinejoin: "round" as const, strokeDasharray: on ? undefined : "3 2.5" };
  return (
    <g>
      <polygon points={poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={tint && on ? tint : t.left} {...stroke} />
      <polygon points={poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]])} fill={t.right} {...stroke} />
      <polygon points={poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]])} fill={t.top} {...stroke} />
      {children}
    </g>
  );
}

/** A flat shape on the +y face of a box (u across, v up, from its lower-left corner). */
const face = (x: number, y: number, z: number, u0: number, v0: number, u1: number, v1: number, fill: string, stroke = INK) => (
  <polygon points={poly([[x + u0, y, z + v0], [x + u1, y, z + v0], [x + u1, y, z + v1], [x + u0, y, z + v1]])} fill={fill} stroke={stroke} strokeWidth={1} strokeLinejoin="round" />
);

function Burner({ x, y, z }: { x: number; y: number; z: number }) {
  const [cx, cy] = pt(x, y, z);
  return <><ellipse cx={cx} cy={cy} rx={S * 0.62} ry={S * 0.36} fill="#cfd5de" stroke={INK} strokeWidth="1" /><ellipse cx={cx} cy={cy} rx={S * 0.3} ry={S * 0.17} fill="#aab2bf" /></>;
}

function Tick({ x, y, z }: { x: number; y: number; z: number }) {
  const [cx, cy] = pt(x, y, z);
  return <g aria-hidden="true"><circle cx={cx} cy={cy} r="9" fill="var(--mint)" stroke="#fff" strokeWidth="2" /><path d={`M${cx - 4} ${cy}l3 3 5-6`} fill="none" stroke="#17323a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></g>;
}

interface Props { have: string[]; onToggle: (id: string) => void }

export function KitchenScene({ have, onToggle }: Props) {
  const on = (id: string) => have.includes(id);
  const pick = (id: string) => ({ onClick: () => onToggle(id), style: { cursor: "pointer", opacity: on(id) ? 1 : 0.6 }, "data-appliance": id, "data-on": on(id) });
  const H = 125;
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="Your kitchen. Tap an appliance to say you have it." className="h-auto w-full max-w-[420px]">
      {/* room: floor, then the two walls */}
      <polygon points={poly([[0, 0, 0], [8, 0, 0], [8, 8, 0], [0, 8, 0]])} fill="#f7f4ee" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      {Array.from({ length: 7 }, (_, i) => (
        <g key={i} stroke="#e3dccd" strokeWidth="0.8">
          <polyline fill="none" points={`${P(i + 1, 0, 0)} ${P(i + 1, 8, 0)}`} />
          <polyline fill="none" points={`${P(0, i + 1, 0)} ${P(8, i + 1, 0)}`} />
        </g>
      ))}
      <polygon points={poly([[0, 0, 0], [8, 0, 0], [8, 0, H], [0, 0, H]])} fill="#ffffff" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      <polygon points={poly([[0, 0, 0], [0, 8, 0], [0, 8, H], [0, 0, H]])} fill="#f1f4f8" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
      {/* a window on the left wall, a shelf on the right */}
      <polygon points={poly([[0, 3, 70], [0, 6, 70], [0, 6, 108], [0, 3, 108]])} fill="#d8ecf7" stroke={INK} strokeWidth="1" strokeLinejoin="round" />
      <polyline fill="none" stroke={INK} strokeWidth="0.9" points={`${P(0, 4.5, 70)} ${P(0, 4.5, 108)}`} />
      <polygon points={poly([[4.6, 0, 88], [7.4, 0, 88], [7.4, 0.5, 88], [4.6, 0.5, 88]])} fill="#e9d8b8" stroke={INK} strokeWidth="1" strokeLinejoin="round" />

      {/* right wall: fridge, oven, stove, a counter end */}
      <Box x={7} y={0.2} w={0.8} d={1.8} h={42} />
      <g {...pick("fridge")}>
        <Box x={0.4} y={0.2} w={1.8} d={1.8} h={118} on={on("fridge")}>
          {face(0.4, 2, 0, 0.1, 0.2, 1.7, 70, on("fridge") ? "#eef6fb" : "#ececec")}
          {face(0.4, 2, 0, 0.1, 74, 1.7, 116, on("fridge") ? "#eef6fb" : "#ececec")}
          {face(0.4, 2, 0, 1.4, 52, 1.55, 64, "var(--mint)")}
          {face(0.4, 2, 0, 1.4, 80, 1.55, 100, "var(--mint)")}
        </Box>
        {on("fridge") && <Tick x={1.3} y={1.1} z={138} />}
      </g>
      <g {...pick("oven")}>
        <Box x={2.4} y={0.2} w={1.9} d={1.8} h={66} on={on("oven")}>
          {face(2.4, 2, 0, 0.15, 8, 1.75, 46, on("oven") ? "#cfe7f5" : "#e4e4e4")}
          {face(2.4, 2, 0, 0.15, 52, 1.75, 62, on("oven") ? "#f4d9d9" : "#e4e4e4")}
          {face(2.4, 2, 0, 0.3, 49, 1.6, 51, INK)}
        </Box>
        {on("oven") && <Tick x={3.35} y={1.1} z={86} />}
      </g>
      <g {...pick("stove")}>
        <Box x={4.5} y={0.2} w={2.3} d={1.8} h={42} on={on("stove")}>
          {face(4.5, 2, 0, 0.15, 4, 2.15, 34, on("stove") ? "#dfe9f2" : "#e4e4e4")}
          {face(4.5, 2, 0, 0.5, 30, 1.8, 32, INK)}
        </Box>
        <Burner x={5.1} y={0.8} z={42} /><Burner x={6.1} y={0.8} z={42} /><Burner x={5.1} y={1.55} z={42} /><Burner x={6.1} y={1.55} z={42} />
        {on("stove") && <Tick x={5.65} y={1.1} z={62} />}
      </g>

      {/* left wall: a long counter with a microwave, a blender and a toaster */}
      <Box x={0.2} y={2.2} w={1.8} d={5.6} h={42}>
        {Array.from({ length: 4 }, (_, i) => <polygon key={i} points={poly([[2, 2.4 + i * 1.4, 4], [2, 3.6 + i * 1.4, 4], [2, 3.6 + i * 1.4, 36], [2, 2.4 + i * 1.4, 36]])} fill="none" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />)}
      </Box>
      <g {...pick("microwave")}>
        <Box x={0.35} y={2.5} z={42} w={1.3} d={2.1} h={26} on={on("microwave")}>
          <polygon points={poly([[1.65, 2.7, 46], [1.65, 4, 46], [1.65, 4, 64], [1.65, 2.7, 64]])} fill={on("microwave") ? "#e3dcf5" : "#e4e4e4"} stroke={INK} strokeWidth="1" strokeLinejoin="round" />
          <polygon points={poly([[1.65, 4.2, 48], [1.65, 4.45, 48], [1.65, 4.45, 62], [1.65, 4.2, 62]])} fill="var(--lavender)" stroke={INK} strokeWidth="0.8" strokeLinejoin="round" />
        </Box>
        {on("microwave") && <Tick x={1} y={3.5} z={86} />}
      </g>
      <g {...pick("blender")}>
        <Box x={0.6} y={5.0} z={42} w={0.8} d={0.8} h={34} on={on("blender")} tint={on("blender") ? "#dff3ea" : undefined} />
        <Box x={0.75} y={5.15} z={76} w={0.5} d={0.5} h={6} on={on("blender")} />
        {on("blender") && <Tick x={1} y={5.4} z={100} />}
      </g>
      <g {...pick("toaster")}>
        <Box x={0.5} y={6.2} z={42} w={1.1} d={1.0} h={15} on={on("toaster")} tint={on("toaster") ? "#fbe3d3" : undefined} />
        {on("toaster") && <Tick x={1} y={6.7} z={72} />}
      </g>
    </svg>
  );
}

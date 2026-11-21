const hex = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
const A = hex("#B9A7EE");
const B = hex("#8FD3C0");

const DOTS = Array.from({ length: 22 }, (_, i) => {
  const a = (i / 22) * Math.PI * 2;
  const k = (Math.sin(a) + 1) / 2;
  const col = `rgb(${A.map((v, j) => Math.round(v + (B[j] - v) * k)).join(",")})`;
  return { a: (i / 22) * 360, d: -(i / 22) * 4.2 * 2 + (i % 3) * 0.07, col };
});

export function Orb({ active }: { active: boolean }) {
  const style = { "--r": "38px", "--amp": `${active ? 11 : 6}px`, "--s": "3px", "--t": `${active ? 1.8 : 4.2}s` } as React.CSSProperties;
  return (
    <span className="orb" aria-hidden="true" style={style}>
      {DOTS.map((d, i) => (
        <i key={i} style={{ "--a": `${d.a.toFixed(1)}deg`, "--d": `${d.d.toFixed(2)}s`, background: d.col } as React.CSSProperties} />
      ))}
    </span>
  );
}

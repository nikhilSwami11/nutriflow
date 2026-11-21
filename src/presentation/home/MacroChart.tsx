"use client";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type Chart,
  type ChartData,
  type ChartOptions,
  type Plugin,
  type TooltipItem,
} from "chart.js";
import { useMemo, useRef, useState } from "react";
import { Line } from "react-chartjs-2";
import { CHART_MAX, type ChartModel, type Range } from "@/view-models/dashboard/chartModel";
import { alpha, readChartTokens, type ChartTokens } from "../shared/chartTokens";

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip);

const SWATCH = [["Protein", "#F2A3A9"], ["Carbs", "#9EC8F3"], ["Fats", "#B9A7EE"]] as const;
const EATEN = 3; // dataset index of the eaten line: drives the tooltip and the highlighted point

type Points = ChartModel["points"];
const reduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Thin dashed line at the hovered day. */
const crosshair = (t: ChartTokens): Plugin<"line"> => ({
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()[0];
    if (!active) return;
    const { top, bottom } = chart.chartArea;
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = t.line2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(active.element.x, top);
    ctx.lineTo(active.element.x, bottom);
    ctx.stroke();
    ctx.restore();
  },
});

function buildData(points: Points, t: ChartTokens): ChartData<"line"> {
  const band = (label: string, k: 0 | 1 | 2, color: string, fill: boolean | string) => ({
    label,
    data: points.map((p) => p.bands[k]),
    stack: "macros",
    fill,
    backgroundColor: alpha(color, 0.85),
    borderWidth: 0,
    pointRadius: 0,
    pointHoverRadius: 0,
    tension: 0.35,
    order: 4,
  });
  return {
    labels: points.map((p) => p.axis),
    datasets: [
      band("Protein", 0, t.rose, "origin"),
      band("Carbs", 1, t.sky, "-1"),
      band("Fats", 2, t.lavender, "-1"),
      {
        label: "Eaten",
        data: points.map((p) => Math.min(p.eaten, CHART_MAX)),
        stack: "eaten",
        borderColor: t.ink,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: t.ink,
        pointHoverBorderColor: t.bg,
        pointHoverBorderWidth: 2,
        tension: 0.35,
        fill: false,
        order: 1,
      },
      {
        label: "Planned",
        data: points.map((p) => Math.min(p.planned, CHART_MAX)),
        stack: "plan",
        borderColor: t.muted,
        borderWidth: 1.5,
        borderDash: [5, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.35,
        fill: false,
        order: 2,
      },
    ],
  };
}

function buildOptions(points: Points, t: ChartTokens, onHover: (i: number | null) => void, long: boolean): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reduced() ? false : { duration: 350 },
    // Hover anywhere along the x axis snaps to the nearest day, no need to touch the line.
    interaction: { mode: "index", intersect: false },
    layout: { padding: { top: 6, right: 6 } },
    onHover: (_e, els) => onHover(els.find((e) => e.datasetIndex === EATEN)?.index ?? null),
    plugins: {
      legend: { display: false },
      tooltip: {
        filter: (i: TooltipItem<"line">) => i.datasetIndex === EATEN,
        backgroundColor: t.bg,
        titleColor: t.ink,
        bodyColor: t.ink2,
        footerColor: t.muted,
        borderColor: t.line2,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        caretPadding: 12,
        displayColors: false,
        titleFont: { family: t.font, weight: 500, size: 12 },
        bodyFont: { family: t.font, size: 12 },
        footerFont: { family: t.font, size: 11, weight: 400 },
        callbacks: {
          title: (items) => points[items[0].dataIndex].title,
          label: (item) => points[item.dataIndex].lines,
          footer: (items) => points[items[0].dataIndex].footer,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { color: t.line },
        ticks: { color: t.muted, font: { family: t.font, size: 11 }, maxRotation: 0, autoSkip: true, maxTicksLimit: long ? 7 : 7 },
      },
      y: {
        min: 0,
        max: CHART_MAX,
        stacked: true,
        grid: { color: t.line },
        border: { display: false },
        ticks: { color: t.muted, font: { family: t.font, size: 11 }, stepSize: CHART_MAX / 4, callback: (v) => Number(v).toLocaleString("en-US") },
      },
    },
  };
}

export function MacroChart({ c, above, below }: { c: ChartModel & { range: Range; setRange: (r: Range) => void }; above?: React.ReactNode; below?: React.ReactNode }) {
  const chartRef = useRef<Chart<"line">>(null);
  const [idx, setIdx] = useState<number | null>(null);
  const last = c.points.length - 1;

  // Tokens are read once on the client; the chart is only rendered after mount.
  const tokens = useMemo(() => readChartTokens(), []);
  const data = useMemo(() => buildData(c.points, tokens), [c.points, tokens]);
  const options = useMemo(() => buildOptions(c.points, tokens, setIdx, c.points.length > 7), [c.points, tokens]);
  const plugins = useMemo(() => [crosshair(tokens)], [tokens]);

  const show = (i: number | null) => {
    const chart = chartRef.current;
    if (!chart) return;
    if (i === null) {
      chart.setActiveElements([]);
      chart.tooltip?.setActiveElements([], { x: 0, y: 0 });
    } else {
      const els = [{ datasetIndex: EATEN, index: i }];
      const x = chart.scales.x.getPixelForValue(i);
      const y = chart.scales.y.getPixelForValue(Math.min(c.points[i].eaten, CHART_MAX));
      chart.setActiveElements(els);
      chart.tooltip?.setActiveElements(els, { x, y });
    }
    chart.update();
    setIdx(i);
  };

  const key = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1 }[e.key];
    if (step === undefined && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const cur = idx ?? last;
    show(e.key === "Home" ? 0 : e.key === "End" ? last : Math.min(last, Math.max(0, cur + (step ?? 0))));
  };

  return (
    <article aria-label="Calories and macros" className="flex min-w-0 shrink-0 flex-col gap-4 rounded-[20px] border border-line bg-bg px-3 py-4 lg:px-6 lg:py-[22px]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="m-0 text-base font-medium">{c.title}</h2>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink2">
            {SWATCH.map(([name, color]) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="block h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
                {name}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <svg width="22" height="6" aria-hidden="true"><line x1="0" y1="3" x2="22" y2="3" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="5 4" /></svg>
              Planned
            </span>
          </div>
        </div>
        <div role="group" aria-label="Range" className="relative grid grid-cols-2 rounded-full bg-track p-[3px]">
          <span
            aria-hidden="true"
            className="absolute bottom-[3px] left-[3px] top-[3px] w-[calc(50%-3px)] rounded-full bg-bg shadow-[0_1px_5px_rgba(0,0,0,0.10)] transition-transform duration-300 ease-[cubic-bezier(0.2,0.7,0.2,1)]"
            style={{ transform: c.range === "30d" ? "translateX(100%)" : "none" }}
          />
          {(["7d", "30d"] as const).map((r) => (
            <button key={r} type="button" aria-pressed={c.range === r} onClick={() => c.setRange(r)} className={`relative z-10 min-h-9 min-w-[84px] rounded-full px-3.5 py-2 text-[13px] transition-colors ${c.range === r ? "font-medium text-ink" : "font-normal text-ink2"}`}>
              {r === "7d" ? "7 days" : "30 days"}
            </button>
          ))}
        </div>
      </div>

      {above}

      <div
        role="slider"
        tabIndex={0}
        aria-label="Day"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={idx ?? last}
        aria-valuetext={c.points[idx ?? last].summary}
        onKeyDown={key}
        onBlur={() => show(null)}
        onPointerLeave={(e) => e.pointerType === "mouse" && setIdx(null)} // Chart.js only reports hover inside the plot
        className="relative h-[250px] touch-pan-y"
      >
        <Line ref={chartRef} data={data} options={options} plugins={plugins} aria-label={c.aria} role="img" />
        <p role="status" className="sr-only">{idx === null ? "" : c.points[idx].summary}</p>
      </div>

      {below}
    </article>
  );
}

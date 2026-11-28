"use client";
import dynamic from "next/dynamic";

/** Chart.js is large and the chart sits below the next meal: load it after the first paint. */
export const MacroChart = dynamic(() => import("./MacroChart").then((m) => m.MacroChart), {
  ssr: false,
  loading: () => <div role="status" aria-label="Loading chart" className="skeleton h-64 rounded-[20px] bg-track" />,
});

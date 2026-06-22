"use client";

/* Hand-rolled SVG charts — no charting dependency, consistent with the v2
   design language (electric line, soft area fill, hairline grid). */

export interface Series {
  name: string;
  color: string;
  values: number[];
  area?: boolean;
}

const W = 640;
const H = 240;
const PAD_X = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 16;

function buildScale(series: Series[]) {
  const all = series.flatMap((s) => s.values);
  let min = Math.min(...all);
  let max = Math.max(...all);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const pad = (max - min) * 0.12;
  min -= pad;
  max += pad;
  const xFor = (i: number, n: number) => PAD_X + (n <= 1 ? 0 : (i / (n - 1)) * (W - 2 * PAD_X));
  const yFor = (v: number) => PAD_TOP + (1 - (v - min) / (max - min)) * (H - PAD_TOP - PAD_BOTTOM);
  return { min, max, xFor, yFor };
}

export function LineChart({
  series,
  xLabels,
  zeroLine = false,
  ariaLabel,
}: {
  series: Series[];
  xLabels: string[];
  zeroLine?: boolean;
  ariaLabel?: string;
}) {
  const { min, max, xFor, yFor } = buildScale(series);
  const n = xLabels.length;
  const gridYs = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD_TOP + f * (H - PAD_TOP - PAD_BOTTOM));

  return (
    <div role="img" aria-label={ariaLabel}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={i} id={`v2chart-fill-${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.26" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* gridlines */}
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD_X} x2={W - PAD_X} y1={y} y2={y} stroke="var(--v2-hairline)" strokeWidth={1} />
        ))}

        {/* zero baseline (for TSB) */}
        {zeroLine && min < 0 && max > 0 && (
          <line
            x1={PAD_X}
            x2={W - PAD_X}
            y1={yFor(0)}
            y2={yFor(0)}
            stroke="var(--muted-foreground)"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.5}
          />
        )}

        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${xFor(i, s.values.length)},${yFor(v)}`);
          const linePath = `M${pts.join(" L")}`;
          const areaPath = `${linePath} L${xFor(s.values.length - 1, s.values.length)},${H - PAD_BOTTOM} L${xFor(0, s.values.length)},${H - PAD_BOTTOM} Z`;
          const last = s.values.length - 1;
          return (
            <g key={si}>
              {s.area && <path d={areaPath} fill={`url(#v2chart-fill-${si})`} />}
              <path d={linePath} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
              <circle cx={xFor(last, s.values.length)} cy={yFor(s.values[last])} r={4} fill={s.color} />
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex justify-between px-1">
        {xLabels.map((l, i) => (
          <span
            key={i}
            className="tabular text-[10px] font-semibold text-muted-foreground"
            style={{ display: n > 8 && i % 2 === 1 ? "none" : "block" }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal actual-vs-target comparison bars. */
export function CompareBars({
  rows,
}: {
  rows: { label: string; actual: number; target: number; color: string }[];
}) {
  const maxVal = Math.max(...rows.flatMap((r) => [r.actual, r.target]), 1);
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground">{r.label}</span>
            <span className="tabular text-xs font-semibold text-muted-foreground">
              {r.actual}% <span className="opacity-50">/ {r.target}%</span>
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {/* actual */}
            <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: "var(--secondary)" }}>
              <div
                className="h-full rounded-full v2-transition"
                style={{ width: `${(r.actual / maxVal) * 100}%`, background: r.color }}
              />
            </div>
            {/* target (ghost) */}
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "transparent" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.target / maxVal) * 100}%`,
                  background: "color-mix(in oklab, var(--muted-foreground) 45%, transparent)",
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Vertical completed/planned bars for adherence. */
export function AdherenceBars({
  weeks,
}: {
  weeks: { weekLabel: string; planned: number; completed: number }[];
}) {
  const max = Math.max(...weeks.map((w) => w.planned), 1);
  return (
    <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
      {weeks.map((w) => {
        const full = w.completed >= w.planned;
        return (
          <div key={w.weekLabel} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex w-full max-w-[34px] flex-col justify-end" style={{ height: 92 }}>
              <div
                className="relative w-full overflow-hidden rounded-md"
                style={{ height: `${(w.planned / max) * 100}%`, background: "var(--secondary)" }}
              >
                <div
                  className="absolute inset-x-0 bottom-0 rounded-md v2-transition"
                  style={{
                    height: `${(w.completed / w.planned) * 100}%`,
                    background: full ? "var(--primary)" : "var(--accent)",
                  }}
                />
              </div>
            </div>
            <span className="tabular text-[10px] font-semibold text-muted-foreground">{w.weekLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

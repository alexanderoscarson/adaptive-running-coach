"use client";

import { TrendingDown } from "lucide-react";
import { useV2I18n } from "../../_lib/i18n";
import { PageHeader, MockNote } from "../../_components/app-ui";
import { LineChart, CompareBars, AdherenceBars } from "../../_components/charts";
import {
  fitnessTrend,
  intensityDistribution,
  thresholdHistory,
  adherence,
  fmtPaceSec,
} from "../../_lib/mock-app-data";

export default function ProgressPage() {
  const { lang, t } = useV2I18n();
  const pts = fitnessTrend.points;
  const labels = pts.map((p) => p.weekLabel);

  const th = thresholdHistory.points;
  const thLabels = th.map((p) => (lang === "sv" ? p.monthLabelSv : p.monthLabelEn));
  const improvedSec = th[0].secPerKm - th[th.length - 1].secPerKm;

  const intensityColors: Record<string, string> = { easy: "#4f8bff", moderate: "#ffce4f", hard: "#ff5a6a" };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader eyebrow={t("prog.eyebrow")} title={t("prog.title")} />

      <div className="mt-6">
        <MockNote>{t("mock.app.history")}</MockNote>
      </div>

      {/* ===== FITNESS & FORM ===== */}
      <section className="v2-card mt-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl">{t("prog.fitness")}</h2>
          <span className="text-xs font-semibold text-muted-foreground">{t("prog.fitness.sub")}</span>
        </div>

        <div className="mt-5">
          <LineChart
            ariaLabel={t("prog.fitness")}
            xLabels={labels}
            series={[
              { name: t("prog.ctl"), color: "#4f8bff", values: pts.map((p) => p.ctl), area: true },
              { name: t("prog.atl"), color: "#38e0ff", values: pts.map((p) => p.atl) },
            ]}
          />
        </div>
        <Legend items={[{ c: "#4f8bff", l: t("prog.ctl") }, { c: "#38e0ff", l: t("prog.atl") }]} />

        {/* TSB strip */}
        <div className="mt-6 border-t pt-5" style={{ borderColor: "var(--v2-hairline)" }}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-bold text-foreground">{t("prog.tsb")}</span>
            <span className="tabular text-sm font-bold" style={{ color: "#7c5cff" }}>
              {pts[pts.length - 1].tsb > 0 ? `+${pts[pts.length - 1].tsb}` : pts[pts.length - 1].tsb}
            </span>
          </div>
          <div className="mt-3">
            <LineChart
              ariaLabel={t("prog.tsb")}
              xLabels={labels}
              zeroLine
              series={[{ name: t("prog.tsb"), color: "#7c5cff", values: pts.map((p) => p.tsb), area: true }]}
            />
          </div>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {/* ===== INTENSITY ===== */}
        <section className="v2-card p-6">
          <h2 className="text-2xl">{t("prog.intensity")}</h2>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{t("prog.intensity.sub")}</p>
          <div className="mt-5">
            <CompareBars
              rows={intensityDistribution.buckets.map((b) => ({
                label: t(`prog.zone.${b.key}`),
                actual: b.actual,
                target: b.target,
                color: intensityColors[b.key],
              }))}
            />
          </div>
          <div className="mt-5 flex gap-4 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full" style={{ background: "var(--foreground)" }} /> {t("common.actual")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-4 rounded-full" style={{ background: "color-mix(in oklab, var(--muted-foreground) 45%, transparent)" }} /> {t("common.target")}
            </span>
          </div>
        </section>

        {/* ===== THRESHOLD HISTORY ===== */}
        <section className="v2-card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl">{t("prog.threshold")}</h2>
            <span className="inline-flex items-center gap-1 text-sm font-bold" style={{ color: "var(--accent)" }}>
              <TrendingDown className="h-4 w-4" />−{improvedSec}s
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{t("prog.threshold.sub")}</p>
          <div className="mt-5">
            <LineChart
              ariaLabel={t("prog.threshold")}
              xLabels={thLabels}
              series={[{ name: t("prog.threshold"), color: "#38e0ff", values: th.map((p) => p.secPerKm), area: true }]}
            />
          </div>
          <div className="tabular mt-3 text-sm font-semibold text-muted-foreground">
            {fmtPaceSec(th[0].secPerKm)} → <span className="font-bold text-foreground">{fmtPaceSec(th[th.length - 1].secPerKm)}</span> /km
          </div>
        </section>
      </div>

      {/* ===== ADHERENCE ===== */}
      <section className="v2-card mt-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-2xl">{t("prog.adherence")}</h2>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{t("prog.adherence.sub")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "color-mix(in oklab, var(--primary) 14%, transparent)", color: "var(--accent)" }}>
              {t("prog.streak", { n: String(adherence.streak) })}
            </span>
            <span className="tabular text-2xl font-bold text-foreground">{t("prog.overall", { n: String(adherence.overallPct) })}</span>
          </div>
        </div>
        <div className="mt-6">
          <AdherenceBars weeks={adherence.weeks} />
        </div>
      </section>
    </div>
  );
}

function Legend({ items }: { items: { c: string; l: string }[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-4">
      {items.map((it) => (
        <span key={it.l} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.c }} />
          {it.l}
        </span>
      ))}
    </div>
  );
}

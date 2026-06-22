"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Gauge, Heart, Activity, Layers } from "lucide-react";
import { formatPace } from "@/lib/plan-generator";
import { useV2I18n } from "../_lib/i18n";
import { formatDayLabel, isSameDay } from "../_lib/race-meta";
import { SESSION_TONE, SESSION_ICON, sessionDetail } from "../_lib/session-style";
import {
  getAppPlan,
  getNextSession,
  getCurrentWeek,
  daysToRace,
  fitnessTrend,
} from "../_lib/mock-app-data";
import { PageHeader, MockNote, MockTag } from "../_components/app-ui";
import { WeekStrip } from "../_components/week-strip";

const FEELINGS = ["fresh", "ok", "tired"] as const;

export default function HomePage() {
  const { lang, t } = useV2I18n();
  const plan = getAppPlan();
  const next = getNextSession();
  const week = getCurrentWeek();
  const days = daysToRace();
  const [feel, setFeel] = useState<string | null>(null);

  const tsbNow = fitnessTrend.points[fitnessTrend.points.length - 1].tsb;

  function dayLabel(date: Date): string {
    const today = new Date();
    if (isSameDay(date, today)) return t("common.today");
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(date, tomorrow)) return t("common.tomorrow");
    return formatDayLabel(date, lang);
  }

  const NextIcon = next ? SESSION_ICON[next.type] : Activity;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader
        eyebrow={t("home.eyebrow")}
        title={t("home.greeting", { name: plan.athlete.name })}
        sub={t("home.toRace", { days: String(days), race: plan.race.name })}
      />

      {/* ===== NEXT SESSION ===== */}
      {next && (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="v2-card relative mt-8 overflow-hidden p-6 sm:p-7"
        >
          <div className="absolute inset-0 -z-10 v2-aurora opacity-50" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">{t("home.next")}</span>
            <span className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: "var(--accent)" }}>
              · {dayLabel(next.date)}
            </span>
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: SESSION_TONE[next.type] }}
            >
              <NextIcon className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wider" style={{ color: SESSION_TONE[next.type] }}>
                {t(`sessiontype.${next.type}`)}
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl">{next.title}</h2>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Metric label={next.durationMinutes ? t("sess.duration") : t("sess.distance")} value={sessionDetail(next, lang) || "—"} />
            {next.targetPaceMinKm && <Metric label={t("sess.zone.pace")} value={`${formatPace(next.targetPaceMinKm)} /km`} />}
            {next.targetHrZone && <Metric label={t("sess.zone.hr")} value={`${t("sess.zone.hrUnit")} ${next.targetHrZone}`} />}
          </div>

          <Link
            href={`/v2/app/session/${next.id}`}
            className="v2-ring-focus v2-transition group mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-primary-foreground"
            style={{ background: "var(--primary)", boxShadow: "0 14px 40px -14px var(--glow)" }}
          >
            {t("home.openSession")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      )}

      {/* ===== QUICK STATS ===== */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <StatCard icon={Layers} label={t("home.phase")} value={t(`ob.prev.phase.${week.phase}`)} />
        <StatCard icon={Gauge} label={t("home.threshold")} value={`${plan.thresholdPaceLabel}`} unit="/km" />
        <StatCard icon={Heart} label={t("home.form")} value={tsbNow > 0 ? `+${tsbNow}` : String(tsbNow)} mock />
      </div>

      {/* ===== FEELING CHECK-IN ===== */}
      <div className="v2-card mt-4 p-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-foreground">{t("home.feel")}</h3>
          <MockTag />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {FEELINGS.map((f) => {
            const active = feel === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFeel(f)}
                className="v2-ring-focus v2-transition rounded-2xl py-3 text-sm font-bold"
                style={
                  active
                    ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                    : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
                }
              >
                {t(`home.feel.${f}`)}
              </button>
            );
          })}
        </div>
        {feel && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm font-medium text-accent"
          >
            {t("home.feel.thanks")}
          </motion.p>
        )}
      </div>

      {/* ===== THIS WEEK ===== */}
      <div className="v2-card mt-4 p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-2xl">{t("home.week")}</h3>
          <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
            <span className="tabular">
              {week.totalDistanceKm} {t("common.km")}
            </span>
            {week.isRecovery && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold"
                style={{ background: "var(--secondary)", color: "var(--accent)" }}
              >
                {t("home.week.recovery")}
              </span>
            )}
          </div>
        </div>
        <div className="mt-5">
          <WeekStrip week={week} />
        </div>
        <Link
          href="/v2/app/plan"
          className="v2-ring-focus v2-transition group mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-foreground"
        >
          {t("home.viewPlan")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="mt-4">
        <MockNote>{t("mock.app.plan")}</MockNote>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-4 py-2.5"
      style={{ background: "color-mix(in oklab, var(--background) 50%, var(--card))", border: "1px solid var(--v2-hairline)" }}
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="tabular mt-0.5 text-base font-bold text-foreground">{value}</div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  mock,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  unit?: string;
  mock?: boolean;
}) {
  return (
    <div className="v2-card p-4">
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-accent" />
        {mock && <MockTag />}
      </div>
      <div className="tabular mt-3 text-xl font-bold text-foreground sm:text-2xl">
        {value}
        {unit && <span className="ml-0.5 text-xs font-semibold text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-0.5 text-[11px] font-semibold leading-snug text-muted-foreground">{label}</div>
    </div>
  );
}

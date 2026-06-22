"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, RotateCcw, Activity, CalendarDays, Gauge, Flag, Info } from "lucide-react";
import type { Race } from "@/lib/races";
import { SPORT_EMOJI } from "@/lib/races";
import type { PlannedSession, WeekPlan } from "@/lib/plan-generator";
import { useV2I18n } from "../_lib/i18n";
import { SPORT_GRADIENT, SPORT_LABEL, raceTexture, daysUntil, formatRaceDate } from "../_lib/race-meta";
import { PHASE_COLOR, SESSION_TONE, BLOCK_LABEL, sessionDetail } from "../_lib/session-style";
import type { PreviewResult } from "../_lib/preview-plan";

function pickSample(weeks: WeekPlan[]): { week: WeekPlan; session: PlannedSession } | null {
  for (const ph of ["build", "peak", "base"] as const) {
    for (const w of weeks) {
      if (w.phase !== ph) continue;
      const s = w.sessions.find(
        (x) => (x.type === "tempo" || x.type === "intervals") && x.structure.blocks.length >= 3,
      );
      if (s) return { week: w, session: s };
    }
  }
  for (const w of weeks) {
    const s = w.sessions.find((x) => x.type === "long");
    if (s) return { week: w, session: s };
  }
  const w = weeks.find((x) => x.sessions.length > 0);
  return w ? { week: w, session: w.sessions[0] } : null;
}

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function PlanPreview({
  race,
  result,
  onRestart,
}: {
  race: Race;
  result: PreviewResult;
  onRestart: () => void;
}) {
  const { lang, t } = useV2I18n();
  const days = daysUntil(result.raceDate);
  const firstWeek = result.weeks[0];
  const sample = pickSample(result.weeks);

  const byDay = new Map<number, PlannedSession[]>();
  for (const s of firstWeek?.sessions ?? []) {
    if (!byDay.has(s.dayOfWeek)) byDay.set(s.dayOfWeek, []);
    byDay.get(s.dayOfWeek)!.push(s);
  }

  const stats = [
    { icon: CalendarDays, n: String(result.planWeeks), l: t("ob.prev.weeks") },
    { icon: Flag, n: String(days), l: `${t("ob.prev.days")} ${t("ob.prev.toRace")}` },
    { icon: Gauge, n: `${result.thresholdPaceLabel}`, l: "min/km tröskel" },
    { icon: Activity, n: String(result.totalSessions), l: "pass" },
  ];

  return (
    <div className="space-y-8">
      {/* ===== RACE HERO BAND ===== */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[1.5rem]"
        style={{ border: "1px solid var(--v2-hairline)" }}
      >
        <div className={`relative bg-gradient-to-br ${SPORT_GRADIENT[race.sport]} p-7 sm:p-9`}>
          <div className="absolute inset-0 v2-grid opacity-25 mix-blend-overlay" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              {SPORT_EMOJI[race.sport]} {SPORT_LABEL[race.sport][lang]}
            </span>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-white/75">
              {t("ob.prev.ready")}
            </p>
            <h2 className="mt-1 text-5xl text-white sm:text-6xl lg:text-7xl">{race.name}</h2>
            <p className="mt-3 max-w-lg text-base font-semibold text-white/85">
              {raceTexture(race, lang)} · {formatRaceDate(result.raceDate, lang)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="v2-card p-4 sm:p-5"
          >
            <s.icon className="h-5 w-5 text-accent" />
            <div className="tabular mt-3 text-3xl font-bold text-foreground">{s.n}</div>
            <div className="mt-1 text-xs font-semibold leading-snug text-muted-foreground">{s.l}</div>
          </motion.div>
        ))}
      </div>

      {/* ===== PHASE TIMELINE ===== */}
      <div className="v2-card p-6">
        <h3 className="text-2xl">{t("ob.prev.phases")}</h3>
        <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--secondary)" }}>
          {result.phases.map((p, i) => (
            <motion.div
              key={`${p.phase}-${i}`}
              initial={{ width: 0 }}
              animate={{ width: `${(p.weeks / result.planWeeks) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: PHASE_COLOR[p.phase] }}
              title={`${t(`ob.prev.phase.${p.phase}`)} · ${p.weeks} ${t("ob.prev.weeks")}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {result.phases.map((p, i) => (
            <div key={`${p.phase}-leg-${i}`} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: PHASE_COLOR[p.phase] }} />
              <span className="text-sm font-bold text-foreground">{t(`ob.prev.phase.${p.phase}`)}</span>
              <span className="tabular text-xs font-semibold text-muted-foreground">
                {p.weeks} {t("ob.prev.weeks")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ===== FIRST WEEK ===== */}
      {firstWeek && (
        <div className="v2-card p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl">{t("ob.prev.thisweek")}</h3>
            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
              <span className="tabular">{firstWeek.totalDistanceKm} {t("ob.prev.km")}</span>
              {firstWeek.isRecovery && (
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: "var(--secondary)", color: "var(--accent)" }}>
                  {t("ob.prev.recovery")}
                </span>
              )}
            </div>
          </div>
          <p className="mt-1 text-sm font-medium text-muted-foreground">{firstWeek.description}</p>

          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
            {WEEK_ORDER.map((d) => {
              const sessions = byDay.get(d) ?? [];
              return (
                <div
                  key={d}
                  className="min-h-[92px] rounded-2xl p-3"
                  style={{
                    background: sessions.length ? "var(--card)" : "transparent",
                    border: "1px solid var(--v2-hairline)",
                    opacity: sessions.length ? 1 : 0.55,
                  }}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    {t(`day.${d}`)}
                  </div>
                  {sessions.length === 0 ? (
                    <div className="mt-2 text-sm font-semibold text-muted-foreground">{t("ob.prev.rest")}</div>
                  ) : (
                    sessions.map((s, i) => (
                      <div key={i} className="mt-2 border-l-2 pl-2" style={{ borderColor: SESSION_TONE[s.type] }}>
                        <div className="text-sm font-bold leading-tight" style={{ color: SESSION_TONE[s.type] }}>
                          {t(`sessiontype.${s.type}`)}
                        </div>
                        <div className="tabular text-xs font-semibold text-muted-foreground">
                          {sessionDetail(s, lang)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== SAMPLE SESSION ===== */}
      {sample && (
        <div className="v2-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl">{t("ob.prev.sampleSession")}</h3>
            <span
              className="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider"
              style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}
            >
              {t("ob.prev.week")} {sample.week.weekNumber}
            </span>
          </div>
          <h4 className="mt-3 text-xl font-bold text-foreground">{sample.session.title}</h4>
          <p className="mt-1.5 text-sm font-medium leading-relaxed text-muted-foreground">
            {sample.session.description}
          </p>

          <div className="mt-5 space-y-2">
            {sample.session.structure.blocks.map((b, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-xl px-3.5 py-3"
                style={{ background: "color-mix(in oklab, var(--background) 50%, var(--card))", border: "1px solid var(--v2-hairline)" }}
              >
                <span
                  className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                  style={{ background: "var(--secondary)", color: "var(--foreground)" }}
                >
                  {(BLOCK_LABEL[b.type] ?? { sv: b.type, en: b.type })[lang]}
                  {b.repeats ? ` ×${b.repeats}` : ""}
                </span>
                <span className="text-sm font-medium text-foreground">{b.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== MOCK DISCLOSURE ===== */}
      <div
        className="rounded-2xl p-5"
        style={{ border: "1px dashed color-mix(in oklab, var(--accent) 40%, transparent)", background: "color-mix(in oklab, var(--accent) 6%, transparent)" }}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-accent" />
          <h4 className="text-sm font-black uppercase tracking-wider text-accent">{t("mock.title")}</h4>
        </div>
        <ul className="mt-3 space-y-2 text-sm font-medium leading-relaxed text-muted-foreground">
          <li>✓ {t("mock.real")}</li>
          <li>• {t("mock.persist")}</li>
          <li>• {t("mock.sport")}</li>
          <li>• {t("mock.threshold")}</li>
        </ul>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/auth/signup"
          className="v2-ring-focus v2-transition group inline-flex flex-1 items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground"
          style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
        >
          {t("ob.prev.cta")}
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="v2-ring-focus v2-transition inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-foreground hover:bg-[var(--secondary)]"
          style={{ border: "1px solid var(--v2-hairline)" }}
        >
          <RotateCcw className="h-4 w-4" />
          {t("ob.prev.restart")}
        </button>
      </div>
    </div>
  );
}

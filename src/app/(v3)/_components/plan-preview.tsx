"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Flag, Info, RotateCcw } from "lucide-react";
import type { Race } from "@/lib/races";
import type { SessionType, PlanPhase } from "@/types/database";
import type { PlannedSession, WeekPlan } from "@/lib/plan-generator";
import { formatPace } from "@/lib/plan-generator";
import { useV3I18n, type Language } from "../_lib/i18n";
import { daysUntil, formatDayLabel, formatRaceDate, raceTexture } from "../_lib/race-meta";
import { formatTime } from "../_lib/pace";
import {
  DEDICATED_SPORTS,
  anchorOptionLabel,
  formatSportDistance,
  formatThresholdValue,
  sportTarget,
} from "../_lib/sport";
import type { PreviewResult } from "../_lib/preview-plan";
import { CountUp, EASE, Reveal, SplitWords, Stagger, StaggerItem } from "./motion";
import { CourseProfile } from "./course-profile";

/* ---------------------------------------------------------------- colors */

const PHASE_COLOR: Record<PlanPhase, string> = {
  base: "var(--v3-phase-base)",
  build: "var(--v3-phase-build)",
  peak: "var(--v3-phase-peak)",
  taper: "var(--v3-phase-taper)",
  race: "var(--v3-phase-race)",
};

const TYPE_COLOR: Record<SessionType, string> = {
  easy: "var(--v3-phase-base)",
  recovery: "var(--muted-foreground)",
  long: "var(--v3-violet)",
  tempo: "var(--v3-cyan)",
  intervals: "var(--v3-ember)",
  hills: "var(--v3-ember)",
  strength: "var(--muted-foreground)",
  race: "var(--v3-phase-race)",
  rest: "var(--muted-foreground)",
  cross_training: "var(--muted-foreground)",
};

const BLOCK_LABEL: Record<string, { sv: string; en: string }> = {
  warmup: { sv: "Uppvärmning", en: "Warm-up" },
  main: { sv: "Huvuddel", en: "Main set" },
  cooldown: { sv: "Nedvarvning", en: "Cool-down" },
  interval: { sv: "Intervall", en: "Interval" },
  recovery: { sv: "Vila", en: "Recovery" },
};

/** The session's headline effort: sport-native target (W / per 100 m / ski
 *  pace) when a dedicated sport threshold exists, otherwise the run pace. */
function targetLabel(s: PlannedSession, result: PreviewResult): string | null {
  if (result.sportThreshold) return sportTarget(result.sportThreshold, s.type)?.label ?? null;
  return s.targetPaceMinKm ? `${formatPace(s.targetPaceMinKm)} /km` : null;
}

/* ---------------------------------------------------------- phase journey */

function PhaseJourney({ result }: { result: PreviewResult }) {
  const { t, lang } = useV3I18n();
  const total = result.planWeeks;
  // The engine caps plans at 24 weeks, so week 1 may start later than today —
  // label the left edge with the real start date when it does.
  const planStart = new Date(result.weeks[0].startsOn);
  const startsNow = daysUntil(planStart) < 10;
  const startLabel = startsNow ? t("prev.journey.today") : formatDayLabel(planStart, lang);

  return (
    <div>
      <div className="v3-mono mb-2 flex justify-between text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        <span>▸ {startLabel}</span>
        <span className="text-[var(--v3-ember)]">{t("prev.journey.race")} ⚑</span>
      </div>
      <div className="flex h-16 w-full gap-1 overflow-hidden rounded-xl">
        {result.phases.map((seg, i) => (
          <motion.div
            key={`${seg.phase}-${i}`}
            className="group relative min-w-0"
            style={{ flexGrow: seg.weeks, flexBasis: 0 }}
            initial={{ scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.12 }}
          >
            <div
              className="flex h-full flex-col justify-between rounded-lg px-2.5 py-2"
              style={{ backgroundColor: `color-mix(in oklab, ${PHASE_COLOR[seg.phase]} 16%, transparent)` }}
            >
              <span className="h-1 w-full rounded-full" style={{ backgroundColor: PHASE_COLOR[seg.phase] }} />
              <div className="min-w-0">
                <div className="truncate text-xs font-bold uppercase tracking-wider" style={{ color: PHASE_COLOR[seg.phase] }}>
                  {t(`prev.phase.${seg.phase}`)}
                </div>
                <div className="v3-mono truncate text-[10px] text-[var(--muted-foreground)]">
                  {seg.weeks} {seg.weeks === 1 ? "v" : t("prev.weeks").slice(0, 1)}
                  {" · "}
                  <span className="hidden sm:inline">{t(`prev.phase.${seg.phase}.d`)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {/* recovery week ticks */}
      <div className="relative mt-1.5 h-3">
        {result.weeks.map(
          (w, i) =>
            w.isRecovery && (
              <span
                key={w.weekNumber}
                title={`${t("prev.volume.recovery")} · v${w.weekNumber}`}
                className="absolute top-0 size-1.5 -translate-x-1/2 rounded-full bg-[var(--v3-cyan)] opacity-70"
                style={{ left: `${((i + 0.5) / total) * 100}%` }}
              />
            )
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- volume chart */

function VolumeChart({ result }: { result: PreviewResult }) {
  const { t } = useV3I18n();
  const maxKm = Math.max(...result.weeks.map((w) => w.totalDistanceKm), 1);

  return (
    <div>
      <div className="flex h-36 items-end gap-[3px] sm:h-44 sm:gap-1.5">
        {result.weeks.map((w, i) => {
          const h = Math.max(6, (w.totalDistanceKm / maxKm) * 100);
          const isRace = w.phase === "race";
          return (
            <motion.div
              key={w.weekNumber}
              className="group relative flex-1"
              style={{ height: `${h}%` }}
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, ease: EASE, delay: 0.1 + i * 0.03 }}
            >
              <div
                className={`h-full w-full rounded-t-md transition-opacity ${w.isRecovery ? "opacity-40" : "opacity-90"} group-hover:opacity-100`}
                style={{
                  transformOrigin: "bottom",
                  backgroundColor: PHASE_COLOR[w.phase],
                  ...(w.isRecovery
                    ? { backgroundImage: "repeating-linear-gradient(-45deg, transparent 0 3px, var(--background) 3px 5px)" }
                    : null),
                }}
              />
              {isRace && (
                <Flag className="absolute -top-5 left-1/2 size-3.5 -translate-x-1/2 text-[var(--v3-ember)]" aria-hidden />
              )}
              {/* hover tooltip */}
              <div className="v3-mono pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--v3-hairline-strong)] bg-[var(--popover)] px-2 py-1 text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
                v{w.weekNumber} · {Math.round(w.totalDistanceKm)} {t("prev.km")}
                {w.isRecovery ? ` · ${t("prev.volume.recovery")}` : ""}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="v3-mono mt-2 flex justify-between text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        <span>v1</span>
        <span>v{result.planWeeks}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ first week */

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

function FirstWeek({ result, lang }: { result: PreviewResult; lang: Language }) {
  const { t } = useV3I18n();
  const week = result.weeks[0];
  const start = new Date(week.startsOn);

  const byDay = useMemo(() => {
    const m = new Map<number, PlannedSession[]>();
    for (const s of week.sessions) {
      const list = m.get(s.dayOfWeek) ?? [];
      list.push(s);
      m.set(s.dayOfWeek, list);
    }
    return m;
  }, [week]);

  return (
    <Stagger className="grid gap-2 sm:grid-cols-7" stagger={0.06}>
      {WEEK_ORDER.map((day) => {
        const sessions = byDay.get(day) ?? [];
        const offset = (day - start.getDay() + 7) % 7;
        const date = new Date(start.getTime() + offset * 86400000);
        const rest = sessions.length === 0;
        return (
          <StaggerItem key={day}>
            <div
              className={`flex h-full min-h-28 flex-col rounded-xl border p-3 ${
                rest
                  ? "border-[var(--v3-hairline)] opacity-55"
                  : "v3-card border-[var(--v3-hairline)]"
              }`}
            >
              <div className="v3-mono text-[10px] uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                {formatDayLabel(date, lang)}
              </div>
              {rest ? (
                <div className="mt-auto pb-1 text-sm font-semibold text-[var(--muted-foreground)]">
                  {t("prev.rest")}
                </div>
              ) : (
                <div className="mt-2 grid gap-2">
                  {sessions.map((s, i) => (
                    <div key={i}>
                      <span
                        className="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{
                          color: TYPE_COLOR[s.type],
                          backgroundColor: `color-mix(in oklab, ${TYPE_COLOR[s.type]} 14%, transparent)`,
                        }}
                      >
                        {t(`sessiontype.${s.type}`)}
                      </span>
                      {/* Pace-first (spec hard rule): the pace is the headline number */}
                      {targetLabel(s, result) && (
                        <div className="v3-mono mt-1.5 text-sm font-bold">{targetLabel(s, result)}</div>
                      )}
                      <div className="v3-mono mt-0.5 text-[11px] text-[var(--muted-foreground)]">
                        {s.distanceKm ? formatSportDistance(result.sport, s.distanceKm, lang) : null}
                        {s.distanceKm && s.durationMinutes ? " · " : null}
                        {s.durationMinutes ? `${s.durationMinutes} min` : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StaggerItem>
        );
      })}
    </Stagger>
  );
}

/* --------------------------------------------------------- session detail */

function pickShowcaseSession(weeks: WeekPlan[]): { session: PlannedSession; week: WeekPlan } {
  for (const week of weeks.slice(0, 3)) {
    const quality = week.sessions.find((s) => ["tempo", "intervals", "hills"].includes(s.type));
    if (quality) return { session: quality, week };
  }
  const week = weeks[0];
  const long = week.sessions.find((s) => s.type === "long");
  return { session: long ?? week.sessions[0], week };
}

function SessionDetail({ result, race, lang }: { result: PreviewResult; race: Race; lang: Language }) {
  const { t } = useV3I18n();
  const { session, week } = useMemo(() => pickShowcaseSession(result.weeks), [result]);
  const start = new Date(week.startsOn);
  const offset = (session.dayOfWeek - start.getDay() + 7) % 7;
  const date = new Date(start.getTime() + offset * 86400000);

  return (
    <div className="v3-card v3-glow overflow-hidden">
      <div className="border-b border-[var(--v3-hairline)] p-6 sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider"
            style={{
              color: TYPE_COLOR[session.type],
              backgroundColor: `color-mix(in oklab, ${TYPE_COLOR[session.type]} 14%, transparent)`,
            }}
          >
            {t(`sessiontype.${session.type}`)}
          </span>
          <span className="v3-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {formatDayLabel(date, lang)} · {lang === "sv" ? "vecka" : "week"} {week.weekNumber}
          </span>
        </div>
        <h3 className="mt-3 text-2xl sm:text-3xl">{session.title}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted-foreground)]">{session.description}</p>

        <div className="v3-mono mt-5 flex flex-wrap gap-6 text-sm">
          {targetLabel(session, result) && (
            <div>
              <div className="text-xl font-bold text-[var(--v3-cyan)]">{targetLabel(session, result)}</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("prev.session.pace")}
              </div>
            </div>
          )}
          {session.durationMinutes && (
            <div>
              <div className="text-xl font-bold">{session.durationMinutes} min</div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("prev.session.time")}
              </div>
            </div>
          )}
          {session.distanceKm && (
            <div>
              <div className="text-xl font-bold">
                {formatSportDistance(result.sport, session.distanceKm, lang)}
              </div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                {t("prev.session.distance")}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-0 sm:grid-cols-2">
        <div className="border-b border-[var(--v3-hairline)] p-6 sm:border-b-0 sm:border-r sm:p-7">
          <div className="v3-eyebrow">{t("prev.session.structure")}</div>
          <ol className="mt-4 grid gap-3">
            {session.structure.blocks.map((b, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span
                  className="mt-0.5 h-full w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: b.type === "main" || b.type === "interval" ? "var(--v3-cyan)" : "var(--v3-hairline-strong)" }}
                  aria-hidden
                />
                <div>
                  <span className="font-bold">
                    {(BLOCK_LABEL[b.type] ?? BLOCK_LABEL.main)[lang]}
                    {b.repeats ? ` × ${b.repeats}` : ""}
                  </span>
                  <p className="mt-0.5 leading-relaxed text-[var(--muted-foreground)]">{b.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-6 sm:p-7">
          <div className="v3-eyebrow">{t("prev.session.why")}</div>
          <p className="mt-4 text-sm leading-relaxed text-[var(--muted-foreground)]">
            {t(`why.${session.type}`, { race: race.name })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- mock panel */

function MockPanel({ race, result }: { race: Race; result: PreviewResult }) {
  const { t } = useV3I18n();
  const dedicated = DEDICATED_SPORTS.includes(race.sport);
  const items = [
    { real: true, text: t("mock.real") },
    { real: false, text: t("mock.date") },
    dedicated ? { real: false, text: t("mock.persistSport") } : { real: true, text: t("mock.persistReal") },
    ...(dedicated ? [{ real: false, text: t("mock.sportConvert") }] : []),
    ...(!dedicated && race.sport !== "running" ? [{ real: false, text: t("mock.sport") }] : []),
    (result.sportThreshold ? result.sportThreshold.fromResult : Boolean(result.raceResult))
      ? { real: true, text: t("mock.thresholdReal") }
      : { real: false, text: t("mock.threshold") },
    ...(result.goalPace || result.sportGoal ? [{ real: false, text: t("mock.goalpace") }] : []),
    { real: false, text: t("mock.profiles") },
  ];
  return (
    <div className="rounded-2xl border border-dashed border-[var(--v3-hairline-strong)] p-6">
      <div className="flex items-center gap-2">
        <Info className="size-4 text-[var(--muted-foreground)]" aria-hidden />
        <h3 className="text-sm font-bold uppercase tracking-wider">{t("mock.title")}</h3>
      </div>
      <ul className="mt-4 grid gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 text-xs leading-relaxed text-[var(--muted-foreground)]">
            <span
              className={`v3-mono mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                item.real
                  ? "bg-[color-mix(in_oklab,var(--v3-cyan)_16%,transparent)] text-[var(--v3-cyan)]"
                  : "bg-[color-mix(in_oklab,var(--v3-ember)_14%,transparent)] text-[var(--v3-ember)]"
              }`}
            >
              {item.real ? "REAL" : "MOCK"}
            </span>
            <span>{item.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------- composite */

export function PlanPreview({
  race,
  result,
  onRestart,
  onSave,
}: {
  race: Race;
  result: PreviewResult;
  onRestart: () => void;
  onSave: () => void;
}) {
  const { t, lang } = useV3I18n();
  const days = daysUntil(result.raceDate);

  const stats = [
    { value: days, label: t("prev.days"), accent: "var(--v3-ember)" },
    { value: result.planWeeks, label: t("prev.weeks") },
    { value: result.totalSessions, label: t("prev.sessions") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24">
      {/* header */}
      <header className="pt-4 text-center">
        <motion.p
          className="v3-eyebrow inline-flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="v3-blink inline-block size-1.5 rounded-full bg-[var(--v3-cyan)]" aria-hidden />
          {t("prev.eyebrow")}
        </motion.p>
        <h1 className="mt-4">
          <span className="block font-sans text-base font-semibold text-[var(--muted-foreground)]">
            {t("prev.headline.pre")}
          </span>
          <SplitWords
            text={race.name}
            className="v3-display mt-1 block"
            wordClassName="v3-gradient-text"
            delay={0.15}
          />
        </h1>
        <p className="v3-mono mt-4 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
          {formatRaceDate(result.raceDate, lang)} · {raceTexture(race, lang)}
        </p>
      </header>

      {/* the course, drawn as the hero */}
      <Reveal delay={0.25}>
        <CourseProfile race={race} className="mt-6 h-48 w-full sm:h-56" loopSeconds={11} />
      </Reveal>

      {/* stat band */}
      <Reveal delay={0.1}>
        <dl
          className={`v3-card mt-8 grid grid-cols-2 divide-[var(--v3-hairline)] sm:divide-x ${
            result.goalPace || result.sportGoal ? "sm:grid-cols-5" : "sm:grid-cols-4"
          }`}
        >
          {stats.map((s) => (
            <div key={s.label} className="p-5 text-center">
              <dd className="v3-mono text-3xl font-bold sm:text-4xl" style={{ color: s.accent ?? "var(--foreground)" }}>
                <CountUp to={s.value} />
              </dd>
              <dt className="v3-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {s.label}
              </dt>
            </div>
          ))}
          <div className="p-5 text-center">
            <dd className="v3-mono text-3xl font-bold text-[var(--v3-cyan)] sm:text-4xl">
              {result.sportThreshold
                ? formatThresholdValue(result.sportThreshold.kind, result.sportThreshold.value)
                : result.thresholdPaceLabel}
              {!result.sportThreshold && (
                <span className="text-sm font-normal text-[var(--muted-foreground)]"> /km</span>
              )}
            </dd>
            <dt className="v3-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {result.sportThreshold?.kind === "power"
                ? t("prev.threshold.power")
                : result.sportThreshold?.kind === "css"
                  ? t("prev.threshold.css")
                  : t("prev.threshold")}
            </dt>
          </div>
          {result.goalPace && (
            <div className="p-5 text-center">
              <dd className="v3-mono text-3xl font-bold text-[var(--v3-ember)] sm:text-4xl">
                ~{formatPace(result.goalPace.paceMinKm)}
                <span className="text-sm font-normal text-[var(--muted-foreground)]"> /km</span>
              </dd>
              <dt className="v3-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {t("prev.goalpace")} · {t("prev.goalpace.finish", { time: formatTime(result.goalPace.finishSeconds) })}
              </dt>
            </div>
          )}
          {result.sportGoal && result.sportThreshold && (
            <div className="p-5 text-center">
              <dd className="v3-mono text-3xl font-bold text-[var(--v3-ember)] sm:text-4xl">
                ~{formatThresholdValue(result.sportThreshold.kind, result.sportGoal.value)}
              </dd>
              <dt className="v3-mono mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {t("prev.goalpace")}
                {result.sportGoal.finishSeconds
                  ? ` · ${t("prev.goalpace.finish", { time: formatTime(result.sportGoal.finishSeconds) })}`
                  : ""}
              </dt>
            </div>
          )}
        </dl>
      </Reveal>

      {/* what the levels are anchored in */}
      <Reveal delay={0.16}>
        <p className="v3-mono mt-4 text-center text-[11px] leading-relaxed tracking-[0.04em] text-[var(--muted-foreground)]">
          <span aria-hidden>ⓘ </span>
          {result.sportThreshold
            ? result.sportThreshold.fromResult && result.sportAnchor
              ? result.sportThreshold.kind === "power"
                ? t("prev.basis.sport.ftp", {
                    threshold: formatThresholdValue("power", result.sportThreshold.value),
                  })
                : t("prev.basis.sport.time", {
                    threshold: formatThresholdValue(result.sportThreshold.kind, result.sportThreshold.value),
                    dist: anchorOptionLabel(result.sport, result.sportAnchor.key, lang),
                    time: formatTime(result.sportAnchor.seconds ?? 0),
                  })
              : t("prev.basis.sport.estimate", {
                  threshold: formatThresholdValue(result.sportThreshold.kind, result.sportThreshold.value),
                })
            : result.raceResult
              ? t("prev.basis.result", {
                  threshold: result.thresholdPaceLabel,
                  dist: t(`dist.${result.raceResult.distance}`),
                  time: formatTime(result.raceResult.seconds),
                })
              : t("prev.basis.estimate", { threshold: result.thresholdPaceLabel })}
        </p>
      </Reveal>

      {/* journey */}
      <section className="mt-16">
        <Reveal>
          <h2 className="v3-h2">{t("prev.journey")}</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="mt-7">
            <PhaseJourney result={result} />
          </div>
        </Reveal>
      </section>

      {/* volume */}
      <section className="mt-16">
        <Reveal>
          <h2 className="v3-h3">{t("prev.volume")}</h2>
          <p className="v3-mono mt-1 text-xs text-[var(--muted-foreground)]">{t("prev.volume.sub")}</p>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="v3-card mt-6 p-5 sm:p-6">
            <VolumeChart result={result} />
          </div>
        </Reveal>
      </section>

      {/* first week */}
      <section className="mt-16">
        <Reveal>
          <h2 className="v3-h3">{t("prev.week1")}</h2>
          <p className="v3-mono mt-1 text-xs text-[var(--muted-foreground)]">
            {t("prev.week1.sub", { date: formatDayLabel(new Date(result.weeks[0].startsOn), lang) })}
          </p>
        </Reveal>
        <div className="mt-6">
          <FirstWeek result={result} lang={lang} />
        </div>
      </section>

      {/* one session in detail */}
      <section className="mt-16">
        <Reveal>
          <h2 className="v3-h3">{t("prev.session.detail")}</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <div className="mt-6">
            <SessionDetail result={result} race={race} lang={lang} />
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <Reveal>
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <button type="button" className="v3-btn v3-btn-primary !px-9 !py-4 !text-base" onClick={onSave}>
            {t("prev.cta")}
            <ArrowRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          >
            <RotateCcw className="size-3.5" />
            {t("prev.restart")}
          </button>
        </div>
      </Reveal>

      {/* honesty panel */}
      <Reveal>
        <div className="mt-16">
          <MockPanel race={race} result={result} />
        </div>
      </Reveal>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Gauge, Heart, Zap, Waves, Lightbulb } from "lucide-react";
import { formatPace, type PlannedSession } from "@/lib/plan-generator";
import type { SessionType } from "@/types/database";
import { useV2I18n, type Language } from "../../../_lib/i18n";
import { formatDayLabel } from "../../../_lib/race-meta";
import { SESSION_TONE, SESSION_ICON, BLOCK_LABEL, PHASE_COLOR } from "../../../_lib/session-style";
import { getSessionById, getAppPlan } from "../../../_lib/mock-app-data";
import { MockNote, MockTag } from "../../../_components/app-ui";

/* Effort tier per session type — drives the qualitative zone + mock power/CSS. */
const EFFORT: Record<SessionType, "easy" | "moderate" | "hard" | "rest"> = {
  easy: "easy",
  recovery: "easy",
  cross_training: "easy",
  long: "moderate",
  tempo: "moderate",
  hills: "moderate",
  strength: "moderate",
  intervals: "hard",
  race: "hard",
  rest: "rest",
};

/* Illustrative cross-sport equivalents (running plan → shown as examples). MOCK. */
const MOCK_POWER: Record<string, string> = { easy: "175 W", moderate: "215 W", hard: "255 W", rest: "—" };
const MOCK_CSS: Record<string, string> = { easy: "1:48", moderate: "1:42", hard: "1:36", rest: "—" };

function blockMetric(b: PlannedSession["structure"]["blocks"][number]): string {
  const parts: string[] = [];
  if (b.distance_km) parts.push(`${b.distance_km} km`);
  if (b.duration_minutes) parts.push(`${b.duration_minutes} min`);
  if (b.target_pace_min_km) parts.push(`${formatPace(b.target_pace_min_km)} /km`);
  return parts.join(" · ");
}

export default function SessionPage() {
  const { lang, t } = useV2I18n();
  const params = useParams<{ id: string }>();
  const found = getSessionById(params.id);
  const [done, setDone] = useState(false);

  if (!found) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <p className="text-lg font-bold text-muted-foreground">{t("sess.notFound")}</p>
        <Link href="/v2/app/plan" className="v2-ring-focus mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent">
          <ArrowLeft className="h-4 w-4" />
          {t("sess.back")}
        </Link>
      </div>
    );
  }

  const { session, week } = found;
  const plan = getAppPlan();
  const Icon = SESSION_ICON[session.type];
  const tone = SESSION_TONE[session.type];
  const effort = EFFORT[session.type];
  const blocks = session.structure?.blocks ?? [];

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <Link
        href="/v2/app/plan"
        className="v2-ring-focus v2-transition inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("sess.back")}
      </Link>

      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mt-5 flex items-start gap-4"
      >
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: tone }}
        >
          <Icon className="h-8 w-8" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: tone }}>
              {t(`sessiontype.${session.type}`)}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
              style={{ background: `color-mix(in oklab, ${PHASE_COLOR[week.phase]} 18%, transparent)`, color: PHASE_COLOR[week.phase] }}
            >
              {t(`ob.prev.phase.${week.phase}`)} · {t("common.week")} {week.weekNumber}
            </span>
          </div>
          <h1 className="mt-1.5 text-3xl sm:text-4xl">{session.title}</h1>
          <p className="tabular mt-1 text-sm font-semibold text-muted-foreground">{formatDayLabel(session.date, lang)}</p>
        </div>
      </motion.div>

      {/* ===== TARGET ZONES ===== */}
      <div className="v2-card mt-7 p-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">{t("sess.zones")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Zone icon={Gauge} label={t("sess.zone.pace")} value={session.targetPaceMinKm ? formatPace(session.targetPaceMinKm) : "—"} unit="/km" />
          <Zone icon={Heart} label={t("sess.zone.hr")} value={session.targetHrZone ? `${t("sess.zone.hrUnit")} ${session.targetHrZone}` : "—"} />
          <Zone icon={Zap} label={t("sess.zone.power")} value={MOCK_POWER[effort]} mock />
          <Zone icon={Waves} label={t("sess.zone.css")} value={MOCK_CSS[effort]} unit="/100m" mock />
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "var(--secondary)" }}>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("sess.zone.effort")}:</span>
          <span className="text-sm font-bold" style={{ color: tone }}>{t(`sess.effort.${effort}`)}</span>
        </div>
      </div>

      {/* ===== WHY THIS SESSION ===== */}
      <div
        className="mt-4 rounded-2xl p-6"
        style={{ background: "color-mix(in oklab, var(--accent) 7%, var(--card))", border: "1px solid color-mix(in oklab, var(--accent) 22%, transparent)" }}
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-black uppercase tracking-wider text-accent">{t("sess.why")}</h2>
        </div>
        <p className="mt-3 text-base font-medium leading-relaxed text-foreground">
          {t(`why.${session.type}`, { race: plan.race.name })}
        </p>
      </div>

      {/* ===== STRUCTURE ===== */}
      {blocks.length > 0 && (
        <div className="v2-card mt-4 p-6">
          <h2 className="text-2xl">{t("sess.structure")}</h2>
          <div className="mt-4 space-y-2.5">
            {blocks.map((b, i) => {
              const metric = blockMetric(b);
              return (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-xl px-4 py-3"
                  style={{ background: "color-mix(in oklab, var(--background) 50%, var(--card))", border: "1px solid var(--v2-hairline)" }}
                >
                  <span
                    className="mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                    style={{ background: "var(--secondary)", color: "var(--foreground)" }}
                  >
                    {(BLOCK_LABEL[b.type] ?? { sv: b.type, en: b.type })[lang as Language]}
                    {b.repeats ? ` ×${b.repeats}` : ""}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{b.description}</p>
                    {metric && <p className="tabular mt-0.5 text-xs font-semibold text-muted-foreground">{metric}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== ACTIONS + MOCK ===== */}
      <button
        type="button"
        onClick={() => setDone((d) => !d)}
        className="v2-ring-focus v2-transition mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold"
        style={
          done
            ? { background: "color-mix(in oklab, var(--primary) 16%, transparent)", color: "var(--accent)", border: "1px solid color-mix(in oklab, var(--accent) 30%, transparent)" }
            : { background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 14px 40px -14px var(--glow)" }
        }
      >
        <Check className="h-4 w-4" />
        {done ? t("home.done") : t("sess.markDone")}
        {done && <MockTag />}
      </button>

      <div className="mt-4">
        <MockNote>{t("mock.app.zones")}</MockNote>
      </div>
    </div>
  );
}

function Zone({
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
    <div
      className="rounded-2xl p-3.5"
      style={{ background: "color-mix(in oklab, var(--background) 45%, var(--card))", border: "1px solid var(--v2-hairline)" }}
    >
      <div className="flex items-center justify-between">
        <Icon className="h-4 w-4 text-accent" />
        {mock && <MockTag />}
      </div>
      <div className="tabular mt-2.5 text-lg font-bold text-foreground">
        {value}
        {unit && value !== "—" && <span className="ml-0.5 text-[11px] font-semibold text-muted-foreground">{unit}</span>}
      </div>
      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

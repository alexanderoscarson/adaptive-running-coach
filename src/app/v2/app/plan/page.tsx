"use client";

import { motion } from "framer-motion";
import { useV2I18n } from "../../_lib/i18n";
import { formatDayLabel } from "../../_lib/race-meta";
import { PHASE_COLOR } from "../../_lib/session-style";
import { getAppPlan, getCurrentWeek, daysToRace } from "../../_lib/mock-app-data";
import { PageHeader, MockNote } from "../../_components/app-ui";
import { WeekStrip } from "../../_components/week-strip";

export default function PlanPage() {
  const { lang, t } = useV2I18n();
  const plan = getAppPlan();
  const currentWeek = getCurrentWeek().weekNumber;
  const days = daysToRace();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <PageHeader
        eyebrow={t("plan.eyebrow")}
        title={t("plan.title", { race: plan.race.name })}
        sub={t("plan.sub", { weeks: String(plan.planWeeks), days: String(days) })}
      />

      {/* ===== PHASE TIMELINE ===== */}
      <div className="v2-card mt-8 p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">{t("plan.legend")}</h3>
        <div className="mt-4 flex h-3 w-full overflow-hidden rounded-full" style={{ background: "var(--secondary)" }}>
          {plan.preview.phases.map((p, i) => (
            <motion.div
              key={`${p.phase}-${i}`}
              initial={{ width: 0 }}
              animate={{ width: `${(p.weeks / plan.planWeeks) * 100}%` }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              style={{ background: PHASE_COLOR[p.phase] }}
              title={`${t(`ob.prev.phase.${p.phase}`)} · ${p.weeks} ${t("ob.prev.weeks")}`}
            />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
          {plan.preview.phases.map((p, i) => (
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

      {/* ===== WEEK-BY-WEEK ===== */}
      <div className="mt-4 space-y-3">
        {plan.weeks.map((week, i) => {
          const isCurrent = week.weekNumber === currentWeek;
          const isRace = week.phase === "race";
          return (
            <motion.section
              key={week.weekNumber}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.015, 0.2) }}
              className="v2-card p-5"
              style={
                isCurrent
                  ? { borderColor: "color-mix(in oklab, var(--primary) 55%, transparent)", boxShadow: "0 0 0 1px color-mix(in oklab, var(--primary) 30%, transparent)" }
                  : undefined
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-sm font-black tabular"
                    style={{ background: "color-mix(in oklab, var(--primary) 12%, transparent)", color: "var(--foreground)" }}
                  >
                    {week.weekNumber}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                        style={{ background: `color-mix(in oklab, ${PHASE_COLOR[week.phase]} 18%, transparent)`, color: PHASE_COLOR[week.phase] }}
                      >
                        {t(`ob.prev.phase.${week.phase}`)}
                      </span>
                      {isCurrent && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                        >
                          {t("plan.thisWeek")}
                        </span>
                      )}
                      {week.isRecovery && !isRace && (
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider"
                          style={{ background: "var(--secondary)", color: "var(--accent)" }}
                        >
                          {t("home.week.recovery")}
                        </span>
                      )}
                    </div>
                    <div className="tabular mt-1 text-xs font-semibold text-muted-foreground">
                      {formatDayLabel(week.weekStart, lang)} – {formatDayLabel(week.weekEnd, lang)}
                    </div>
                  </div>
                </div>
                <div className="tabular text-right text-sm font-bold text-foreground">
                  {week.totalDistanceKm}
                  <span className="ml-1 text-xs font-semibold text-muted-foreground">{t("common.km")}</span>
                </div>
              </div>

              <div className="mt-4">
                <WeekStrip week={week} compact />
              </div>
            </motion.section>
          );
        })}
      </div>

      <div className="mt-6">
        <MockNote>{t("mock.app.plan")}</MockNote>
      </div>
    </div>
  );
}

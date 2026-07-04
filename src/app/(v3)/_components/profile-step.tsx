"use client";

import { motion } from "framer-motion";
import { useV3I18n } from "../_lib/i18n";
import type { ExperienceTier } from "../_lib/preview-plan";
import { EASE } from "./motion";

const EXPERIENCES: ExperienceTier[] = ["beginner", "intermediate", "advanced", "elite"];
const DAYS_RANGE = [2, 3, 4, 5, 6];
const LONG_DAYS = [1, 2, 3, 4, 5, 6, 0]; // mån..sön

export interface ProfileValue {
  experience: ExperienceTier;
  daysPerWeek: number;
  weeklyKm: number;
  longRunDay: number;
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-sm font-bold uppercase tracking-wider">{children}</span>
      {hint && <span className="v3-mono text-xs text-[var(--muted-foreground)]">{hint}</span>}
    </div>
  );
}

export function ProfileStep({
  value,
  onChange,
}: {
  value: ProfileValue;
  onChange: (next: ProfileValue) => void;
}) {
  const { t } = useV3I18n();
  const sliderFill = Math.min(100, (value.weeklyKm / 120) * 100);

  return (
    <div className="grid gap-9">
      {/* experience */}
      <fieldset>
        <legend className="w-full">
          <FieldLabel>{t("ob.you.exp")}</FieldLabel>
        </legend>
        <div role="radiogroup" aria-label={t("ob.you.exp")} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXPERIENCES.map((exp) => {
            const active = value.experience === exp;
            return (
              <button
                key={exp}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...value, experience: exp })}
                className={`v3-card v3-lift p-4 text-left transition-shadow ${
                  active ? "v3-glow-strong !border-[var(--primary)]" : ""
                }`}
              >
                <span className={`v3-h3 block !text-lg ${active ? "text-[var(--v3-electric-bright)]" : ""}`}>
                  {t(`ob.you.exp.${exp}`)}
                </span>
                <span className="mt-1.5 block text-xs leading-relaxed text-[var(--muted-foreground)]">
                  {t(`ob.you.exp.${exp}.d`)}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* days per week */}
      <fieldset>
        <legend className="w-full">
          <FieldLabel hint={`${value.daysPerWeek} ${t("ob.you.days.unit")}`}>{t("ob.you.days")}</FieldLabel>
        </legend>
        <div
          role="radiogroup"
          aria-label={t("ob.you.days")}
          className="relative mt-3 grid grid-cols-5 rounded-2xl border border-[var(--v3-hairline-strong)] bg-[var(--card)] p-1.5"
        >
          {DAYS_RANGE.map((d) => {
            const active = value.daysPerWeek === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...value, daysPerWeek: d })}
                className={`relative rounded-xl py-3.5 text-center transition-colors ${
                  active ? "text-white" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="days-pill"
                    className="absolute inset-0 rounded-xl bg-[var(--v3-electric)]"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
                <span className="v3-mono relative z-10 text-lg font-bold">{d}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* weekly volume */}
      <div>
        <FieldLabel hint={t("ob.you.volume.unit")}>{t("ob.you.volume")}</FieldLabel>
        <div className="v3-card mt-3 flex items-center gap-6 px-6 py-6">
          <input
            type="range"
            min={0}
            max={120}
            step={2}
            value={value.weeklyKm}
            aria-label={t("ob.you.volume")}
            onChange={(e) => onChange({ ...value, weeklyKm: Number(e.target.value) })}
            style={{ "--fill": `${sliderFill}%` } as React.CSSProperties}
          />
          <div className="w-24 shrink-0 text-right">
            <motion.span
              key={value.weeklyKm}
              initial={{ scale: 1.15, color: "var(--v3-cyan)" }}
              animate={{ scale: 1, color: "var(--foreground)" }}
              transition={{ duration: 0.3 }}
              className="v3-mono inline-block text-4xl font-bold leading-none"
            >
              {value.weeklyKm}
            </motion.span>
            <span className="v3-mono block text-[10px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
              km / v
            </span>
          </div>
        </div>
      </div>

      {/* long-run day */}
      <fieldset>
        <legend className="w-full">
          <FieldLabel>{t("ob.you.longday")}</FieldLabel>
        </legend>
        <div role="radiogroup" aria-label={t("ob.you.longday")} className="mt-3 flex flex-wrap gap-2">
          {LONG_DAYS.map((d) => {
            const active = value.longRunDay === d;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => onChange({ ...value, longRunDay: d })}
                className="v3-chip !px-5 !py-3 !text-sm"
                data-active={active}
              >
                {t(`day.${d}`)}
              </button>
            );
          })}
        </div>
      </fieldset>

      <p className="v3-mono text-xs uppercase tracking-[0.12em] text-[var(--muted-foreground)]">
        {t("ob.you.summary", {
          days: String(value.daysPerWeek),
          km: String(value.weeklyKm),
          day: t(`day.${value.longRunDay}`),
        })}
      </p>
    </div>
  );
}

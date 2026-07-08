"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Sport } from "@/lib/races";
import type { RaceDistance } from "@/types/database";
import { formatPace } from "@/lib/plan-generator";
import { useV3I18n } from "../_lib/i18n";
import type { ExperienceTier } from "../_lib/preview-plan";
import { RACE_DISTANCE_KM, isPlausibleResult, parseTimeToSeconds } from "../_lib/pace";
import {
  anchorOptions,
  deriveSportThreshold,
  formatThresholdValue,
  volumeConfig,
  type SportAnchorInput,
} from "../_lib/sport";
import { EASE } from "./motion";

const EXPERIENCES: ExperienceTier[] = ["beginner", "intermediate", "advanced", "elite"];
const DAYS_RANGE = [2, 3, 4, 5, 6];
const LONG_DAYS = [1, 2, 3, 4, 5, 6, 0]; // mån..sön
const RESULT_DISTANCES: RaceDistance[] = ["5k", "10k", "half_marathon", "marathon"];
const TIME_EXAMPLE: Record<RaceDistance, string> = {
  "5k": "24:30",
  "10k": "52:00",
  half_marathon: "1:55:00",
  marathon: "4:05:00",
};

export interface ProfileValue {
  experience: ExperienceTier;
  daysPerWeek: number;
  /** Weekly volume in the SPORT's km (converted to run-equivalent at generate). */
  weeklyKm: number;
  longRunDay: number;
  /** Latest running race result — distance + raw time text ("48:30", "1:45:00"). */
  resultDistance: RaceDistance | null;
  resultTime: string;
  /** Sport-native anchor for swim/bike/ski: option key + raw text (time or watts). */
  sportAnchorKey: string | null;
  sportAnchorValue: string;
}

/** Parse + sanity-check the entered running result. Exported so the flow
 *  controller can build the engine input from the same logic the UI uses. */
export function parseRaceResult(
  value: Pick<ProfileValue, "resultDistance" | "resultTime">
): { distance: RaceDistance; seconds: number } | null {
  if (!value.resultDistance) return null;
  const seconds = parseTimeToSeconds(value.resultTime);
  if (seconds === null) return null;
  const result = { distance: value.resultDistance, seconds };
  return isPlausibleResult(result) ? result : null;
}

/** Parse the sport-native anchor (swim/ski time or bike FTP). */
export function parseSportAnchor(
  sport: Sport,
  value: Pick<ProfileValue, "sportAnchorKey" | "sportAnchorValue">
): SportAnchorInput | null {
  if (!value.sportAnchorKey) return null;
  const opt = anchorOptions(sport).find((o) => o.key === value.sportAnchorKey);
  if (!opt) return null;
  if (opt.kind === "watts") {
    const watts = Number(value.sportAnchorValue.replace(/\D/g, ""));
    return watts >= 60 && watts <= 500 ? { key: opt.key, watts } : null;
  }
  const seconds = parseTimeToSeconds(value.sportAnchorValue);
  return seconds ? { key: opt.key, seconds } : null;
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
      <span className="shrink-0 text-sm font-bold uppercase tracking-wider">{children}</span>
      {hint && <span className="v3-mono text-xs text-[var(--muted-foreground)]">{hint}</span>}
    </div>
  );
}

export function ProfileStep({
  sport,
  value,
  onChange,
}: {
  sport: Sport;
  value: ProfileValue;
  onChange: (next: ProfileValue) => void;
}) {
  const { t, lang } = useV3I18n();
  const vol = volumeConfig(sport);
  const sliderFill = Math.min(100, (value.weeklyKm / vol.max) * 100);
  const sportOptions = anchorOptions(sport);
  const hasSportAnchor = sportOptions.length > 0;

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

      {/* sport-native anchor: swim/ski race time or bike FTP */}
      {hasSportAnchor && (
        <fieldset>
          <legend className="w-full">
            <FieldLabel hint={t(`ob.you.result.${sport}.sub`)}>{t(`ob.you.result.${sport}`)}</FieldLabel>
          </legend>
          <div role="radiogroup" aria-label={t(`ob.you.result.${sport}`)} className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              role="radio"
              aria-checked={value.sportAnchorKey === null}
              className="v3-chip !px-5 !py-3 !text-sm"
              data-active={value.sportAnchorKey === null}
              onClick={() => onChange({ ...value, sportAnchorKey: null, sportAnchorValue: "" })}
            >
              {t("ob.you.result.none")}
            </button>
            {sportOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                role="radio"
                aria-checked={value.sportAnchorKey === opt.key}
                className="v3-chip !px-5 !py-3 !text-sm"
                data-active={value.sportAnchorKey === opt.key}
                onClick={() => onChange({ ...value, sportAnchorKey: opt.key })}
              >
                {opt.label[lang]}
              </button>
            ))}
          </div>

          <AnimatePresence initial={false}>
            {value.sportAnchorKey && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="overflow-hidden"
              >
                {(() => {
                  const opt = sportOptions.find((o) => o.key === value.sportAnchorKey)!;
                  const parsed = parseSportAnchor(sport, value);
                  const invalid = value.sportAnchorValue.trim() !== "" && parsed === null;
                  const threshold = parsed ? deriveSportThreshold(sport, value.experience, parsed) : null;
                  return (
                    <div className="v3-card mt-3 flex flex-wrap items-center gap-5 px-6 py-5">
                      <label className="v3-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        {opt.kind === "watts" ? t("ob.you.result.watts") : `${t("ob.you.result.time")} · ${opt.label[lang]}`}
                        <input
                          type="text"
                          inputMode="numeric"
                          value={value.sportAnchorValue}
                          placeholder={opt.placeholder}
                          onChange={(e) => onChange({ ...value, sportAnchorValue: e.target.value })}
                          aria-invalid={invalid}
                          className="v3-mono mt-1.5 block w-40 rounded-xl border border-[var(--v3-hairline-strong)] bg-transparent px-4 py-3 text-2xl font-bold tracking-tight text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] placeholder:opacity-50 focus:border-[var(--primary)]"
                        />
                      </label>
                      <div aria-live="polite" className="min-w-0 text-sm">
                        {threshold ? (
                          <motion.span
                            key={threshold.value}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="v3-mono font-bold text-[var(--v3-cyan)]"
                          >
                            {t("ob.you.result.thresholdFeedback", {
                              value: formatThresholdValue(threshold.kind, threshold.value),
                            })}
                          </motion.span>
                        ) : invalid ? (
                          <span className="text-[var(--v3-ember)]">
                            {t("ob.you.result.invalid", { example: opt.placeholder })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </fieldset>
      )}

      {/* latest running race result — the pace anchor */}
      {!hasSportAnchor && (
      <fieldset>
        <legend className="w-full">
          <FieldLabel hint={t("ob.you.result.sub")}>{t("ob.you.result")}</FieldLabel>
        </legend>
        <div role="radiogroup" aria-label={t("ob.you.result")} className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            role="radio"
            aria-checked={value.resultDistance === null}
            className="v3-chip !px-5 !py-3 !text-sm"
            data-active={value.resultDistance === null}
            onClick={() => onChange({ ...value, resultDistance: null, resultTime: "" })}
          >
            {t("ob.you.result.none")}
          </button>
          {RESULT_DISTANCES.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={value.resultDistance === d}
              className="v3-chip !px-5 !py-3 !text-sm"
              data-active={value.resultDistance === d}
              onClick={() => onChange({ ...value, resultDistance: d })}
            >
              {t(`dist.${d}`)}
            </button>
          ))}
        </div>

        <AnimatePresence initial={false}>
          {value.resultDistance && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              {(() => {
                const dist = value.resultDistance as RaceDistance;
                const seconds = parseTimeToSeconds(value.resultTime);
                const parsed = parseRaceResult(value);
                const invalid = value.resultTime.trim() !== "" && parsed === null;
                return (
                  <div className="v3-card mt-3 flex flex-wrap items-center gap-5 px-6 py-5">
                    <label className="v3-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {t("ob.you.result.time")} · {t(`dist.${dist}`)}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value.resultTime}
                        placeholder={TIME_EXAMPLE[dist]}
                        onChange={(e) => onChange({ ...value, resultTime: e.target.value })}
                        aria-invalid={invalid}
                        className="v3-mono mt-1.5 block w-40 rounded-xl border border-[var(--v3-hairline-strong)] bg-transparent px-4 py-3 text-2xl font-bold tracking-tight text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)] placeholder:opacity-50 focus:border-[var(--primary)]"
                      />
                    </label>
                    <div aria-live="polite" className="min-w-0 text-sm">
                      {parsed && seconds !== null ? (
                        <motion.span
                          key={parsed.seconds}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="v3-mono font-bold text-[var(--v3-cyan)]"
                        >
                          {t("ob.you.result.pace", {
                            pace: formatPace(parsed.seconds / 60 / RACE_DISTANCE_KM[dist]),
                          })}
                        </motion.span>
                      ) : invalid ? (
                        <span className="text-[var(--v3-ember)]">
                          {t("ob.you.result.invalid", { example: TIME_EXAMPLE[dist] })}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>
      )}

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
            max={vol.max}
            step={vol.step}
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

"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, ArrowRight, X } from "lucide-react";
import { getRaceById, type Race } from "@/lib/races";
import { useV3I18n } from "../../_lib/i18n";
import { generateValidatedPlan } from "../../_lib/generate-plan";
import { clampPlanWeeks, nextRaceDate, weeksUntil } from "../../_lib/race-meta";
import { TIER_DEFAULT_KM, type PreviewResult } from "../../_lib/preview-plan";
import { EASE } from "../../_components/motion";
import { Wordmark } from "../../_components/topbar";
import { RacePicker } from "../../_components/race-picker";
import {
  ProfileStep,
  parseRaceResult,
  parseSportAnchor,
  type ProfileValue,
} from "../../_components/profile-step";
import { volumeConfig } from "../../_lib/sport";
import { track } from "../../_lib/smoke";
import { Generating } from "../../_components/generating";
import { PlanPreview } from "../../_components/plan-preview";
import { AccountStep } from "../../_components/account-step";

type Step = "race" | "you" | "generating" | "preview" | "account" | "error";

const STEP_INDEX: Record<Step, number> = {
  race: 0,
  you: 1,
  generating: 2,
  preview: 2,
  account: 2,
  error: 2,
};

function ProgressRail({ step, onBack }: { step: Step; onBack: (() => void) | null }) {
  const { t } = useV3I18n();
  const labels = [t("ob.progress.race"), t("ob.progress.you"), t("ob.progress.plan")];
  const active = STEP_INDEX[step];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--v3-hairline)] bg-[color-mix(in_oklab,var(--background)_84%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label={t("ob.back")}
              className="grid size-9 place-items-center rounded-full border border-[var(--v3-hairline-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="size-4" />
            </button>
          ) : (
            <Wordmark />
          )}
        </div>

        <ol className="flex items-center gap-2 sm:gap-3" aria-label="Progress">
          {labels.map((label, i) => (
            <li key={label} className="flex items-center gap-2 sm:gap-3">
              {i > 0 && (
                <span className="relative block h-px w-8 overflow-hidden bg-[var(--v3-hairline-strong)] sm:w-14" aria-hidden>
                  <motion.span
                    className="absolute inset-0 origin-left bg-[var(--v3-electric)]"
                    initial={false}
                    animate={{ scaleX: active >= i ? 1 : 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  />
                </span>
              )}
              <span
                aria-current={active === i ? "step" : undefined}
                className={`v3-mono text-[11px] font-bold uppercase tracking-[0.16em] transition-colors ${
                  active >= i ? "text-[var(--foreground)]" : "text-[var(--muted-foreground)]"
                }`}
              >
                <span
                  className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${
                    active > i ? "bg-[var(--v3-cyan)]" : active === i ? "bg-[var(--v3-electric)]" : "bg-[var(--v3-hairline-strong)]"
                  }`}
                  aria-hidden
                />
                {label}
              </span>
            </li>
          ))}
        </ol>

        <Link
          href="/v3"
          aria-label={t("ob.close")}
          className="grid size-9 place-items-center rounded-full border border-[var(--v3-hairline-strong)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--foreground)]"
        >
          <X className="size-4" />
        </Link>
      </div>
    </header>
  );
}

function StepShell({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-28 pt-10 sm:pt-14">
      <p className="v3-eyebrow">{eyebrow}</p>
      <h1 className="v3-h2 mt-3">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-[var(--muted-foreground)] sm:text-base">{sub}</p>
      <div className="mt-9">{children}</div>
    </div>
  );
}

function OnboardingInner() {
  const { t } = useV3I18n();
  const searchParams = useSearchParams();

  // Deep link: /v3/onboarding?race=vasaloppet preselects and jumps to step 2.
  const deepLinkedRace = useMemo(() => {
    const id = searchParams.get("race");
    return id ? getRaceById(id) ?? null : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [step, setStep] = useState<Step>(deepLinkedRace ? "you" : "race");
  const [race, setRace] = useState<Race | null>(deepLinkedRace);
  const [profile, setProfile] = useState<ProfileValue>({
    experience: "intermediate",
    daysPerWeek: 3,
    weeklyKm: deepLinkedRace
      ? volumeConfig(deepLinkedRace.sport).tierDefault.intermediate
      : TIER_DEFAULT_KM.intermediate,
    longRunDay: 6,
    resultDistance: null,
    resultTime: "",
    sportAnchorKey: null,
    sportAnchorValue: "",
  });
  const [result, setResult] = useState<PreviewResult | null>(null);
  const [failures, setFailures] = useState<string[]>([]);

  /** The engine speaks run-equivalent km; anchors are parsed per sport. */
  const buildInput = useCallback(
    (r: Race) => ({
      race: r,
      experience: profile.experience,
      daysPerWeek: profile.daysPerWeek,
      weeklyKm: Math.round(volumeConfig(r.sport).toRunKm(profile.weeklyKm)),
      longRunDay: profile.longRunDay,
      raceResult: parseRaceResult(profile),
      sportAnchor: parseSportAnchor(r.sport, profile),
    }),
    [profile]
  );

  const planWeeks = useMemo(
    () => (race ? clampPlanWeeks(weeksUntil(nextRaceDate(race.month))) : 0),
    [race]
  );

  // Smoke-test funnel events (fire-and-forget, deduped per session).
  useEffect(() => {
    track("onboarding_started", { once: true });
  }, []);
  useEffect(() => {
    if (step === "preview") track("plan_preview_reached", { once: true });
  }, [step]);

  const selectRace = useCallback((r: Race) => {
    setRace(r);
    // Volume scale + anchor question follow the sport — reset both.
    setProfile((p) => ({
      ...p,
      weeklyKm: volumeConfig(r.sport).tierDefault[p.experience],
      resultDistance: null,
      resultTime: "",
      sportAnchorKey: null,
      sportAnchorValue: "",
    }));
  }, []);

  const generate = useCallback(() => {
    if (!race) return;
    // The engine is pure & synchronous — compute up front, let the
    // Generating stage sequence play, then reveal. An invalid/absent
    // anchor falls back to the tier estimate (the engine's own ladder).
    const gen = generateValidatedPlan(buildInput(race));
    if (gen.ok) {
      setResult(gen.result);
      setFailures([]);
    } else {
      setResult(null);
      setFailures(gen.failures);
    }
    setStep("generating");
  }, [race, buildInput]);

  const back = useCallback(() => {
    if (step === "you") setStep("race");
    else if (step === "error") setStep("you");
    else if (step === "account") setStep("preview");
  }, [step]);

  const restart = useCallback(() => {
    setResult(null);
    setRace(null);
    setStep("race");
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-dvh">
      <ProgressRail
        step={step}
        onBack={step === "you" || step === "error" || step === "account" ? back : null}
      />

      <AnimatePresence mode="wait">
        <motion.main
          key={step}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          {step === "race" && (
            <StepShell eyebrow={t("ob.race.eyebrow")} title={t("ob.race.title")} sub={t("ob.race.sub")}>
              <RacePicker selected={race} onSelect={selectRace} />
            </StepShell>
          )}

          {step === "you" && race && (
            <StepShell eyebrow={t("ob.you.eyebrow")} title={t("ob.you.title")} sub={t("ob.you.sub")}>
              <div className="v3-mono mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--v3-hairline-strong)] px-4 py-2 text-xs uppercase tracking-[0.14em]">
                <span className="text-[var(--muted-foreground)]">{t("ob.race.selected")}:</span>
                <span className="font-bold text-[var(--v3-electric-bright)]">{race.name}</span>
              </div>
              <ProfileStep sport={race.sport} value={profile} onChange={setProfile} />
            </StepShell>
          )}

          {step === "generating" && race && (
            <Generating
              race={race}
              planWeeks={planWeeks}
              onDone={() => setStep(result ? "preview" : "error")}
            />
          )}

          {step === "preview" && race && result && (
            <div className="pt-8">
              <PlanPreview
                race={race}
                result={result}
                onRestart={restart}
                onSave={() => {
                  window.scrollTo({ top: 0 });
                  setStep("account");
                }}
              />
            </div>
          )}

          {step === "account" && race && <AccountStep input={buildInput(race)} />}

          {step === "error" && (
            <div className="mx-auto flex min-h-[60dvh] max-w-md flex-col items-center justify-center px-5 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-[color-mix(in_oklab,var(--destructive)_14%,transparent)] text-[var(--destructive)]">
                <AlertTriangle className="size-6" />
              </span>
              <h1 className="v3-h3 mt-6">{t("ob.gen.error.title")}</h1>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted-foreground)]">{t("ob.gen.error.body")}</p>
              {failures.length > 0 && (
                <p className="v3-mono mt-3 text-[11px] text-[var(--muted-foreground)]">{failures[0]}</p>
              )}
              <div className="mt-8 flex gap-3">
                <button type="button" className="v3-btn v3-btn-primary" onClick={generate}>
                  {t("ob.gen.error.retry")}
                </button>
                <button type="button" className="v3-btn v3-btn-ghost" onClick={() => setStep("you")}>
                  {t("ob.gen.error.adjust")}
                </button>
              </div>
            </div>
          )}
        </motion.main>
      </AnimatePresence>

      {/* sticky action bar for the two input steps */}
      {(step === "race" || step === "you") && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--v3-hairline)] bg-[color-mix(in_oklab,var(--background)_86%,transparent)] backdrop-blur-xl">
          <div className="mx-auto flex h-20 max-w-5xl items-center justify-between gap-4 px-5">
            <div className="v3-mono min-w-0 truncate text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              {race ? race.name : "—"}
            </div>
            {step === "race" ? (
              <button
                type="button"
                className="v3-btn v3-btn-primary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!race}
                onClick={() => setStep("you")}
              >
                {t("ob.next")}
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button type="button" className="v3-btn v3-btn-primary" onClick={generate}>
                {t("ob.generate")}
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <OnboardingInner />
    </Suspense>
  );
}

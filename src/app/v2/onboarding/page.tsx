"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, RotateCcw } from "lucide-react";
import { getRaceById, SPORT_EMOJI, type Race } from "@/lib/races";
import { createClient } from "@/lib/supabase/client";
import { useV2I18n } from "../_lib/i18n";
import { Topbar } from "../_components/topbar";
import { RacePicker } from "../_components/race-picker";
import { PlanPreview } from "../_components/plan-preview";
import {
  TIER_DEFAULT_KM,
  buildAvailableDays,
  type ExperienceTier,
  type PreviewResult,
} from "../_lib/preview-plan";
import { nextRaceDate, weeksUntil, clampPlanWeeks, distanceToRaceDistance } from "../_lib/race-meta";

type Step = "race" | "profile" | "generating" | "preview" | "error" | "account";

/** Server returns raceDate as an ISO string over JSON — revive it to a Date so
 *  the preview components can use it directly. */
function revivePreview(raw: PreviewResult): PreviewResult {
  return { ...raw, raceDate: new Date(raw.raceDate) };
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const EXPERIENCES: ExperienceTier[] = ["beginner", "intermediate", "advanced", "elite"];
const LONG_DAYS = [1, 2, 3, 4, 5, 6, 0];

function OnboardingInner() {
  const { t, lang } = useV2I18n();
  const params = useSearchParams();
  const router = useRouter();
  const supabase = createClient();
  const initialRace = params.get("race") ? getRaceById(params.get("race")!) : undefined;
  const wantSignin = params.get("signin") === "1";

  const [step, setStep] = useState<Step>(wantSignin ? "account" : initialRace ? "profile" : "race");
  const [race, setRace] = useState<Race | undefined>(initialRace);
  const [experience, setExperience] = useState<ExperienceTier>("intermediate");
  const [weeklyKm, setWeeklyKm] = useState<number>(TIER_DEFAULT_KM.intermediate);
  const [daysPerWeek, setDaysPerWeek] = useState<number>(4);
  const [longRunDay, setLongRunDay] = useState<number>(6);
  const [result, setResult] = useState<PreviewResult | null>(null);

  // Account / persistence state
  const [authMode, setAuthMode] = useState<"signup" | "signin">(wantSignin ? "signin" : "signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  /** Persist the chosen race + profile, then run the real (saving) generation. */
  async function persistAndGenerate(): Promise<void> {
    if (!race) throw new Error("no race");
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("not authenticated");

    const raceDate = nextRaceDate(race.month);
    const raceDateStr = ymd(raceDate);
    const planWeeks = clampPlanWeeks(weeksUntil(raceDate));
    const availableDays = buildAvailableDays(daysPerWeek, longRunDay);

    const profileUpsert = await supabase.from("user_profiles").upsert(
      {
        id: user.id,
        email: user.email!,
        full_name: fullName || null,
        available_days: availableDays,
        runs_per_week: daysPerWeek,
        preferred_long_run_day: longRunDay,
        current_weekly_mileage_km: weeklyKm,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    );
    if (profileUpsert.error) throw new Error(profileUpsert.error.message);

    // Best-effort: language lives in a later migration that may not be applied.
    // A missing column must not break onboarding.
    await supabase.from("user_profiles").update({ language: lang }).eq("id", user.id);

    // Clean slate — same as the production onboarding.
    await Promise.all([
      supabase.from("sessions").delete().eq("user_id", user.id),
      supabase.from("plan_intents").delete().eq("user_id", user.id),
      supabase.from("user_races").update({ active: false }).eq("user_id", user.id).eq("active", true),
      supabase.from("goals").update({ active: false }).eq("user_id", user.id).eq("active", true),
    ]);

    const raceInsert = await supabase.from("user_races").insert({
      user_id: user.id,
      race_id: race.id,
      custom_name: race.name,
      custom_sport: race.sport,
      custom_distance_km: race.distanceKm,
      target_date: raceDateStr,
      is_custom: false,
      active: true,
    });
    if (raceInsert.error) {
      // Retry without the catalog FK (races table may not be seeded).
      await supabase.from("user_races").insert({
        user_id: user.id,
        race_id: null,
        custom_name: race.name,
        custom_sport: race.sport,
        custom_distance_km: race.distanceKm,
        target_date: raceDateStr,
        is_custom: true,
        active: true,
      });
    }

    const goalInsert = await supabase.from("goals").insert({
      user_id: user.id,
      type: "race",
      race_distance: distanceToRaceDistance(race.distanceKm),
      race_date: raceDateStr,
      plan_weeks: planWeeks,
      active: true,
    });
    if (goalInsert.error) throw new Error(goalInsert.error.message);

    const planRes = await fetch("/api/plan/generate", { method: "POST" });
    if (!planRes.ok) {
      const d = await planRes.json().catch(() => ({}));
      throw new Error(d.error || "plan generation failed");
    }
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(error.message);
        // Returning user — go straight to their saved plan.
        router.push("/v2/app");
        router.refresh();
        return;
      }

      // Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        // Email confirmation is required — can't persist until confirmed.
        setAuthError(t("ob.acc.confirmEmail"));
        setAuthBusy(false);
        return;
      }
      await persistAndGenerate();
      router.push("/v2/app");
      router.refresh();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : t("ob.acc.error"));
      setAuthBusy(false);
    }
  }

  // Generate SERVER-SIDE (real engine + validation) while a brief build
  // animation plays. The plan only reveals once it has passed validation;
  // a validation failure or network error routes to a clean error state.
  useEffect(() => {
    if (step !== "generating" || !race) return;
    const ctrl = new AbortController();
    const startedAt = Date.now();
    const MIN_ANIM_MS = 1800;

    (async () => {
      try {
        const res = await fetch("/v2/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raceId: race.id, experience, daysPerWeek, weeklyKm, longRunDay }),
          signal: ctrl.signal,
        });
        const data = await res.json();
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_ANIM_MS) {
          await new Promise((r) => setTimeout(r, MIN_ANIM_MS - elapsed));
        }
        if (ctrl.signal.aborted) return;
        if (res.ok && data?.ok) {
          setResult(revivePreview(data.result));
          setStep("preview");
        } else {
          setStep("error");
        }
      } catch {
        if (!ctrl.signal.aborted) setStep("error");
      }
    })();

    return () => ctrl.abort();
  }, [step, race, experience, daysPerWeek, weeklyKm, longRunDay]);

  const stepIndex = step === "race" ? 1 : 2;

  function restart() {
    setResult(null);
    setRace(undefined);
    setStep("race");
  }

  return (
    <main>
      <Topbar />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
        {/* progress (hidden once generating/preview) */}
        {(step === "race" || step === "profile") && (
          <div className="mb-8 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              {t("ob.step")} {stepIndex} {t("ob.of")} 2
            </span>
            <div className="flex flex-1 gap-1.5">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-1 flex-1 rounded-full v2-transition"
                  style={{ background: n <= stepIndex ? "var(--primary)" : "var(--secondary)" }}
                />
              ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ===== STEP 1: RACE ===== */}
          {step === "race" && (
            <motion.div
              key="race"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("ob.s1.eyebrow")}</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">{t("ob.s1.title")}</h1>
              <p className="mt-3 text-lg font-medium text-muted-foreground">{t("ob.s1.sub")}</p>
              <div className="mt-7">
                <RacePicker
                  onSelect={(r) => {
                    setRace(r);
                    setStep("profile");
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ===== STEP 2: PROFILE ===== */}
          {step === "profile" && race && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
            >
              <button
                type="button"
                onClick={() => setStep("race")}
                className="v2-ring-focus v2-transition mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("ob.back")}
              </button>

              {/* chosen race chip */}
              <div
                className="mb-7 flex items-center gap-3 rounded-2xl px-4 py-3"
                style={{ border: "1px solid var(--v2-hairline)", background: "var(--card)" }}
              >
                <span className="text-2xl" aria-hidden>{SPORT_EMOJI[race.sport]}</span>
                <div className="min-w-0">
                  <div className="truncate text-base font-bold text-foreground">{race.name}</div>
                  <div className="text-xs font-semibold text-muted-foreground">{race.distanceKm} km</div>
                </div>
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("ob.s2.eyebrow")}</p>
              <h1 className="mt-2 text-4xl sm:text-5xl">{t("ob.s2.title")}</h1>
              <p className="mt-3 text-lg font-medium text-muted-foreground">{t("ob.s2.sub")}</p>

              {/* experience */}
              <h2 className="mt-8 text-sm font-black uppercase tracking-wider text-muted-foreground">
                {t("ob.s2.exp")}
              </h2>
              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {EXPERIENCES.map((e) => {
                  const active = experience === e;
                  return (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        setExperience(e);
                        setWeeklyKm(TIER_DEFAULT_KM[e]);
                      }}
                      className="v2-ring-focus v2-transition rounded-2xl p-4 text-left"
                      style={
                        active
                          ? { border: "1.5px solid var(--primary)", background: "color-mix(in oklab, var(--primary) 10%, transparent)" }
                          : { border: "1px solid var(--v2-hairline)" }
                      }
                    >
                      <div className="text-base font-bold text-foreground">{t(`ob.s2.exp.${e}`)}</div>
                      <div className="mt-1 text-xs font-medium leading-snug text-muted-foreground">
                        {t(`ob.s2.exp.${e}.d`)}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* days per week */}
              <h2 className="mt-8 text-sm font-black uppercase tracking-wider text-muted-foreground">
                {t("ob.s2.days")}
              </h2>
              <div className="mt-3 flex gap-2">
                {[3, 4, 5, 6].map((d) => {
                  const active = daysPerWeek === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDaysPerWeek(d)}
                      className="v2-ring-focus v2-transition tabular flex-1 rounded-2xl py-3.5 text-lg font-bold"
                      style={
                        active
                          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                          : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
                      }
                    >
                      {d}
                    </button>
                  );
                })}
              </div>

              {/* weekly volume */}
              <div className="mt-8 flex items-baseline justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">
                  {t("ob.s2.volume")}
                </h2>
                <span className="tabular text-lg font-bold text-foreground">{weeklyKm} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={120}
                step={1}
                value={weeklyKm}
                onChange={(e) => setWeeklyKm(Number(e.target.value))}
                className="mt-3 w-full accent-[var(--primary)]"
                aria-label={t("ob.s2.volume")}
              />

              {/* long-run day */}
              <h2 className="mt-8 text-sm font-black uppercase tracking-wider text-muted-foreground">
                {t("ob.s2.longday")}
              </h2>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {LONG_DAYS.map((d) => {
                  const active = longRunDay === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setLongRunDay(d)}
                      className="v2-ring-focus v2-transition rounded-xl py-2.5 text-xs font-bold"
                      style={
                        active
                          ? { background: "var(--primary)", color: "var(--primary-foreground)" }
                          : { border: "1px solid var(--v2-hairline)", color: "var(--muted-foreground)" }
                      }
                    >
                      {t(`day.${d}`)}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep("generating")}
                className="v2-ring-focus v2-transition group mt-10 inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground"
                style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
              >
                {t("ob.generate")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}

          {/* ===== STEP 3: GENERATING ===== */}
          {step === "generating" && race && (
            <motion.div
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[55vh] flex-col items-center justify-center text-center"
            >
              <div className="relative">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <div className="pointer-events-none absolute inset-0 -z-10 rounded-full blur-2xl" style={{ background: "var(--glow)" }} />
              </div>
              <h1 className="mt-8 text-3xl sm:text-4xl">{t("ob.gen.title")}</h1>
              <div className="mt-7 w-full max-w-sm space-y-3 text-left">
                {[
                  t("ob.gen.anchor", { race: race.name }),
                  t("ob.gen.periodize"),
                  t("ob.gen.pace"),
                  t("ob.gen.place"),
                ].map((line, i) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.45 }}
                    className="flex items-center gap-3"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 + i * 0.45, type: "spring", stiffness: 400, damping: 18 }}
                      className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: "var(--primary)" }}
                    >
                      <Check className="h-3.5 w-3.5 text-primary-foreground" />
                    </motion.span>
                    <span className="text-sm font-semibold text-foreground">{line}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== STEP 3b: ERROR ===== */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex min-h-[55vh] flex-col items-center justify-center text-center"
            >
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}
              >
                <AlertTriangle className="h-7 w-7 text-accent" />
              </div>
              <h1 className="mt-6 text-3xl sm:text-4xl">{t("ob.gen.error.title")}</h1>
              <p className="mt-3 max-w-md text-base font-medium leading-relaxed text-muted-foreground">
                {t("ob.gen.error.body")}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setStep("generating")}
                  className="v2-ring-focus v2-transition inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground"
                  style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t("ob.gen.error.retry")}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("profile")}
                  className="v2-ring-focus v2-transition inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-foreground hover:bg-[var(--secondary)]"
                  style={{ border: "1px solid var(--v2-hairline)" }}
                >
                  {t("ob.gen.error.adjust")}
                </button>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 4: PREVIEW ===== */}
          {step === "preview" && race && result && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">{t("ob.prev.eyebrow")}</p>
              <div className="mt-5">
                <PlanPreview
                  race={race}
                  result={result}
                  onRestart={restart}
                  onCreateAccount={() => {
                    setAuthMode("signup");
                    setAuthError(null);
                    setStep("account");
                  }}
                />
              </div>
            </motion.div>
          )}

          {/* ===== STEP 5: ACCOUNT (create / save / sign in) ===== */}
          {step === "account" && (
            <motion.div
              key="account"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4 }}
              className="mx-auto max-w-md"
            >
              {authBusy && authMode === "signup" ? (
                <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <h1 className="mt-8 text-3xl sm:text-4xl">{t("ob.acc.saving")}</h1>
                  <p className="mt-3 text-base font-medium text-muted-foreground">{t("ob.acc.savingSub")}</p>
                </div>
              ) : (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                    {authMode === "signin" ? t("ob.acc.signinEyebrow") : t("ob.acc.eyebrow")}
                  </p>
                  <h1 className="mt-2 text-4xl sm:text-5xl">
                    {authMode === "signin" ? t("ob.acc.signinTitle") : t("ob.acc.title")}
                  </h1>
                  <p className="mt-3 text-base font-medium text-muted-foreground">
                    {authMode === "signin" ? t("ob.acc.signinSub") : t("ob.acc.sub")}
                  </p>

                  <form onSubmit={handleAccountSubmit} className="mt-7 space-y-3">
                    {authMode === "signup" && (
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t("ob.acc.name")}
                        autoComplete="name"
                        className="v2-ring-focus w-full rounded-2xl bg-[var(--card)] px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground"
                        style={{ border: "1px solid var(--v2-hairline)" }}
                      />
                    )}
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("ob.acc.email")}
                      autoComplete="email"
                      className="v2-ring-focus w-full rounded-2xl bg-[var(--card)] px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground"
                      style={{ border: "1px solid var(--v2-hairline)" }}
                    />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("ob.acc.password")}
                      autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                      className="v2-ring-focus w-full rounded-2xl bg-[var(--card)] px-4 py-3.5 text-base font-medium text-foreground placeholder:text-muted-foreground"
                      style={{ border: "1px solid var(--v2-hairline)" }}
                    />

                    {authError && (
                      <p className="text-sm font-semibold text-[var(--destructive,#e5484d)]">{authError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={authBusy}
                      className="v2-ring-focus v2-transition group inline-flex w-full items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-bold text-primary-foreground disabled:opacity-60"
                      style={{ background: "var(--primary)", boxShadow: "0 14px 40px -12px var(--glow)" }}
                    >
                      {authBusy ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          {authMode === "signin" ? t("ob.acc.signinCta") : t("ob.acc.cta")}
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setAuthMode((m) => (m === "signin" ? "signup" : "signin"));
                    }}
                    className="v2-ring-focus v2-transition mt-5 text-sm font-bold text-muted-foreground hover:text-foreground"
                  >
                    {authMode === "signin" ? t("ob.acc.toSignup") : t("ob.acc.toSignin")}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

export default function V2Onboarding() {
  return (
    <Suspense fallback={null}>
      <OnboardingInner />
    </Suspense>
  );
}

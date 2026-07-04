import type { Race } from "@/lib/races";
import type { UserProfile, Goal } from "@/types/database";
import type { WeekPlan } from "@/lib/plan-generator";
import { distanceToRaceDistance } from "./race-meta";

export type ExperienceTier = "beginner" | "intermediate" | "advanced" | "elite";

export interface PreviewInput {
  race: Race;
  experience: ExperienceTier;
  daysPerWeek: number;
  weeklyKm: number;
  longRunDay: number; // 0..6
}

export interface PhaseSegment {
  phase: WeekPlan["phase"];
  weeks: number;
}

export interface PreviewResult {
  weeks: WeekPlan[];
  planWeeks: number;
  raceDate: Date;
  phases: PhaseSegment[];
  thresholdPaceLabel: string; // e.g. "5:10"
  totalSessions: number;
}

/* Reasonable default weekly volume per experience tier (km/week), used to seed
   the slider. The generator derives its own tier from volume + pace, so picking
   experience here genuinely shifts the plan. */
export const TIER_DEFAULT_KM: Record<ExperienceTier, number> = {
  beginner: 12,
  intermediate: 28,
  advanced: 55,
  elite: 85,
};

export function buildAvailableDays(daysPerWeek: number, longRunDay: number): number[] {
  // Preference order spreads hard/easy days out; long-run day forced in.
  const order = [longRunDay, 2, 4, 1, 3, 0, 5, 6];
  const seen = new Set<number>();
  const days: number[] = [];
  for (const d of order) {
    if (days.length >= daysPerWeek) break;
    if (!seen.has(d)) {
      seen.add(d);
      days.push(d);
    }
  }
  return days.sort((a, b) => a - b);
}

/** Maps the v3 onboarding input onto the generator's real UserProfile in-type.
 *  Only fields the deterministic engine actually reads are meaningful; the rest
 *  are inert defaults so the shape type-checks against the shared type. */
export function buildProfile(input: PreviewInput): UserProfile {
  const now = new Date().toISOString();
  return {
    id: "preview",
    email: "preview@parrot.app",
    full_name: null,
    age: null,
    gender: null,
    max_hr: null,
    resting_hr: null,
    current_weekly_mileage_km: input.weeklyKm,
    runs_per_week: input.daysPerWeek,
    available_days: buildAvailableDays(input.daysPerWeek, input.longRunDay),
    preferred_long_run_day: input.longRunDay,
    strength_preference: "none",
    coach_mode: "suggest",
    onboarding_completed: false,
    onboarding_step: 0,
    dark_mode: "dark",
    preferred_session_length: "45-60",
    time_preference: "any",
    language: "sv",
    strava_connected: false,
    strava_athlete_id: null,
    strava_access_token: null,
    strava_refresh_token: null,
    strava_token_expires_at: null,
    created_at: now,
    updated_at: now,
  };
}

/** Maps the chosen race + computed window onto the generator's real Goal in-type. */
export function buildGoal(input: PreviewInput, raceDate: Date, planWeeks: number): Goal {
  return {
    id: "preview",
    user_id: "preview",
    type: "race",
    race_distance: distanceToRaceDistance(input.race.distanceKm),
    target_time_seconds: null,
    race_date: raceDate.toISOString(),
    baseline_5k_seconds: null,
    baseline_10k_seconds: null,
    baseline_half_seconds: null,
    baseline_marathon_seconds: null,
    plan_weeks: planWeeks,
    active: true,
    created_at: new Date().toISOString(),
  };
}

export function summarizePhases(weeks: WeekPlan[]): PhaseSegment[] {
  const segs: PhaseSegment[] = [];
  for (const w of weeks) {
    const last = segs[segs.length - 1];
    if (last && last.phase === w.phase) last.weeks += 1;
    else segs.push({ phase: w.phase, weeks: 1 });
  }
  return segs;
}

import { createServerSupabase } from "@/lib/supabase/server";
import { getRaceById, type Race, type Sport } from "@/lib/races";
import { deriveThresholdPace, formatPace, type PlannedSession } from "@/lib/plan-generator";
import type { Session, UserProfile, Goal, PlanPhase, RaceDistance } from "@/types/database";
import { summarizePhases } from "./preview-plan";
import type { AppPlan, AppSession, AppWeek } from "./mock-app-data";

/* ============================================================================
   LOAD USER PLAN — reads the logged-in athlete's saved plan from Supabase and
   maps it into the AppPlan shape the v2 surfaces consume (the same shape the
   demo builder produced). This is what makes the v2 app show REAL per-user data
   instead of the demo athlete. Runs server-side in app/layout.tsx.
   ============================================================================ */

interface PlanIntentRow {
  week_number: number;
  phase: PlanPhase;
  total_distance_km: number | null;
  long_run_km: number | null;
  quality_sessions: number | null;
  description: string | null;
  is_recovery: boolean | null;
  starts_on: string;
}

const RACE_DISTANCE_KM: Record<RaceDistance, number> = {
  "5k": 5,
  "10k": 10,
  half_marathon: 21.1,
  marathon: 42.2,
};

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function toPlannedSession(s: Session): PlannedSession {
  return {
    dayOfWeek: s.day_of_week,
    type: s.type,
    title: s.title,
    description: s.description,
    distanceKm: s.distance_km,
    targetPaceMinKm: s.target_pace_min_km,
    targetHrZone: s.target_hr_zone,
    durationMinutes: s.duration_minutes,
    structure: s.structure ?? { blocks: [] },
    orderInDay: s.order_in_day,
  };
}

/** Resolve the athlete's race for display. Library races come from the catalog;
 *  custom races are reconstructed from the stored fields. */
function resolveRace(
  userRace: { race_id: string | null; custom_name: string | null; custom_sport: Sport | null; custom_distance_km: number | null } | null,
  goal: Goal,
): Race {
  if (userRace?.race_id) {
    const lib = getRaceById(userRace.race_id);
    if (lib) return lib;
  }
  const raceDate = goal.race_date ? parseISODate(goal.race_date) : new Date();
  const distanceKm =
    userRace?.custom_distance_km ??
    (goal.race_distance ? RACE_DISTANCE_KM[goal.race_distance as RaceDistance] : 21.1);
  return {
    id: userRace?.race_id ?? "custom",
    name: userRace?.custom_name ?? "Ditt lopp",
    sport: userRace?.custom_sport ?? "running",
    country: "",
    month: raceDate.getMonth() + 1,
    distanceKm,
    klassiker: false,
    difficulty: "intermediate",
    description: "",
    descriptionSv: "",
  };
}

export async function loadUserAppPlan(): Promise<
  { status: "ok"; plan: AppPlan } | { status: "unauthenticated" } | { status: "no-plan" }
> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "unauthenticated" };

  const [profileRes, goalRes, userRaceRes, intentsRes, sessionsRes] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single(),
    supabase.from("user_races").select("*").eq("user_id", user.id).eq("active", true).limit(1),
    supabase.from("plan_intents").select("*").eq("user_id", user.id).order("week_number"),
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("week_number")
      .order("order_in_day"),
  ]);

  const profile = profileRes.data as UserProfile | null;
  const goal = goalRes.data as Goal | null;
  const intents = (intentsRes.data as PlanIntentRow[] | null) ?? [];
  const sessions = (sessionsRes.data as Session[] | null) ?? [];

  if (!profile || !goal || intents.length === 0) return { status: "no-plan" };

  const race = resolveRace(userRaceRes.data?.[0] ?? null, goal);

  // Group sessions by week number.
  const sessionsByWeek = new Map<number, Session[]>();
  for (const s of sessions) {
    const list = sessionsByWeek.get(s.week_number) ?? [];
    list.push(s);
    sessionsByWeek.set(s.week_number, list);
  }

  const weeks: AppWeek[] = intents.map((intent) => {
    const weekStart = parseISODate(intent.starts_on);
    const weekSessions = sessionsByWeek.get(intent.week_number) ?? [];
    const planned: PlannedSession[] = weekSessions.map(toPlannedSession);
    const appSessions: AppSession[] = weekSessions.map((s) => ({
      ...toPlannedSession(s),
      id: s.id,
      date: parseISODate(s.session_date),
      weekNumber: intent.week_number,
      phase: intent.phase,
      isRecovery: !!intent.is_recovery,
    }));
    return {
      weekNumber: intent.week_number,
      phase: intent.phase,
      totalDistanceKm: intent.total_distance_km ?? 0,
      longRunKm: intent.long_run_km ?? 0,
      qualitySessions: intent.quality_sessions ?? 0,
      description: intent.description ?? "",
      isRecovery: !!intent.is_recovery,
      startsOn: intent.starts_on,
      sessions: planned,
      weekStart,
      weekEnd: addDays(weekStart, 6),
      appSessions,
    };
  });

  const raceDate = goal.race_date ? parseISODate(goal.race_date) : addDays(new Date(), weeks.length * 7);
  const thresholdPace = deriveThresholdPace(goal, profile);

  const plan: AppPlan = {
    race,
    preview: {
      weeks,
      planWeeks: weeks.length,
      raceDate,
      phases: summarizePhases(weeks),
      thresholdPaceLabel: formatPace(thresholdPace),
      totalSessions: weeks.reduce((n, w) => n + w.sessions.length, 0),
    },
    weeks,
    raceDate,
    planWeeks: weeks.length,
    thresholdPaceLabel: formatPace(thresholdPace),
    athlete: {
      name: profile.full_name?.split(" ")[0] || "Löpare",
      experience: "intermediate",
    },
  };

  return { status: "ok", plan };
}

import type { CoachContext } from "@/lib/coach";
import type { Session, UserRace } from "@/types/database";
import type { Language } from "./i18n";
import { generateValidatedPlan } from "./generate-plan";
import { buildProfile } from "./preview-plan";
import { buildAppPlan, buildDemoPreviewInput, type AppSession } from "./mock-app-data";

/* ============================================================================
   DEMO COACH CONTEXT — builds the CoachContext that the SHARED coach
   (chatWithCoach in @/lib/coach) expects, from the in-memory demo plan.

   The production coach route reads this context from Supabase for a logged-in
   athlete. The v2 preview has no auth and no persistence, so we synthesise the
   same shape from the validated demo plan: the goal race + the real upcoming
   sessions the engine produced, plus the demo profile. Fields that only exist
   once an athlete is actually logging training (recentLogs, check-ins) are left
   empty — honestly reflecting a fresh preview.
   ============================================================================ */

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toSession(s: AppSession): Session {
  const ts = new Date().toISOString();
  return {
    id: s.id,
    user_id: "preview",
    plan_intent_id: "preview",
    week_number: s.weekNumber,
    day_of_week: s.dayOfWeek,
    session_date: ymd(s.date),
    sport: "running",
    type: s.type,
    title: s.title,
    description: s.description,
    distance_km: s.distanceKm,
    target_pace_min_km: s.targetPaceMinKm,
    target_hr_zone: s.targetHrZone,
    duration_minutes: s.durationMinutes,
    structure: s.structure,
    status: "planned",
    order_in_day: s.orderInDay,
    adaptation_reason: null,
    created_at: ts,
    updated_at: ts,
  };
}

export function buildDemoCoachContext(language: Language): CoachContext | null {
  const input = buildDemoPreviewInput();
  if (!input) return null;

  const gen = generateValidatedPlan(input);
  if (!gen.ok) return null;

  const plan = buildAppPlan(gen.result, input.race);
  const profile = { ...buildProfile(input), language };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const upcomingSessions = plan.weeks
    .flatMap((w) => w.appSessions)
    .filter((s) => s.type !== "rest" && s.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 14)
    .map(toSession);

  const userRace: UserRace = {
    id: "preview",
    user_id: "preview",
    race_id: null,
    custom_name: input.race.name,
    custom_sport: "running",
    custom_distance_km: input.race.distanceKm,
    target_date: ymd(plan.raceDate),
    is_custom: true,
    active: true,
    created_at: new Date().toISOString(),
  };

  return {
    profile,
    userRaces: [userRace],
    userSports: [],
    recentLogs: [],
    upcomingSessions,
    constraints: [],
    lastCheckin: null,
  };
}

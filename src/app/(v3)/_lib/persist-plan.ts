import type { SupabaseClient } from "@supabase/supabase-js";
import type { PreviewInput } from "./preview-plan";
import { buildAvailableDays } from "./preview-plan";
import { clampPlanWeeks, distanceToRaceDistance, nextRaceDate, weeksUntil } from "./race-meta";

/* Persist the v3 onboarding choices to the signed-in user's account and run
   the real, saving plan generation. Mirrors the production (v2) onboarding
   flow — same tables, same clean-slate semantics, same server-side
   /api/plan/generate — with one addition: the entered race time lands in the
   goal's baseline fields so the saved plan's paces anchor to it. */

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function persistAndGenerate(
  supabase: SupabaseClient,
  input: PreviewInput,
  fullName: string,
  language: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("not authenticated");

  const { race, raceResult } = input;
  const raceDate = nextRaceDate(race.month);
  const raceDateStr = ymd(raceDate);
  const planWeeks = clampPlanWeeks(weeksUntil(raceDate));
  const availableDays = buildAvailableDays(input.daysPerWeek, input.longRunDay);

  const profileUpsert = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      email: user.email!,
      full_name: fullName || null,
      available_days: availableDays,
      runs_per_week: input.daysPerWeek,
      preferred_long_run_day: input.longRunDay,
      current_weekly_mileage_km: input.weeklyKm,
      onboarding_completed: true,
    },
    { onConflict: "id" }
  );
  if (profileUpsert.error) throw new Error(profileUpsert.error.message);

  // Best-effort: language lives in a later migration that may not be applied.
  await supabase.from("user_profiles").update({ language }).eq("id", user.id);

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
    // The engine's preferred threshold anchor (spec §2.1 priority 1).
    baseline_5k_seconds: raceResult?.distance === "5k" ? raceResult.seconds : null,
    baseline_10k_seconds: raceResult?.distance === "10k" ? raceResult.seconds : null,
    baseline_half_seconds: raceResult?.distance === "half_marathon" ? raceResult.seconds : null,
    baseline_marathon_seconds: raceResult?.distance === "marathon" ? raceResult.seconds : null,
  });
  if (goalInsert.error) throw new Error(goalInsert.error.message);

  // Server-side generation + save (reads the goal incl. baselines from DB).
  const planRes = await fetch("/api/plan/generate", { method: "POST" });
  if (!planRes.ok) {
    const d = await planRes.json().catch(() => ({}));
    throw new Error((d as { error?: string }).error || "plan generation failed");
  }
}

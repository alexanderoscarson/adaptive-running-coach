import { NextResponse } from "next/server";
import { getRaceById } from "@/lib/races";
import { generateValidatedPlan } from "../../_lib/generate-plan";
import type { ExperienceTier, PreviewInput } from "../../_lib/preview-plan";

/* POST /v2/api/plan
   Server-side plan generation for the v2 preview/onboarding flow. All generation
   stays here — the client never imports the engine and no API key is exposed.

   Body: { raceId, experience, daysPerWeek, weeklyKm, longRunDay }
   200 → { ok: true, result, corrections }
   422 → { ok: false, failures }   (plan failed validation — UI shows a fallback)
   400 → { ok: false, failures }   (bad input) */

const TIERS: ExperienceTier[] = ["beginner", "intermediate", "advanced", "elite"];

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, failures: ["Invalid request body."] }, { status: 400 });
  }

  const race = typeof body.raceId === "string" ? getRaceById(body.raceId) : undefined;
  if (!race) {
    return NextResponse.json({ ok: false, failures: ["Unknown race."] }, { status: 400 });
  }

  const experience: ExperienceTier = TIERS.includes(body.experience as ExperienceTier)
    ? (body.experience as ExperienceTier)
    : "intermediate";

  const input: PreviewInput = {
    race,
    experience,
    daysPerWeek: clampInt(body.daysPerWeek, 3, 6, 4),
    weeklyKm: clampInt(body.weeklyKm, 5, 120, 28),
    longRunDay: clampInt(body.longRunDay, 0, 6, 6),
  };

  const res = generateValidatedPlan(input);
  if (!res.ok) {
    return NextResponse.json(res, { status: 422 });
  }
  return NextResponse.json(res);
}

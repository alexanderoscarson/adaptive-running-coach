import { generatePlan, deriveThresholdPace, formatPace } from "@/lib/plan-generator";
import {
  validatePlanProgression,
  validateSessionVariety,
  containsInstructionLeak,
  type ProgressionCorrection,
} from "@/lib/plan-validation";
import {
  buildProfile,
  buildGoal,
  summarizePhases,
  type PreviewInput,
  type PreviewResult,
} from "./preview-plan";
import { nextRaceDate, weeksUntil, clampPlanWeeks } from "./race-meta";

/* ============================================================================
   VALIDATED GENERATION CORE — the single path the v3 surface uses to turn
   onboarding input into a renderable plan.

   onboarding input → plan-generator.ts → validatePlanProgression (+ variety +
   instruction-leak gate) → PreviewResult.

   It calls only the SHARED engine (generatePlan) and the SHARED validation
   layer — no duplicated training logic. Pure & deterministic.
   ============================================================================ */

export type PlanGenResult =
  | { ok: true; result: PreviewResult; corrections: ProgressionCorrection[] }
  | { ok: false; failures: string[] };

export function generateValidatedPlan(input: PreviewInput): PlanGenResult {
  const raceDate = nextRaceDate(input.race.month);
  const planWeeks = clampPlanWeeks(weeksUntil(raceDate));

  const profile = buildProfile(input);
  const goal = buildGoal(input, raceDate, planWeeks);

  // ── Generate with the real deterministic engine ──
  const weeks = generatePlan(profile, goal, [], [], input.race.name, input.race.distanceKm);

  // ── Gate 1: progression. Mutates weeks in place (clamps >10%/wk). Not a failure
  //    on its own — a corrected plan is still a valid, renderable plan. ──
  const corrections = validatePlanProgression(weeks);

  const failures: string[] = [];

  // ── Gate 2: session-type variety (a Build/Peak week of only easy runs, a
  //    missing long run, a session without a purpose → broken generation). ──
  for (const f of validateSessionVariety(weeks)) failures.push(f.reason);

  // ── Gate 3: no internal prompt/vision language may leak into user-facing copy. ──
  for (const w of weeks) {
    if (containsInstructionLeak(w.description)) {
      failures.push(`Instruction leak in week ${w.weekNumber} description.`);
    }
    for (const s of w.sessions) {
      if (containsInstructionLeak(s.title) || containsInstructionLeak(s.description)) {
        failures.push(`Instruction leak in week ${w.weekNumber} "${s.title}".`);
      }
    }
  }

  // ── Gate 4: structural sanity ──
  if (weeks.length === 0) failures.push("Generator produced an empty plan.");
  else if (!weeks.some((w) => w.sessions.length > 0)) failures.push("Generated plan has no sessions.");

  if (failures.length > 0) return { ok: false, failures };

  const thresholdPace = deriveThresholdPace(goal, profile);

  return {
    ok: true,
    corrections,
    result: {
      weeks,
      planWeeks: weeks.length,
      raceDate,
      phases: summarizePhases(weeks),
      thresholdPaceLabel: formatPace(thresholdPace),
      totalSessions: weeks.reduce((n, w) => n + w.sessions.length, 0),
    },
  };
}

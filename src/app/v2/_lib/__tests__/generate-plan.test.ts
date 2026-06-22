import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Race } from "@/lib/races";
import type { PlanPhase, SessionType } from "@/types/database";
import type { WeekPlan, PlannedSession } from "@/lib/plan-generator";

/* Mock ONLY the deterministic engine. Keep deriveThresholdPace/formatPace real
   so the result is built the same way production does, and run the REAL
   validation layer (validatePlanProgression / validateSessionVariety /
   containsInstructionLeak) — that's exactly what this test is verifying. */
vi.mock("@/lib/plan-generator", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/plan-generator")>();
  return { ...actual, generatePlan: vi.fn() };
});

import { generatePlan } from "@/lib/plan-generator";
import { generateValidatedPlan } from "../generate-plan";
import type { PreviewInput } from "../preview-plan";

const mockedGeneratePlan = vi.mocked(generatePlan);

// ── fixture builders ─────────────────────────────────────────────────────────

function session(
  type: SessionType,
  distanceKm: number,
  description = "Lugnt distanspass i jämn fart.",
): PlannedSession {
  return {
    dayOfWeek: 1,
    type,
    title: type,
    description,
    distanceKm,
    targetPaceMinKm: 5.5,
    targetHrZone: 2,
    durationMinutes: 50,
    structure: { blocks: [] },
    orderInDay: 0,
  };
}

function week(
  weekNumber: number,
  phase: PlanPhase,
  totalDistanceKm: number,
  sessions: PlannedSession[],
  isRecovery = false,
): WeekPlan {
  return {
    weekNumber,
    phase,
    totalDistanceKm,
    longRunKm: Math.max(0, ...sessions.filter((s) => s.type === "long").map((s) => s.distanceKm ?? 0)),
    qualitySessions: sessions.filter((s) => ["tempo", "intervals", "hills"].includes(s.type)).length,
    description: "Vecka i basfas.",
    isRecovery,
    startsOn: "2026-01-05",
    sessions,
  };
}

const RACE: Race = {
  id: "test-race",
  name: "Test Marathon",
  sport: "running",
  country: "SE",
  month: 9,
  distanceKm: 42.2,
  klassiker: false,
  difficulty: "advanced",
  description: "Test race.",
  descriptionSv: "Testlopp.",
};

const INPUT: PreviewInput = {
  race: RACE,
  experience: "intermediate",
  daysPerWeek: 4,
  weeklyKm: 40,
  longRunDay: 6,
};

beforeEach(() => {
  mockedGeneratePlan.mockReset();
});

describe("generateValidatedPlan", () => {
  it("runs generator output through validatePlanProgression (clamps >10% jumps) and renders", () => {
    // Week 2 jumps 40 → 60 km (+50%), well over the 10% cap.
    mockedGeneratePlan.mockReturnValue([
      week(1, "base", 40, [session("easy", 20), session("long", 20)]),
      week(2, "base", 60, [session("easy", 30), session("long", 30)]),
    ]);

    const res = generateValidatedPlan(INPUT);

    expect(res.ok).toBe(true);
    if (!res.ok) return;

    // Proof validatePlanProgression actually ran on the engine output:
    // week 2 was clamped to 40 * 1.10 = 44 km, and a correction was logged.
    expect(res.result.weeks[1].totalDistanceKm).toBe(44);
    expect(res.corrections.some((c) => c.weekNumber === 2)).toBe(true);
    expect(res.result.weeks).toHaveLength(2);
    expect(res.result.totalSessions).toBe(4);
  });

  it("does NOT render a plan that fails session-variety validation", () => {
    // A Build week containing only easy runs is a generation failure.
    mockedGeneratePlan.mockReturnValue([
      week(1, "base", 30, [session("easy", 15), session("long", 15)]),
      week(2, "build", 32, [session("easy", 16), session("easy", 16)]),
    ]);

    const res = generateValidatedPlan(INPUT);

    expect(res.ok).toBe(false);
    expect(res).not.toHaveProperty("result");
    if (res.ok) return;
    expect(res.failures.length).toBeGreaterThan(0);
  });

  it("does NOT render a plan whose copy leaks internal generation language", () => {
    mockedGeneratePlan.mockReturnValue([
      week(1, "base", 30, [
        session("easy", 15, "Internal note: zone percentages 80/20 — do not show."),
        session("long", 15),
      ]),
    ]);

    const res = generateValidatedPlan(INPUT);

    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.failures.some((f) => /leak/i.test(f))).toBe(true);
  });

  it("renders a clean, valid plan unchanged", () => {
    mockedGeneratePlan.mockReturnValue([
      week(1, "base", 30, [session("easy", 15), session("long", 15)]),
      week(2, "base", 32, [session("easy", 16), session("long", 16)]),
    ]);

    const res = generateValidatedPlan(INPUT);

    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.result.weeks[1].totalDistanceKm).toBe(32); // within cap → untouched
    expect(res.corrections).toHaveLength(0);
    expect(res.result.thresholdPaceLabel).toMatch(/^\d+:\d{2}$/);
  });
});

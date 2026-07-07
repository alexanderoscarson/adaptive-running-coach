import { describe, expect, it } from "vitest";
import { formatTime, isPlausibleResult, parseTimeToSeconds, predictGoalPace } from "../pace";
import { buildGoal } from "../preview-plan";
import { generateValidatedPlan } from "../generate-plan";
import { getRaceById } from "@/lib/races";

const BASE_INPUT = {
  experience: "intermediate" as const,
  daysPerWeek: 3,
  weeklyKm: 28,
  longRunDay: 6,
};

describe("parseTimeToSeconds", () => {
  it("parses mm:ss, h:mm:ss and bare minutes", () => {
    expect(parseTimeToSeconds("48:30")).toBe(2910);
    expect(parseTimeToSeconds("1:45:00")).toBe(6300);
    expect(parseTimeToSeconds("45")).toBe(2700);
  });

  it("parses colon-free digits (mobile numeric keyboards have no colon)", () => {
    expect(parseTimeToSeconds("4830")).toBe(2910); // 48:30
    expect(parseTimeToSeconds("14500")).toBe(6300); // 1:45:00
    expect(parseTimeToSeconds("830")).toBe(510); // 8:30
    expect(parseTimeToSeconds("4880")).toBeNull(); // 80 seconds is not a thing
  });

  it("rejects malformed input", () => {
    expect(parseTimeToSeconds("4:75")).toBeNull();
    expect(parseTimeToSeconds("abc")).toBeNull();
    expect(parseTimeToSeconds("")).toBeNull();
    expect(parseTimeToSeconds("1:2:3:4")).toBeNull();
  });
});

describe("isPlausibleResult", () => {
  it("accepts a normal 10K and rejects impossible paces", () => {
    expect(isPlausibleResult({ distance: "10k", seconds: 2910 })).toBe(true);
    expect(isPlausibleResult({ distance: "10k", seconds: 600 })).toBe(false); // 1:00 /km
    expect(isPlausibleResult({ distance: "5k", seconds: 4500 })).toBe(false); // 15:00 /km
  });
});

describe("formatTime", () => {
  it("formats with and without hours", () => {
    expect(formatTime(2910)).toBe("48:30");
    expect(formatTime(6300)).toBe("1:45:00");
  });
});

describe("predictGoalPace", () => {
  it("predicts a half marathon from a 10K result via Riegel", () => {
    const p = predictGoalPace(21.1, 5.75, { distance: "10k", seconds: 2910 });
    expect(p.source).toBe("result");
    // 48:30 on 10K ⇒ ~5:04 /km over the half (Riegel 1.06)
    expect(p.paceMinKm).toBeGreaterThan(5.0);
    expect(p.paceMinKm).toBeLessThan(5.15);
    expect(p.finishSeconds).toBeCloseTo(p.paceMinKm * 60 * 21.1, 3);
  });

  it("falls back to the threshold-derived estimate without a result", () => {
    const p = predictGoalPace(10, 5.75, null);
    expect(p.source).toBe("estimate");
    // race pace = threshold − 10 s/km at the 10K bucket
    expect(p.paceMinKm).toBeCloseTo(5.75 - 10 / 60, 2);
  });
});

describe("buildGoal baseline mapping", () => {
  const race = getRaceById("goteborgsvarvet")!;
  const raceDate = new Date("2026-11-15");

  it("routes the result into the matching baseline field", () => {
    const goal = buildGoal(
      { race, ...BASE_INPUT, raceResult: { distance: "10k", seconds: 2910 } },
      raceDate,
      16
    );
    expect(goal.baseline_10k_seconds).toBe(2910);
    expect(goal.baseline_5k_seconds).toBeNull();
    expect(goal.baseline_half_seconds).toBeNull();
    expect(goal.baseline_marathon_seconds).toBeNull();
  });

  it("leaves all baselines null without a result", () => {
    const goal = buildGoal({ race, ...BASE_INPUT, raceResult: null }, raceDate, 16);
    expect(goal.baseline_10k_seconds).toBeNull();
  });
});

describe("generateValidatedPlan with a race result", () => {
  it("anchors the threshold in the entered 10K time (engine priority 1)", () => {
    const race = getRaceById("goteborgsvarvet")!;
    const gen = generateValidatedPlan({
      race,
      ...BASE_INPUT,
      raceResult: { distance: "10k", seconds: 2910 },
    });
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    // 48:30/10K ⇒ race pace 4:51 /km ⇒ threshold ≈ +10 s ⇒ 5:00 (5 s rounding)
    expect(gen.result.thresholdPaceLabel).toBe("5:00");
    expect(gen.result.goalPace?.source).toBe("result");
    expect(gen.result.raceResult?.seconds).toBe(2910);
  });

  it("uses the tier estimate without a result and skips goal pace for non-running", () => {
    const varvet = getRaceById("goteborgsvarvet")!;
    const noResult = generateValidatedPlan({ race: varvet, ...BASE_INPUT, raceResult: null });
    expect(noResult.ok).toBe(true);
    if (noResult.ok) {
      expect(noResult.result.thresholdPaceLabel).toBe("5:45"); // intermediate default
      expect(noResult.result.goalPace?.source).toBe("estimate");
    }

    const vasaloppet = getRaceById("vasaloppet")!;
    const skiing = generateValidatedPlan({ race: vasaloppet, ...BASE_INPUT, raceResult: null });
    expect(skiing.ok).toBe(true);
    if (skiing.ok) expect(skiing.result.goalPace).toBeNull();
  });
});

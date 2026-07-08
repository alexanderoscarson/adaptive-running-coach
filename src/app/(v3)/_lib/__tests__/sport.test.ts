import { describe, expect, it } from "vitest";
import { getRaceById } from "@/lib/races";
import {
  deriveSportThreshold,
  formatThresholdValue,
  predictSportGoal,
  sportTarget,
  volumeConfig,
} from "../sport";
import { generateValidatedPlan } from "../generate-plan";

const BASE = {
  experience: "intermediate" as const,
  daysPerWeek: 3,
  longRunDay: 6,
  raceResult: null,
};

describe("deriveSportThreshold", () => {
  it("uses an entered FTP directly", () => {
    const th = deriveSportThreshold("cycling", "beginner", { key: "ftp", watts: 240 });
    expect(th).toEqual({ kind: "power", value: 240, fromResult: true });
  });

  it("falls back to tier defaults without an anchor", () => {
    expect(deriveSportThreshold("cycling", "advanced", null)?.value).toBe(250);
    expect(deriveSportThreshold("swimming", "intermediate", null)?.value).toBe(130);
    expect(deriveSportThreshold("xc_skiing", "elite", null)?.value).toBeCloseTo(4.33);
  });

  it("derives CSS from a 400 m time", () => {
    // 7:30 on 400 m ⇒ 112.5 s/100 m ⇒ CSS ≈ 118 s/100 m
    const th = deriveSportThreshold("swimming", "beginner", { key: "400", seconds: 450 });
    expect(th?.kind).toBe("css");
    expect(th?.value).toBeCloseTo(118.1, 0);
    expect(th?.fromResult).toBe(true);
  });

  it("derives ski threshold from a Vasaloppet time", () => {
    // 7:30:00 over 90 km ⇒ 5.0 min/km race pace ⇒ threshold 5.0 × 0.87 = 4.35
    const th = deriveSportThreshold("xc_skiing", "beginner", { key: "90", seconds: 27000 });
    expect(th?.value).toBeCloseTo(4.35, 2);
  });

  it("returns null for running and non-dedicated sports", () => {
    expect(deriveSportThreshold("running", "beginner", null)).toBeNull();
    expect(deriveSportThreshold("triathlon", "beginner", null)).toBeNull();
  });
});

describe("sportTarget", () => {
  it("prescribes watts for cycling sessions", () => {
    const th = { kind: "power" as const, value: 200, fromResult: true };
    expect(sportTarget(th, "easy")?.label).toBe("125–135 W");
    expect(sportTarget(th, "intervals")?.label).toBe("210–230 W");
  });

  it("prescribes per-100m paces for swimming", () => {
    const th = { kind: "css" as const, value: 120, fromResult: true };
    const label = sportTarget(th, "tempo")?.label ?? "";
    expect(label).toMatch(/\/100 m$/);
  });

  it("gives no target for rest/strength", () => {
    const th = { kind: "power" as const, value: 200, fromResult: true };
    expect(sportTarget(th, "rest")).toBeNull();
  });
});

describe("predictSportGoal", () => {
  it("predicts a Vansbro swim finish from CSS", () => {
    const goal = predictSportGoal("swimming", { kind: "css", value: 120, fromResult: true }, 1);
    expect(goal?.finishSeconds).toBeCloseTo(120 * 0.99 * 10, 0); // ~19:48 for 1 km
  });

  it("gives cycling no finish-time promise", () => {
    expect(predictSportGoal("cycling", { kind: "power", value: 200, fromResult: true }, 300)).toBeNull();
  });
});

describe("generateValidatedPlan — dedicated sports", () => {
  it("builds a ski plan for Vasaloppet in ski units", () => {
    const race = getRaceById("vasaloppet")!;
    const gen = generateValidatedPlan({
      race,
      ...BASE,
      weeklyKm: Math.round(volumeConfig("xc_skiing").toRunKm(45)),
      sportAnchor: { key: "90", seconds: 27000 },
    });
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    const r = gen.result;
    expect(r.sport).toBe("xc_skiing");
    expect(r.sportThreshold?.fromResult).toBe(true);
    expect(r.sportGoal?.finishSeconds).toBeGreaterThan(0);
    const texts = r.weeks.flatMap((w) => w.sessions.map((s) => s.description + s.title)).join(" ");
    // No run-pace leakage: 6:xx–7:xx /km run paces would sit far above the
    // derived ski threshold (~4:20/km); ski targets are ≤ ~6:10/km.
    for (const s of r.weeks.flatMap((w) => w.sessions)) {
      expect(s.targetPaceMinKm).toBeNull();
    }
    expect(texts).not.toMatch(/7:\d{2}\s*\/km/);
  });

  it("keeps running plans untouched by the sport layer", () => {
    const race = getRaceById("goteborgsvarvet")!;
    const gen = generateValidatedPlan({ race, ...BASE, weeklyKm: 28, sportAnchor: null });
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    expect(gen.result.sportThreshold).toBeNull();
    expect(gen.result.weeks.some((w) => w.sessions.some((s) => s.targetPaceMinKm !== null))).toBe(true);
  });

  it("converts cycling volume and prescribes watts", () => {
    const race = getRaceById("vatternrundan")!;
    const gen = generateValidatedPlan({
      race,
      ...BASE,
      weeklyKm: Math.round(volumeConfig("cycling").toRunKm(90)),
      sportAnchor: { key: "ftp", watts: 220 },
    });
    expect(gen.ok).toBe(true);
    if (!gen.ok) return;
    const texts = gen.result.weeks
      .flatMap((w) => w.sessions.flatMap((s) => s.structure.blocks.map((b) => b.description)))
      .join(" ");
    expect(texts).toMatch(/\d+–\d+ W/);
    expect(texts).not.toMatch(/\/km/);
  });
});

describe("formatThresholdValue", () => {
  it("formats each unit", () => {
    expect(formatThresholdValue("power", 221)).toBe("221 W");
    expect(formatThresholdValue("css", 115)).toBe("1:55 /100 m");
    expect(formatThresholdValue("skiPace", 5.25)).toBe("5:15 /km");
  });
});

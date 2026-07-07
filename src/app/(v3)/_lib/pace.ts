import type { RaceDistance } from "@/types/database";
import { distanceToRaceDistance } from "./race-meta";

/* Pace math for the race-time anchor: parse a user-entered race result,
   predict race-day pace with the Riegel formula, and format times.
   Pure helpers — no "use client". */

export const RACE_DISTANCE_KM: Record<RaceDistance, number> = {
  "5k": 5,
  "10k": 10,
  half_marathon: 21.1,
  marathon: 42.2,
};

export interface RaceResult {
  distance: RaceDistance;
  seconds: number;
}

/** "48:30" → 2910, "1:45:00" → 6300, "45" → 2700. Also accepts bare digits
 *  ("4830" → 48:30, "14500" → 1:45:00) since mobile numeric keyboards have no
 *  colon key. Null when unparseable. */
export function parseTimeToSeconds(raw: string): number | null {
  const trimmed = raw.trim();
  // Digits only → read the last two as seconds, the two before as minutes.
  if (/^\d{3,6}$/.test(trimmed)) {
    const sec = Number(trimmed.slice(-2));
    const min = Number(trimmed.slice(-4, -2));
    const hour = Number(trimmed.slice(0, -4) || 0);
    if (sec > 59 || min > 59) return null;
    const total = hour * 3600 + min * 60 + sec;
    return total > 0 ? total : null;
  }
  const parts = trimmed.split(":");
  if (parts.length === 0 || parts.length > 3) return null;
  if (parts.some((p) => p === "" || !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  let seconds: number;
  if (nums.length === 1) seconds = nums[0] * 60;
  else if (nums.length === 2) seconds = nums[0] * 60 + nums[1];
  else seconds = nums[0] * 3600 + nums[1] * 60 + nums[2];
  if (nums.length > 1 && (nums[nums.length - 1] > 59 || (nums.length === 3 && nums[1] > 59))) return null;
  return seconds > 0 ? seconds : null;
}

/** Sanity gate: a result is plausible when its pace sits in 2:30–12:00 /km. */
export function isPlausibleResult(result: RaceResult): boolean {
  const pace = result.seconds / 60 / RACE_DISTANCE_KM[result.distance];
  return pace >= 2.5 && pace <= 12;
}

/** 6300 → "1:45:00", 2910 → "48:30". */
export function formatTime(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** Riegel prediction: T2 = T1 × (D2/D1)^1.06 — the standard endurance
 *  race-equivalency exponent. */
function riegelSeconds(t1: number, fromKm: number, toKm: number): number {
  return t1 * Math.pow(toKm / fromKm, 1.06);
}

/* Race-pace offsets from threshold, the inverse of the engine's own
   back-calculation in deriveThresholdPace (sec/km). */
const BUCKET_PACE_FROM_THRESHOLD: Record<RaceDistance, number> = {
  "5k": -17.5,
  "10k": -10,
  half_marathon: -4,
  marathon: 12.5,
};

export interface GoalPacePrediction {
  paceMinKm: number;
  finishSeconds: number;
  source: "result" | "estimate";
}

/** Predicted race-day pace + finish time for a running race.
 *  From a real result when given (Riegel), otherwise from the threshold
 *  estimate via the engine's distance offsets. Estimates only — shown as "~". */
export function predictGoalPace(
  raceKm: number,
  thresholdPaceMinKm: number,
  result: RaceResult | null
): GoalPacePrediction {
  if (result) {
    const finishSeconds = riegelSeconds(result.seconds, RACE_DISTANCE_KM[result.distance], raceKm);
    return { paceMinKm: finishSeconds / 60 / raceKm, finishSeconds, source: "result" };
  }
  const bucket = distanceToRaceDistance(raceKm);
  const bucketKm = RACE_DISTANCE_KM[bucket];
  const bucketPace = thresholdPaceMinKm + BUCKET_PACE_FROM_THRESHOLD[bucket] / 60;
  const finishSeconds = riegelSeconds(bucketPace * 60 * bucketKm, bucketKm, raceKm);
  return { paceMinKm: finishSeconds / 60 / raceKm, finishSeconds, source: "estimate" };
}

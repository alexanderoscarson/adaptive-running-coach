import type { Sport } from "@/lib/races";
import type { WeekPlan, PlannedSession } from "@/lib/plan-generator";
import { sessionKmFactor, sportTarget, type SportThreshold } from "./sport";

/* Rewrites the engine's run-denominated weeks into the sport's own units:
   distances via sport factors, and every run-pace mention in titles,
   descriptions and structure blocks replaced by the sport-native target
   (watts / CSS per 100 m / ski pace) for that session type.

   The periodization itself — phases, load progression, recovery weeks,
   hard/easy placement — is untouched: that is the shared validated model
   all three sports map onto (spec §1). */

const PACE_RE = /\d+:\d{2}(?:–\d+:\d{2})?\s*\/km/g;
const KM_RE = /(\d+(?:\.\d+)?)\s*km\b/g;

function rewriteText(text: string, targetLabel: string | null, kmFactor: number): string {
  let out = text;
  if (targetLabel) out = out.replace(PACE_RE, targetLabel);
  out = out.replace(KM_RE, (_, n) => {
    const km = Number(n) * kmFactor;
    const rounded = km >= 10 ? Math.round(km) : Math.round(km * 10) / 10;
    return `${rounded} km`;
  });
  return out;
}

function transformSession(session: PlannedSession, threshold: SportThreshold, kmFactor: number): PlannedSession {
  const target = sportTarget(threshold, session.type);
  const label = target?.label ?? null;
  return {
    ...session,
    title: rewriteText(session.title, label, kmFactor),
    description: rewriteText(session.description, label, kmFactor),
    distanceKm: session.distanceKm === null ? null : Math.round(session.distanceKm * kmFactor * 10) / 10,
    // The run pace must never leak into another sport's session.
    targetPaceMinKm: null,
    structure: {
      blocks: session.structure.blocks.map((b) => ({
        ...b,
        description: rewriteText(b.description, label, kmFactor),
        target_pace_min_km: undefined,
        distance_km: b.distance_km === undefined ? undefined : Math.round(b.distance_km * kmFactor * 10) / 10,
      })),
    },
  };
}

export function transformWeeksForSport(weeks: WeekPlan[], sport: Sport, threshold: SportThreshold): WeekPlan[] {
  const kmFactor = sessionKmFactor(sport);
  return weeks.map((w) => ({
    ...w,
    totalDistanceKm: Math.round(w.totalDistanceKm * kmFactor * 10) / 10,
    longRunKm: Math.round(w.longRunKm * kmFactor * 10) / 10,
    description: rewriteText(w.description, null, kmFactor),
    sessions: w.sessions.map((s) => transformSession(s, threshold, kmFactor)),
  }));
}

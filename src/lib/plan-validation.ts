/**
 * Plan validation module — standalone, testable functions for post-generation checks.
 * These run AFTER the plan is generated, BEFORE it is stored.
 */

import type { PlanPhase, SessionType } from '@/types/database';

// ─── Types ─────────────────────────────────���────────────────────────────────

export interface ValidatableSession {
  type: SessionType;
  title: string;
  description: string;
  distanceKm: number | null;
  dayOfWeek: number;
}

export interface ValidatableWeek {
  weekNumber: number;
  phase: PlanPhase;
  totalDistanceKm: number;
  isRecovery: boolean;
  sessions: ValidatableSession[];
}

export interface ProgressionCorrection {
  weekNumber: number;
  originalKm: number;
  correctedKm: number;
  reason: string;
}

export interface VarietyFailure {
  weekNumber: number;
  phase: PlanPhase;
  sessionTypes: string[];
  reason: string;
}

// ─── Progression validation (Bug 2) ───────────────────────────────��────────

/**
 * Validates and clamps weekly volume progression to a maximum ~10% increase
 * week-over-week. Recovery weeks are allowed to drop ~30% without penalty.
 *
 * Mutates the plan in-place and returns a log of corrections made.
 */
export function validatePlanProgression(
  plan: ValidatableWeek[],
  maxIncreaseRatio = 1.10,
): ProgressionCorrection[] {
  const corrections: ProgressionCorrection[] = [];

  if (plan.length <= 1) return corrections;

  for (let i = 1; i < plan.length; i++) {
    const prevWeek = plan[i - 1];
    const currWeek = plan[i];

    // Skip if current week is a recovery week (allowed to drop)
    if (currWeek.isRecovery) continue;

    // Skip if previous week had zero distance (can't compute ratio)
    if (prevWeek.totalDistanceKm <= 0) continue;

    // Find the last non-recovery week's distance as the reference
    let refDistance = prevWeek.totalDistanceKm;
    if (prevWeek.isRecovery) {
      // Look back to find the last loading week
      for (let j = i - 2; j >= 0; j--) {
        if (!plan[j].isRecovery && plan[j].totalDistanceKm > 0) {
          refDistance = plan[j].totalDistanceKm;
          break;
        }
      }
    }

    const maxAllowed = Math.round(refDistance * maxIncreaseRatio * 10) / 10;

    if (currWeek.totalDistanceKm > maxAllowed) {
      const originalKm = currWeek.totalDistanceKm;
      const correctedKm = maxAllowed;
      const scaleFactor = correctedKm / originalKm;

      // Rescale session distances proportionally
      for (const session of currWeek.sessions) {
        if (session.distanceKm != null && session.distanceKm > 0) {
          session.distanceKm = Math.round(session.distanceKm * scaleFactor * 10) / 10;
        }
      }

      currWeek.totalDistanceKm = correctedKm;

      corrections.push({
        weekNumber: currWeek.weekNumber,
        originalKm,
        correctedKm,
        reason: `Exceeded ${Math.round((maxIncreaseRatio - 1) * 100)}% cap over prior week (${refDistance}km → ${originalKm}km). Clamped to ${correctedKm}km.`,
      });
    }
  }

  return corrections;
}

// ─── Session-type variety validation (Bug 3) ────────────────────────────────

/**
 * Required session types per phase. A week in Build/Peak that contains ONLY
 * easy runs is considered a generation failure.
 */
const REQUIRED_TYPES_BY_PHASE: Record<PlanPhase, SessionType[][]> = {
  // Base: easy + long (at minimum)
  base: [['easy', 'long']],
  // Build: easy + long + at least one quality (tempo or intervals)
  build: [['easy', 'long', 'tempo'], ['easy', 'long', 'intervals']],
  // Peak: same as build but with intervals preferred
  peak: [['easy', 'long', 'intervals'], ['easy', 'long', 'tempo']],
  // Taper: relaxed — easy + long is fine
  taper: [['easy', 'long']],
  // Race: anything goes
  race: [['race']],
};

/**
 * Checks each week for appropriate session-type variety given its phase.
 * Returns a list of weeks that fail the variety check.
 */
export function validateSessionVariety(plan: ValidatableWeek[]): VarietyFailure[] {
  const failures: VarietyFailure[] = [];

  for (const week of plan) {
    if (week.isRecovery) continue;
    if (week.phase === 'race' || week.phase === 'taper') continue;

    const runTypes: SessionType[] = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
    const weekRunSessions = week.sessions.filter(s => runTypes.includes(s.type));
    const uniqueTypes = [...new Set(weekRunSessions.map(s => s.type))];

    // Build/Peak: must not be ALL easy runs
    if ((week.phase === 'build' || week.phase === 'peak') && weekRunSessions.length > 0) {
      const allEasy = uniqueTypes.every(t => t === 'easy' || t === 'recovery');
      if (allEasy) {
        failures.push({
          weekNumber: week.weekNumber,
          phase: week.phase,
          sessionTypes: uniqueTypes,
          reason: `${week.phase} week ${week.weekNumber} contains only easy/recovery runs — requires at least one quality session (tempo, intervals, or long).`,
        });
      }
    }

    // Base: should have at least a long run if more than 2 sessions
    if (week.phase === 'base' && weekRunSessions.length >= 2) {
      const hasLong = uniqueTypes.includes('long');
      if (!hasLong) {
        failures.push({
          weekNumber: week.weekNumber,
          phase: week.phase,
          sessionTypes: uniqueTypes,
          reason: `Base week ${week.weekNumber} has ${weekRunSessions.length} sessions but no long run.`,
        });
      }
    }

    // Every session must have a non-empty type and description (purpose)
    for (const session of week.sessions) {
      if (!session.type || !session.description) {
        failures.push({
          weekNumber: week.weekNumber,
          phase: week.phase,
          sessionTypes: [session.type || 'MISSING'],
          reason: `Session "${session.title}" in week ${week.weekNumber} is missing type or description/purpose.`,
        });
        break; // one failure per week is enough
      }
    }
  }

  return failures;
}

// ─── Coach intro sanitization (Bug 1) ───────────────────────────────────────

/**
 * Patterns that indicate internal generation instructions leaking into user-facing text.
 */
const INSTRUCTION_LEAK_PATTERNS = [
  /\bz[1-5][a-c]?\b.*(?:recovery|endurance|tempo|threshold|vo.max)/i,
  /\b(?:80|20)%.*(?:non-negotiable|intensity distribution)/i,
  /\bzone percentages?\b/i,
  /\b(?:pyramidal|polarized)\s+distribution\b/i,
  /\b5-second increments?\b/i,
  /\bThe athlete (?:has selected|currently runs)\b/i,
  /\bperiodized structure:\s*Base phase/i,
  /\bNever (?:place|label)\b/i,
  /\bThis.*distribution is non-negotiable\b/i,
  /\bZ1.*<\s*80%.*threshold/i,
  /\bZ2.*80[–-]88%/i,
  /\b(?:Recovery|Build|Peak|Taper)\s*(?:phase)?\s*\(/i,
];

/**
 * Returns true if the text contains internal generation instructions
 * that should never appear in user-facing output.
 */
export function containsInstructionLeak(text: string): boolean {
  return INSTRUCTION_LEAK_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Generates a clean, user-facing coach intro message.
 * This replaces the raw prompt content that was leaking into the UI.
 */
export function generateCoachIntro(params: {
  raceName: string;
  totalWeeks: number;
  runsPerWeek: number;
  thresholdPace: string;
  activityClause: string;
  language?: 'en' | 'sv';
}): string {
  const { raceName, totalWeeks, runsPerWeek, thresholdPace, activityClause, language } = params;

  if (language === 'sv') {
    return `Här är din ${totalWeeks}-veckors träningsplan för ${raceName}. Du springer ${runsPerWeek} pass i veckan med tempo runt ${thresholdPace}/km som bas. ${activityClause} Planen bygger gradvis från lugna pass till mer intensiv träning närmare loppet.`;
  }

  return `Here's your ${totalWeeks}-week plan for ${raceName}. You'll run ${runsPerWeek} times per week with paces built around ${thresholdPace}/km. ${activityClause} The plan builds gradually from easy aerobic running toward race-specific intensity closer to race day.`;
}

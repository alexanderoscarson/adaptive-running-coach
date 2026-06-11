import type {
  UserProfile, Goal, Constraint, LifeActivity, PlanPhase, SessionType,
  SessionBlock, RaceDistance
} from '@/types/database';
import { addDays, format, startOfWeek } from 'date-fns';

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_KEY_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const RACE_DISTANCES_KM: Record<RaceDistance, number> = {
  '5k': 5, '10k': 10, 'half_marathon': 21.1, 'marathon': 42.2,
};

// ─── Public types ────────────────────────────────────────────────────────────

export interface WeekPlan {
  weekNumber: number;
  phase: PlanPhase;
  totalDistanceKm: number;
  longRunKm: number;
  qualitySessions: number;
  description: string;
  isRecovery: boolean;
  startsOn: string;
  sessions: PlannedSession[];
}

export interface PlannedSession {
  dayOfWeek: number;
  type: SessionType;
  title: string;
  description: string;
  distanceKm: number | null;
  targetPaceMinKm: number | null;
  targetHrZone: number | null;
  durationMinutes: number | null;
  structure: { blocks: SessionBlock[] };
  orderInDay: number;
}

// ─── Threshold pace derivation (Spec Rule 2) ────────────────────────────────
//
// Priority ladder:
//   1. Recent race result → back-calculate threshold pace
//   2. Self-reported comfortable long run pace → threshold ≈ pace − 5–8%
//   3. Experience tier default
//
// From threshold, derive all session paces:
//   Easy / Z2:       threshold + 60–90 sec/km
//   Long run:        threshold + 75–105 sec/km
//   Tempo / Z3:      threshold + 10–20 sec/km
//   Threshold / Z4:  threshold ± 5 sec/km
//   VO₂max:          threshold − 15–25 sec/km

function deriveThresholdPace(goal: Goal, _profile: UserProfile): number {
  // 1. Recent race result — back-calculate threshold
  if (goal.baseline_10k_seconds && goal.baseline_10k_seconds > 0) {
    const racePace = goal.baseline_10k_seconds / 60 / 10; // min/km
    return racePace + 10 / 60; // +10 sec/km (midpoint of 8–12 range)
  }
  if (goal.baseline_5k_seconds && goal.baseline_5k_seconds > 0) {
    const racePace = goal.baseline_5k_seconds / 60 / 5;
    return racePace + 17.5 / 60; // +17.5 sec/km (midpoint of 15–20 range)
  }
  if (goal.baseline_half_seconds && goal.baseline_half_seconds > 0) {
    const racePace = goal.baseline_half_seconds / 60 / 21.1;
    return racePace + 4 / 60; // +4 sec/km (midpoint of 3–5 range)
  }
  if (goal.baseline_marathon_seconds && goal.baseline_marathon_seconds > 0) {
    const racePace = goal.baseline_marathon_seconds / 60 / 42.2;
    return racePace - 12.5 / 60; // −12.5 sec/km (midpoint of 10–15 range)
  }

  // 3. Experience tier default (conservative)
  // We don't store experience_level in goal, so derive from baseline volume
  const weeklyKm = _profile.current_weekly_mileage_km || 0;
  if (weeklyKm >= 80) return 4.25;        // Elite: 4:15/km
  if (weeklyKm >= 50) return 4.75;        // Advanced: 4:45/km
  if (weeklyKm >= 25) return 5.75;        // Intermediate: 5:45/km
  return 6.75;                              // Beginner: 6:45/km
}

interface DerivedPaces {
  threshold: number;   // min/km (the anchor)
  easy: number;        // threshold + 75 sec (midpoint 60–90)
  easyLow: number;     // threshold + 60 sec (fast end of easy range)
  easyHigh: number;    // threshold + 90 sec (slow end of easy range)
  long: number;        // threshold + 90 sec (midpoint 75–105)
  longLow: number;     // threshold + 75 sec
  longHigh: number;    // threshold + 105 sec
  tempo: number;       // threshold + 15 sec (midpoint 10–20)
  tempoLow: number;    // threshold + 10 sec
  tempoHigh: number;   // threshold + 20 sec
  thresholdLow: number; // threshold − 5 sec
  thresholdHigh: number;// threshold + 5 sec
  vo2max: number;      // threshold − 20 sec (midpoint 15–25)
  vo2maxLow: number;   // threshold − 25 sec (faster)
  vo2maxHigh: number;  // threshold − 15 sec (slower)
  recovery: number;    // easy + 30 sec
}

function derivePaces(thresholdPace: number): DerivedPaces {
  return {
    threshold: thresholdPace,
    easy: thresholdPace + 75 / 60,
    easyLow: thresholdPace + 60 / 60,
    easyHigh: thresholdPace + 90 / 60,
    long: thresholdPace + 90 / 60,
    longLow: thresholdPace + 75 / 60,
    longHigh: thresholdPace + 105 / 60,
    tempo: thresholdPace + 15 / 60,
    tempoLow: thresholdPace + 10 / 60,
    tempoHigh: thresholdPace + 20 / 60,
    thresholdLow: thresholdPace - 5 / 60,
    thresholdHigh: thresholdPace + 5 / 60,
    vo2max: thresholdPace - 20 / 60,
    vo2maxLow: thresholdPace - 25 / 60,
    vo2maxHigh: thresholdPace - 15 / 60,
    recovery: thresholdPace + 75 / 60 + 30 / 60,
  };
}

// ─── Experience level detection ──────────────────────────────────────────────

type ExperienceTier = 'beginner' | 'intermediate' | 'advanced' | 'elite';

function detectExperienceTier(profile: UserProfile, paces: DerivedPaces): ExperienceTier {
  const weeklyKm = profile.current_weekly_mileage_km || 0;
  if (weeklyKm >= 80) return 'elite';
  if (weeklyKm >= 50) return 'advanced';
  if (weeklyKm >= 25) return 'intermediate';
  // Also check easy pace — if slower than 8:00/km, definitely beginner
  if (paces.easy >= 8.0) return 'beginner';
  if (weeklyKm < 15) return 'beginner';
  return 'intermediate';
}

// ─── Run/walk detection (Spec Rule 6) ────────────────────────────────────────

function needsRunWalk(tier: ExperienceTier, easyPace: number): boolean {
  return tier === 'beginner' || easyPace >= 8.0;
}

function runWalkRatio(weekNumber: number): { run: number; walk: number } | null {
  // Progressive: 4:1 → 5:1 → 6:1 → 8:1 → continuous
  if (weekNumber <= 3) return { run: 4, walk: 1 };
  if (weekNumber <= 6) return { run: 5, walk: 1 };
  if (weekNumber <= 9) return { run: 6, walk: 1 };
  if (weekNumber <= 12) return { run: 8, walk: 1 };
  return null; // continuous
}

// ─── Long run time cap (Spec Rule 7) ─────────────────────────────────────────

const LONG_RUN_MAX_MINUTES_STANDARD = 135; // 2h15
const LONG_RUN_MAX_MINUTES_ABSOLUTE = 150; // 2h30, advanced/elite peak only

function capLongRunDuration(
  distanceKm: number,
  pace: number,
  tier: ExperienceTier,
  phase: PlanPhase
): { durationMinutes: number; distanceKm: number; capped: boolean } {
  const estimatedMinutes = distanceKm * pace;
  const cap = (tier === 'advanced' || tier === 'elite') && phase === 'peak'
    ? LONG_RUN_MAX_MINUTES_ABSOLUTE
    : LONG_RUN_MAX_MINUTES_STANDARD;

  if (estimatedMinutes <= cap) {
    return { durationMinutes: Math.round(estimatedMinutes), distanceKm, capped: false };
  }
  // Cap the time and reduce distance to fit
  const cappedDistance = Math.round(cap / pace * 10) / 10;
  return { durationMinutes: cap, distanceKm: cappedDistance, capped: true };
}

// ─── Periodization (Spec Rule 8) ─────────────────────────────────────────────

function getPhaseDistribution(totalWeeks: number): { phase: PlanPhase; weeks: number }[] {
  if (totalWeeks <= 8) {
    return [
      { phase: 'base', weeks: 2 },
      { phase: 'build', weeks: Math.max(2, totalWeeks - 5) },
      { phase: 'peak', weeks: 2 },
      { phase: 'taper', weeks: 1 },
      { phase: 'race', weeks: 1 },
    ];
  }
  const raceWeeks = 1;
  const taperWeeks = totalWeeks >= 16 ? 2 : 1;
  const peakWeeks = Math.max(2, Math.floor(totalWeeks * 0.18));
  const baseWeeks = Math.max(3, Math.floor(totalWeeks * 0.30));
  const buildWeeks = totalWeeks - baseWeeks - peakWeeks - taperWeeks - raceWeeks;
  return [
    { phase: 'base', weeks: baseWeeks },
    { phase: 'build', weeks: buildWeeks },
    { phase: 'peak', weeks: peakWeeks },
    { phase: 'taper', weeks: taperWeeks },
    { phase: 'race', weeks: raceWeeks },
  ];
}

function isRecoveryWeek(weekInPhase: number): boolean {
  // 3-week loading + 1-week recovery (Spec Rule 8)
  return weekInPhase > 0 && (weekInPhase + 1) % 4 === 0;
}

// ─── Pace formatting helpers ─────────────────────────────────────────────────

export function formatPace(paceMinKm: number): string {
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatPaceRange(low: number, high: number): string {
  return `${formatPace(low)}–${formatPace(high)} /km`;
}

// ─── Life-activity load awareness (Spec Rule 4) ─────────────────────────────

interface LoadMap {
  strengthDays: Set<number>;
  teamSportDays: Set<number>;
  constrainedDays: Set<number | null>; // days with any life activity — no quality runs here
  allLoadDays: Set<number>;            // union of all medium/hard load days
}

function buildLoadMap(
  constraints: Constraint[],
  lifeActivities: LifeActivity[]
): LoadMap {
  const strengthDays = new Set<number>();
  const teamSportDays = new Set<number>();
  const constrainedDays = new Set<number | null>();

  for (const c of constraints) {
    if (c.type !== 'recurring_activity' || !c.active || c.day_of_week == null) continue;
    constrainedDays.add(c.day_of_week);
    if (c.activity_type === 'generic_strength') strengthDays.add(c.day_of_week);
  }

  for (const la of lifeActivities) {
    if (!la.active) continue;
    if (la.activity_type !== 'gym' && la.activity_type !== 'team_sport') continue;
    const days = (la.details as Record<string, unknown>)?.days;
    if (!Array.isArray(days)) continue;
    for (const dayKey of days) {
      const dayNum = DAY_KEY_TO_NUMBER[dayKey as string];
      if (dayNum === undefined) continue;
      constrainedDays.add(dayNum);
      if (la.activity_type === 'gym') strengthDays.add(dayNum);
      if (la.activity_type === 'team_sport') teamSportDays.add(dayNum);
    }
  }

  const allLoadDays = new Set<number>([...strengthDays, ...teamSportDays]);

  return { strengthDays, teamSportDays, constrainedDays, allLoadDays };
}

// Check if a day is the day immediately after a load day (Spec Rule 4 & 5)
function isDayAfterLoad(day: number, loadMap: LoadMap): boolean {
  const prevDay = day === 0 ? 6 : day - 1;
  return loadMap.allLoadDays.has(prevDay);
}

// ─── Session placement with quality-gap enforcement (Spec Rule 5) ────────────

function placeSessionsOnDays(
  availableDays: number[],
  runsPerWeek: number,
  longRunDay: number,
  loadMap: LoadMap,
  qualitySessions: number,
  phase: PlanPhase,
  recovery: boolean,
): { longDay: number | null; qualityDays: number[]; easyDays: number[] } {
  const candidateDays = availableDays.filter(d => !loadMap.constrainedDays.has(d));
  let runDays = candidateDays.slice(0, Math.min(runsPerWeek, 6));

  // Ensure longRunDay is included
  if (!runDays.includes(longRunDay) && availableDays.includes(longRunDay) && !loadMap.constrainedDays.has(longRunDay)) {
    if (runDays.length >= runsPerWeek) {
      runDays[runDays.length - 1] = longRunDay;
    } else {
      runDays.push(longRunDay);
    }
    runDays.sort((a, b) => a - b);
  }
  runDays = runDays.slice(0, runsPerWeek);

  const longDay = (runDays.includes(longRunDay) && phase !== 'race') ? longRunDay : null;

  if (recovery || qualitySessions === 0) {
    return { longDay, qualityDays: [], easyDays: runDays.filter(d => d !== longDay) };
  }

  // Place quality sessions: must have ≥1 easy/rest day gap from long run AND not be day-after a load day
  const qualityDays: number[] = [];
  const easyDays: number[] = [];

  const nonLongDays = runDays.filter(d => d !== longDay);

  for (const day of nonLongDays) {
    if (qualityDays.length >= qualitySessions) {
      easyDays.push(day);
      continue;
    }

    // Rule 5: quality must be ≥1 day away from long run
    const longDayVal = longDay ?? -99;
    const distFromLong = Math.min(
      Math.abs(day - longDayVal),
      7 - Math.abs(day - longDayVal)
    );
    const tooCloseToLong = distFromLong <= 1;

    // Rule 4: no quality day-after strength/team-sport
    const afterLoad = isDayAfterLoad(day, loadMap);

    if (tooCloseToLong || afterLoad) {
      easyDays.push(day); // downgrade to easy
    } else {
      qualityDays.push(day);
    }
  }

  // Any remaining non-quality, non-long days become easy
  return { longDay, qualityDays, easyDays };
}

// ─── Session builders ────────────────────────────────────────────────────────

function buildRunWalkNote(ratio: { run: number; walk: number } | null): string {
  if (!ratio) return '';
  return ` Use a run/walk pattern: ${ratio.run} min running / ${ratio.walk} min walking, repeated throughout. Walk breaks are a training method, not a sign of weakness — they let you train longer with less injury risk.`;
}

function createEasyRun(
  distanceKm: number,
  paces: DerivedPaces,
  isRecovery: boolean,
  useRunWalk: boolean,
  rwRatio: { run: number; walk: number } | null,
  weekNumber: number,
): Omit<PlannedSession, 'dayOfWeek'> {
  const paceRange = isRecovery
    ? formatPaceRange(paces.recovery - 15 / 60, paces.recovery + 15 / 60)
    : formatPaceRange(paces.easyLow, paces.easyHigh);

  const rwNote = useRunWalk ? buildRunWalkNote(rwRatio) : '';

  const purposeNote = isRecovery
    ? 'This recovery run promotes blood flow and loosens your legs without adding fatigue.'
    : 'This easy run builds your aerobic base without adding fatigue before your next quality session.';

  const paceTarget = isRecovery ? paces.recovery : paces.easy;
  const estimatedMinutes = Math.round(distanceKm * paceTarget);

  return {
    type: isRecovery ? 'recovery' : 'easy',
    title: isRecovery ? 'Recovery Run' : 'Easy Run',
    description: `${isRecovery ? 'Recovery' : 'Easy'} run — keep your pace between ${paceRange}. This should feel fully conversational.${rwNote} ${purposeNote}`,
    distanceKm: Math.round(distanceKm * 10) / 10,
    targetPaceMinKm: paceTarget,
    targetHrZone: isRecovery ? 1 : 2,
    durationMinutes: estimatedMinutes,
    structure: {
      blocks: [
        { type: 'warmup', description: '5 min walk/easy jog', duration_minutes: 5 },
        {
          type: 'main',
          description: `${isRecovery ? 'Recovery' : 'Easy'} run at ${paceRange}${useRunWalk && rwRatio ? ` (${rwRatio.run}:${rwRatio.walk} run/walk)` : ''}`,
          distance_km: Math.round(Math.max(0, distanceKm - 1) * 10) / 10,
          target_pace_min_km: paceTarget,
          target_hr_zone: isRecovery ? 1 : 2,
        },
        { type: 'cooldown', description: '5 min walk + stretching', duration_minutes: 5 },
      ],
    },
    orderInDay: 0,
  };
}

function createLongRun(
  distanceKm: number,
  paces: DerivedPaces,
  phase: PlanPhase,
  tier: ExperienceTier,
  useRunWalk: boolean,
  rwRatio: { run: number; walk: number } | null,
): Omit<PlannedSession, 'dayOfWeek'> {
  // Rule 7: cap by time
  const { durationMinutes, distanceKm: cappedDist, capped } = capLongRunDuration(
    distanceKm, paces.long, tier, phase
  );

  const paceRange = formatPaceRange(paces.longLow, paces.longHigh);
  const rwNote = useRunWalk ? buildRunWalkNote(rwRatio) : '';
  const capNote = capped
    ? ` We're keeping this under ${Math.floor(durationMinutes / 60)}h${durationMinutes % 60 > 0 ? String(durationMinutes % 60).padStart(2, '0') : ''} so you recover well for the rest of the week.`
    : '';

  const purposeNote = 'The long run builds the time-on-feet durability you\'ll need on race day.';

  const blocks: SessionBlock[] = [
    { type: 'warmup', description: '10 min easy jog', duration_minutes: 10, target_pace_min_km: paces.easyHigh, target_hr_zone: 2 },
  ];

  if ((phase === 'build' || phase === 'peak') && !useRunWalk) {
    const mainDist = Math.round((cappedDist - 3) * 10) / 10;
    const tempoDist = Math.round(mainDist * 0.25 * 10) / 10;
    blocks.push(
      { type: 'main', description: `Steady pace at ${paceRange}`, distance_km: mainDist - tempoDist, target_pace_min_km: paces.long, target_hr_zone: 2 },
      { type: 'main', description: `Tempo finish: ${tempoDist} km at ${formatPaceRange(paces.tempoLow, paces.tempoHigh)}`, distance_km: tempoDist, target_pace_min_km: paces.tempo, target_hr_zone: 3 },
    );
  } else {
    blocks.push(
      { type: 'main', description: `Long run at ${paceRange}${useRunWalk && rwRatio ? ` (${rwRatio.run}:${rwRatio.walk} run/walk)` : ''}`, distance_km: cappedDist - 3, target_pace_min_km: paces.long, target_hr_zone: 2 },
    );
  }

  blocks.push(
    { type: 'cooldown', description: '10 min easy jog + stretching', duration_minutes: 10, target_pace_min_km: paces.easyHigh, target_hr_zone: 1 },
  );

  const titleSuffix = (phase === 'build' || phase === 'peak') && !useRunWalk ? ' with Tempo Finish' : '';

  return {
    type: 'long',
    title: `Long Run${titleSuffix}`,
    description: `Long run — ${durationMinutes} min, staying at ${paceRange}. Do not speed up at the end.${rwNote}${capNote} ${purposeNote}`,
    distanceKm: cappedDist,
    targetPaceMinKm: paces.long,
    targetHrZone: 2,
    durationMinutes,
    structure: { blocks },
    orderInDay: 0,
  };
}

function createTempoRun(
  maxDistance: number,
  paces: DerivedPaces,
  phase: PlanPhase,
): Omit<PlannedSession, 'dayOfWeek'> {
  const dist = Math.min(8, maxDistance);
  const mainDist = Math.round((dist - 4) * 10) / 10;
  const paceRange = formatPaceRange(paces.tempoLow, paces.tempoHigh);
  const warmupPaceRange = formatPaceRange(paces.easyLow, paces.easyHigh);

  const purposeNote = 'The tempo intervals train your body to hold a comfortably hard pace for longer — this is the most important session of the week.';

  if (phase === 'build' || phase === 'peak') {
    // Tempo intervals: 4 × 8 min
    return {
      type: 'tempo',
      title: 'Tempo Intervals',
      description: `Tempo intervals — 4 × 8 min at ${paceRange}, with 2 min easy jog recovery between each. ${purposeNote}`,
      distanceKm: dist,
      targetPaceMinKm: paces.tempo,
      targetHrZone: 3,
      durationMinutes: Math.round(dist * paces.tempo),
      structure: {
        blocks: [
          { type: 'warmup', description: `15 min easy jog at ${warmupPaceRange} + drills`, duration_minutes: 15, target_pace_min_km: paces.easy, target_hr_zone: 2 },
          { type: 'interval', description: `8 min at ${paceRange}`, duration_minutes: 8, target_pace_min_km: paces.tempo, target_hr_zone: 3, repeats: 4 },
          { type: 'recovery', description: '2 min easy jog recovery between reps', duration_minutes: 2, target_pace_min_km: paces.recovery },
          { type: 'cooldown', description: '10 min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy, target_hr_zone: 2 },
        ],
      },
      orderInDay: 0,
    };
  }

  // Base phase: continuous tempo
  return {
    type: 'tempo',
    title: 'Tempo Run',
    description: `Tempo run — ${mainDist} km at ${paceRange} after warm-up. Comfortably hard effort. ${purposeNote}`,
    distanceKm: dist,
    targetPaceMinKm: paces.tempo,
    targetHrZone: 3,
    durationMinutes: Math.round(dist * paces.tempo),
    structure: {
      blocks: [
        { type: 'warmup', description: `15 min easy jog at ${warmupPaceRange} + drills`, duration_minutes: 15, target_pace_min_km: paces.easy, target_hr_zone: 2 },
        { type: 'main', description: `Tempo: ${mainDist} km at ${paceRange}`, distance_km: mainDist, target_pace_min_km: paces.tempo, target_hr_zone: 3 },
        { type: 'cooldown', description: '10 min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy, target_hr_zone: 2 },
      ],
    },
    orderInDay: 0,
  };
}

function createIntervalSession(
  maxDistance: number,
  paces: DerivedPaces,
  phase: PlanPhase,
): Omit<PlannedSession, 'dayOfWeek'> {
  const dist = Math.min(9, maxDistance);
  const reps = phase === 'peak' ? 6 : 5;
  const vo2Range = formatPaceRange(paces.vo2maxLow, paces.vo2maxHigh);
  const warmupRange = formatPaceRange(paces.easyLow, paces.easyHigh);

  const purposeNote = 'These VO₂max intervals build your maximal aerobic power — the engine that drives your race pace.';

  return {
    type: 'intervals',
    title: `${reps}×1 km Intervals`,
    description: `${reps}×1 km at ${vo2Range}, with 400 m easy jog recovery between each. ${purposeNote}`,
    distanceKm: dist,
    targetPaceMinKm: paces.vo2max,
    targetHrZone: 4,
    durationMinutes: Math.round(dist * paces.easy), // approximate total including recovery
    structure: {
      blocks: [
        { type: 'warmup', description: `15 min easy jog at ${warmupRange} + strides`, duration_minutes: 15, target_pace_min_km: paces.easy, target_hr_zone: 2 },
        { type: 'interval', description: `1 km at ${vo2Range}`, distance_km: 1, target_pace_min_km: paces.vo2max, target_hr_zone: 4, repeats: reps },
        { type: 'recovery', description: '400 m jog recovery between reps', distance_km: 0.4, target_pace_min_km: paces.recovery },
        { type: 'cooldown', description: '10 min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy },
      ],
    },
    orderInDay: 0,
  };
}

function createStrengthSession(phase: PlanPhase, preference: string, day: number): PlannedSession {
  const isHeavy = preference === 'heavy' || preference === 'moderate';
  let title: string, description: string;

  if (phase === 'base') {
    title = isHeavy ? 'Strength: Compound Lifts' : 'Strength: Bodyweight Circuit';
    description = isHeavy
      ? 'Squats, deadlifts, lunges — build the foundation. This strength work reduces injury risk and improves your running economy.'
      : 'Squats, planks, push-ups, lunges — build stability. This strength work reduces injury risk and improves your running economy.';
  } else if (phase === 'peak') {
    title = 'Strength: Single-Leg & Plyometrics';
    description = 'Single-leg squats, box jumps, bounding — race-specific power. Maintaining strength in peak phase protects against late-plan injuries.';
  } else if (phase === 'taper') {
    title = 'Strength: Maintenance';
    description = 'Light bodyweight work — maintain without fatiguing. We keep this minimal so you arrive at race day fresh.';
  } else {
    title = 'Strength: Runner-Specific';
    description = 'Hip stability, core, and single-leg strength work. This complements your running without adding excessive fatigue.';
  }

  return {
    dayOfWeek: day,
    type: 'strength',
    title,
    description,
    distanceKm: null,
    targetPaceMinKm: null,
    targetHrZone: null,
    durationMinutes: phase === 'taper' ? 20 : isHeavy ? 45 : 30,
    structure: { blocks: [{ type: 'main', description }] },
    orderInDay: 1,
  };
}

function createRaceDaySession(
  raceDistance: string,
  paces: DerivedPaces,
): Omit<PlannedSession, 'dayOfWeek'> {
  const distKm = RACE_DISTANCES_KM[raceDistance as RaceDistance] || 21.1;
  const goalPaceRange = formatPaceRange(paces.tempoLow, paces.tempoHigh);

  return {
    type: 'race',
    title: `${raceDistance.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Race Day`,
    description: `This is what you trained for. Target pace: ${goalPaceRange}. Start controlled, build rhythm, finish strong. Trust the plan and enjoy it!`,
    distanceKm: distKm,
    targetPaceMinKm: paces.tempo,
    targetHrZone: 4,
    durationMinutes: null,
    structure: {
      blocks: [
        { type: 'warmup', description: '10 min easy jog + dynamic stretches', duration_minutes: 10 },
        { type: 'main', description: `Race at ${goalPaceRange}`, distance_km: distKm },
        { type: 'cooldown', description: '10 min easy jog + stretching', duration_minutes: 10 },
      ],
    },
    orderInDay: 0,
  };
}

// ─── Main generation function ────────────────────────────────────────────────

export function generatePlan(
  profile: UserProfile,
  goal: Goal,
  constraints: Constraint[],
  lifeActivities: LifeActivity[] = []
): WeekPlan[] {
  const totalWeeks = goal.plan_weeks || 17;
  const raceDistance = goal.race_distance || 'half_marathon';
  const raceDistanceKm = RACE_DISTANCES_KM[raceDistance as RaceDistance] || 21.1;

  // ── Derive threshold pace (Spec Rule 2) ──
  const thresholdPace = deriveThresholdPace(goal, profile);
  const paces = derivePaces(thresholdPace);

  console.log(`[PlanGenerator] Threshold pace: ${formatPace(thresholdPace)} /km | Easy: ${formatPaceRange(paces.easyLow, paces.easyHigh)} | Tempo: ${formatPaceRange(paces.tempoLow, paces.tempoHigh)} | VO₂max: ${formatPaceRange(paces.vo2maxLow, paces.vo2maxHigh)}`);

  const tier = detectExperienceTier(profile, paces);
  const useRunWalk = needsRunWalk(tier, paces.easy);

  console.log(`[PlanGenerator] Experience tier: ${tier} | Run/walk: ${useRunWalk}`);

  // ── Load map (Spec Rule 4) ──
  const loadMap = buildLoadMap(constraints, lifeActivities);

  // Collect user-specified strength days
  const userStrengthDays: number[] = [...loadMap.strengthDays];

  // ── Schedule parameters ──
  const currentMileage = profile.current_weekly_mileage_km || 20;
  const runsPerWeek = profile.runs_per_week || 3;
  const availableDays = profile.available_days?.length > 0
    ? profile.available_days
    : [1, 3, 5, 6];
  const longRunDay = profile.preferred_long_run_day ?? 6;

  const phases = getPhaseDistribution(totalWeeks);
  const raceDate = goal.race_date
    ? new Date(goal.race_date)
    : addDays(new Date(), totalWeeks * 7);
  const planStartDate = addDays(raceDate, -(totalWeeks * 7));
  const planStart = startOfWeek(planStartDate, { weekStartsOn: 1 });

  const vacationConstraints = constraints.filter(c => c.type === 'vacation' && c.active);

  console.log(`[PlanGenerator] runsPerWeek: ${runsPerWeek} | availableDays: ${availableDays.map(d => DAY_NAMES[d]).join(', ')} | constrainedDays: ${[...loadMap.constrainedDays].map(d => d != null ? DAY_NAMES[d] : '?').join(', ')} | strengthDays: ${userStrengthDays.map(d => DAY_NAMES[d]).join(', ') || 'none'}`);

  // ── Peak distance targets ──
  const peakDistance = (() => {
    if (raceDistance === 'marathon') return Math.max(currentMileage * 1.8, 70);
    if (raceDistance === 'half_marathon') return Math.max(currentMileage * 1.6, 50);
    if (raceDistance === '10k') return Math.max(currentMileage * 1.4, 35);
    return Math.max(currentMileage * 1.3, 25);
  })();

  // ── Build week-by-week ──
  const weeks: WeekPlan[] = [];
  let globalWeek = 0;
  let phaseWeekCounter = 0;

  for (const phaseBlock of phases) {
    for (let w = 0; w < phaseBlock.weeks; w++) {
      globalWeek++;
      phaseWeekCounter++;
      const weekStart = addDays(planStart, (globalWeek - 1) * 7);
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');

      const isVacation = vacationConstraints.some(vc => {
        if (!vc.start_date || !vc.end_date) return false;
        const vs = new Date(vc.start_date);
        const ve = new Date(vc.end_date);
        return weekStart >= vs && weekStart <= ve;
      });

      const recovery = isRecoveryWeek(phaseWeekCounter - 1) && phaseBlock.phase !== 'taper' && phaseBlock.phase !== 'race';

      // ── Weekly distance calculation ──
      let weekProgress: number;
      if (phaseBlock.phase === 'base') {
        weekProgress = (globalWeek / totalWeeks) * 0.5;
      } else if (phaseBlock.phase === 'build') {
        weekProgress = 0.5 + ((globalWeek - phases[0].weeks) / totalWeeks) * 0.35;
      } else if (phaseBlock.phase === 'peak') {
        weekProgress = 0.9;
      } else if (phaseBlock.phase === 'taper') {
        // Spec Rule 8: reduce volume 40–60% during taper
        weekProgress = 0.5 - (w * 0.15);
      } else {
        weekProgress = 0.3;
      }

      let totalDistance = currentMileage + (peakDistance - currentMileage) * weekProgress;
      // Recovery weeks reduce load by 20–40% (Spec Rule 8)
      if (recovery) totalDistance *= 0.7;
      if (isVacation) totalDistance *= 0.3;
      totalDistance = Math.round(totalDistance * 10) / 10;

      // ── Long run distance ──
      const maxLongRunPercent = phaseBlock.phase === 'base' ? 0.28 : phaseBlock.phase === 'build' ? 0.32 : 0.35;
      let longRunKm = Math.round(totalDistance * maxLongRunPercent * 10) / 10;
      const maxLongRun = raceDistance === 'marathon' ? 35 : raceDistance === 'half_marathon' ? 21 : 15;
      longRunKm = Math.min(longRunKm, maxLongRun);
      if (recovery) longRunKm *= 0.75;

      // Rule 9: max 2 quality for beginner/intermediate; always ≤2 quality sessions/week
      let qualitySessions = recovery ? 0
        : phaseBlock.phase === 'base' ? 1
        : (phaseBlock.phase === 'build' || phaseBlock.phase === 'peak') ? 2
        : 0;
      // Beginner/intermediate: cap at 1 quality in base, 2 in build/peak
      if ((tier === 'beginner' || tier === 'intermediate') && qualitySessions > 2) {
        qualitySessions = 2;
      }

      const description = getWeekDescription(phaseBlock.phase, recovery, isVacation, globalWeek, totalWeeks);

      // ── Build sessions ──
      const sessions = generateWeekSessions({
        phase: phaseBlock.phase,
        totalDistance,
        longRunKm,
        qualitySessions,
        recovery,
        isVacation,
        availableDays,
        longRunDay,
        loadMap,
        paces,
        runsPerWeek,
        weekNumber: globalWeek,
        weekStart,
        strengthPreference: profile.strength_preference || 'none',
        raceDistance,
        userStrengthDays,
        tier,
        useRunWalk,
      });

      weeks.push({
        weekNumber: globalWeek,
        phase: phaseBlock.phase,
        totalDistanceKm: totalDistance,
        longRunKm,
        qualitySessions,
        description,
        isRecovery: recovery,
        startsOn: weekStartStr,
        sessions,
      });
    }
  }

  return weeks;
}

// ─── Week description ────────────────────────────────────────────────────────

function getWeekDescription(phase: PlanPhase, recovery: boolean, vacation: boolean, week: number, total: number): string {
  if (vacation) return 'Rest & recharge week — light activity only';
  if (recovery) return `Recovery week — reduced volume to absorb training from weeks ${Math.max(1, week - 3)}–${week - 1}`;
  switch (phase) {
    case 'base': return 'Building aerobic foundation with easy mileage — approximately 80%+ of this week is at easy pace';
    case 'build': return 'Increasing intensity — threshold and tempo work layered in, maintaining 80/20 easy-to-hard ratio';
    case 'peak': return 'Peak training — race-specific sessions at goal pace, volume at its highest';
    case 'taper': return 'Tapering — maintaining intensity, reducing volume 40–60% for race day freshness';
    case 'race': return 'Race week — trust your training!';
  }
}

// ─── Week session assembly ───────────────────────────────────────────────────

interface WeekSessionParams {
  phase: PlanPhase;
  totalDistance: number;
  longRunKm: number;
  qualitySessions: number;
  recovery: boolean;
  isVacation: boolean;
  availableDays: number[];
  longRunDay: number;
  loadMap: LoadMap;
  paces: DerivedPaces;
  runsPerWeek: number;
  weekNumber: number;
  weekStart: Date;
  strengthPreference: string;
  raceDistance: string;
  userStrengthDays: number[];
  tier: ExperienceTier;
  useRunWalk: boolean;
}

function generateWeekSessions(params: WeekSessionParams): PlannedSession[] {
  const {
    phase, totalDistance, longRunKm, qualitySessions, recovery, isVacation,
    availableDays, longRunDay, loadMap, paces, runsPerWeek,
    weekNumber, strengthPreference, raceDistance, userStrengthDays,
    tier, useRunWalk,
  } = params;

  const rwRatio = useRunWalk ? runWalkRatio(weekNumber) : null;

  // ── Vacation weeks: just 2 easy runs ──
  if (isVacation) {
    return availableDays.slice(0, 2).map((day, i) => ({
      dayOfWeek: day,
      ...createEasyRun(
        Math.round(totalDistance / 2 * 10) / 10,
        paces, false, useRunWalk, rwRatio, weekNumber
      ),
      title: i === 0 ? 'Easy Shake-out' : 'Light Jog',
    }));
  }

  // ── Place sessions with gap enforcement (Rule 4 & 5) ──
  const placement = placeSessionsOnDays(
    availableDays, runsPerWeek, longRunDay, loadMap,
    qualitySessions, phase, recovery,
  );

  const sessions: PlannedSession[] = [];
  let remainingDistance = totalDistance;

  // ── Long run ──
  if (placement.longDay !== null) {
    const lr = createLongRun(longRunKm, paces, phase, tier, useRunWalk, rwRatio);
    sessions.push({ ...lr, dayOfWeek: placement.longDay });
    remainingDistance -= lr.distanceKm || 0;
  }

  // ── Race week ──
  if (phase === 'race') {
    const raceDayIdx = availableDays[availableDays.length - 1] || 6;
    const raceSession = createRaceDaySession(raceDistance, paces);
    sessions.push({ ...raceSession, dayOfWeek: raceDayIdx });
    remainingDistance = Math.max(0, remainingDistance - (raceSession.distanceKm || 0));
  }

  // ── Quality sessions (tempo / intervals) ──
  let qualityAdded = 0;
  for (const day of placement.qualityDays) {
    if (sessions.some(s => s.dayOfWeek === day)) continue;
    if (remainingDistance <= 0) break;

    let qualitySession: Omit<PlannedSession, 'dayOfWeek'>;
    if (qualityAdded === 0) {
      qualitySession = createTempoRun(remainingDistance, paces, phase);
    } else {
      qualitySession = createIntervalSession(remainingDistance, paces, phase);
    }
    sessions.push({ ...qualitySession, dayOfWeek: day });
    remainingDistance -= qualitySession.distanceKm || 0;
    qualityAdded++;
  }

  // ── Easy / recovery runs ──
  for (const day of placement.easyDays) {
    if (sessions.some(s => s.dayOfWeek === day)) continue;
    if (remainingDistance <= 0) break;

    const maxRunDist = recovery ? 6 : 12;
    const remainingSlots = Math.max(1, placement.easyDays.length - sessions.filter(s => s.type === 'easy' || s.type === 'recovery').length);
    const idealDist = Math.round(remainingDistance / remainingSlots * 10) / 10;
    const easyDist = Math.min(idealDist, maxRunDist, remainingDistance);
    if (easyDist < 2) continue;

    const easyRun = createEasyRun(easyDist, paces, recovery, useRunWalk, rwRatio, weekNumber);
    sessions.push({ ...easyRun, dayOfWeek: day });
    remainingDistance -= easyDist;
  }

  // ── Strength sessions (only on user-specified days, never auto-generate) ──
  if (strengthPreference !== 'none' && !isVacation && userStrengthDays.length > 0) {
    for (const sDay of userStrengthDays) {
      if (!sessions.some(s => s.dayOfWeek === sDay)) {
        sessions.push(createStrengthSession(phase, strengthPreference, sDay));
      }
    }
  }

  sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  // ── POST-GENERATION VALIDATION ──

  // 1. Enforce exact run count
  const runTypes: SessionType[] = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
  const runSessions = sessions.filter(s => runTypes.includes(s.type));
  if (runSessions.length > runsPerWeek && phase !== 'race') {
    const excess = runSessions.length - runsPerWeek;
    let removed = 0;
    for (let i = sessions.length - 1; i >= 0 && removed < excess; i--) {
      if (sessions[i].type === 'easy' || sessions[i].type === 'recovery') {
        sessions.splice(i, 1);
        removed++;
      }
    }
    if (removed > 0) console.log(`[PlanGenerator] Trimmed ${removed} excess run sessions for week ${weekNumber}`);
  }

  // 2. No sessions on constrained days
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (loadMap.constrainedDays.has(sessions[i].dayOfWeek)) {
      console.log(`[PlanGenerator] Removing session on constrained day ${DAY_NAMES[sessions[i].dayOfWeek]} for week ${weekNumber}`);
      sessions.splice(i, 1);
    }
  }

  // 3. Strip unauthorized strength sessions
  if (userStrengthDays.length > 0) {
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].type === 'strength' && !userStrengthDays.includes(sessions[i].dayOfWeek)) {
        console.warn(`[PlanGenerator] Removing unauthorized strength session on ${DAY_NAMES[sessions[i].dayOfWeek]} for week ${weekNumber}`);
        sessions.splice(i, 1);
      }
    }
  }

  // 4. HARD RULE: no quality session day-after long run (Rule 5)
  const longRunDayInWeek = sessions.find(s => s.type === 'long')?.dayOfWeek;
  if (longRunDayInWeek !== undefined) {
    const dayAfterLong = (longRunDayInWeek + 1) % 7;
    for (let i = sessions.length - 1; i >= 0; i--) {
      const s = sessions[i];
      if (s.dayOfWeek === dayAfterLong && (s.type === 'tempo' || s.type === 'intervals' || s.type === 'hills')) {
        console.warn(`[PlanGenerator] HARD RULE: Downgrading ${s.type} on ${DAY_NAMES[s.dayOfWeek]} (day after long run) to easy for week ${weekNumber}`);
        const replacement = createEasyRun(s.distanceKm || 5, paces, false, useRunWalk, rwRatio, weekNumber);
        sessions[i] = { ...replacement, dayOfWeek: s.dayOfWeek };
      }
    }
  }

  // 5. HARD RULE: no quality session day-after strength/team-sport (Rule 4)
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if ((s.type === 'tempo' || s.type === 'intervals' || s.type === 'hills' || s.type === 'long') && isDayAfterLoad(s.dayOfWeek, loadMap)) {
      console.warn(`[PlanGenerator] HARD RULE: Downgrading ${s.type} on ${DAY_NAMES[s.dayOfWeek]} (day after load) to easy for week ${weekNumber}`);
      const replacement = createEasyRun(s.distanceKm || 5, paces, false, useRunWalk, rwRatio, weekNumber);
      sessions[i] = { ...replacement, dayOfWeek: s.dayOfWeek };
    }
  }

  // 6. Rule 3: No fitness tests — ensure no session is a time trial
  for (const s of sessions) {
    if (s.title.toLowerCase().includes('time trial') || s.title.toLowerCase().includes('fitness test') || s.title.toLowerCase().includes('ramp test')) {
      console.warn(`[PlanGenerator] HARD RULE: Removing fitness test session "${s.title}" for week ${weekNumber}`);
      s.type = 'easy';
      s.title = 'Easy Run';
      const easyReplacement = createEasyRun(s.distanceKm || 5, paces, false, useRunWalk, rwRatio, weekNumber);
      s.description = easyReplacement.description;
      s.structure = easyReplacement.structure;
    }
  }

  return sessions;
}

// ─── Re-exports for backward compatibility ───────────────────────────────────

export { derivePaces, deriveThresholdPace };

// Legacy compat — keep pacesFromVdot as a wrapper
export function pacesFromVdot(vdot: number) {
  const easyPace = 7.5 - (vdot - 30) * 0.04;
  const tempoPace = easyPace - 0.8;
  const intervalPace = tempoPace - 0.5;
  const longPace = easyPace + 0.2;
  const recoveryPace = easyPace + 0.5;
  return {
    easy: Math.max(easyPace, 4.0),
    tempo: Math.max(tempoPace, 3.2),
    interval: Math.max(intervalPace, 2.8),
    long: Math.max(longPace, 4.2),
    recovery: Math.max(recoveryPace, 4.5),
  };
}

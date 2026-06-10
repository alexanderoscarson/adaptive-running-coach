import type {
  UserProfile, Goal, Constraint, LifeActivity, PlanPhase, SessionType,
  SessionBlock, RaceDistance
} from '@/types/database';
import { addDays, format, startOfWeek, getDay } from 'date-fns';

const DAY_KEY_TO_NUMBER: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

interface WeekPlan {
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

interface PlannedSession {
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

const RACE_DISTANCES_KM: Record<RaceDistance, number> = {
  '5k': 5,
  '10k': 10,
  'half_marathon': 21.1,
  'marathon': 42.2,
};

function estimateVdot(distanceKm: number, timeSeconds: number): number {
  const minutes = timeSeconds / 60;
  const velocity = distanceKm / minutes * 1000;
  return 0.000104 * velocity * velocity - 0.182258 * velocity + 120;
}

function pacesFromVdot(vdot: number) {
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
  return weekInPhase > 0 && (weekInPhase + 1) % 4 === 0;
}

export function generatePlan(
  profile: UserProfile,
  goal: Goal,
  constraints: Constraint[],
  lifeActivities: LifeActivity[] = []
): WeekPlan[] {
  const totalWeeks = goal.plan_weeks || 17;
  const raceDistance = goal.race_distance || 'half_marathon';
  const raceDistanceKm = RACE_DISTANCES_KM[raceDistance];

  let vdot = 35;
  if (goal.baseline_half_seconds) vdot = estimateVdot(21.1, goal.baseline_half_seconds);
  else if (goal.baseline_10k_seconds) vdot = estimateVdot(10, goal.baseline_10k_seconds);
  else if (goal.baseline_5k_seconds) vdot = estimateVdot(5, goal.baseline_5k_seconds);
  else if (goal.baseline_marathon_seconds) vdot = estimateVdot(42.2, goal.baseline_marathon_seconds);
  vdot = Math.max(25, Math.min(70, vdot));

  const paces = pacesFromVdot(vdot);
  const currentMileage = profile.current_weekly_mileage_km || 20;
  const runsPerWeek = profile.runs_per_week || 3;
  const availableDays = profile.available_days?.length > 0
    ? profile.available_days
    : [1, 3, 5, 6]; // Mon, Wed, Fri, Sat
  const longRunDay = profile.preferred_long_run_day ?? 6; // Saturday

  const phases = getPhaseDistribution(totalWeeks);
  const raceDate = goal.race_date
    ? new Date(goal.race_date)
    : addDays(new Date(), totalWeeks * 7);
  const planStartDate = addDays(raceDate, -(totalWeeks * 7));
  const planStart = startOfWeek(planStartDate, { weekStartsOn: 1 });

  const recurringConstraints = constraints.filter(
    c => c.type === 'recurring_activity' && c.active
  );
  const vacationConstraints = constraints.filter(
    c => c.type === 'vacation' && c.active
  );

  const constrainedDays = new Set(recurringConstraints.map(c => c.day_of_week));

  // Merge life activity days (gym, team sport) into constrained days
  for (const la of lifeActivities) {
    if (!la.active) continue;
    if (la.activity_type !== 'gym' && la.activity_type !== 'team_sport') continue;
    const days = (la.details as Record<string, unknown>)?.days;
    if (Array.isArray(days)) {
      for (const dayKey of days) {
        const dayNum = DAY_KEY_TO_NUMBER[dayKey as string];
        if (dayNum !== undefined) constrainedDays.add(dayNum);
      }
    }
  }

  // Collect user-specified strength days from constraints and life_activities
  const userStrengthDays: number[] = [];
  for (const c of recurringConstraints) {
    if (c.activity_type === 'generic_strength' && c.day_of_week != null) {
      userStrengthDays.push(c.day_of_week);
    }
  }
  for (const la of lifeActivities) {
    if (!la.active || la.activity_type !== 'gym') continue;
    const days = (la.details as Record<string, unknown>)?.days;
    if (Array.isArray(days)) {
      for (const dayKey of days) {
        const dayNum = DAY_KEY_TO_NUMBER[dayKey as string];
        if (dayNum !== undefined && !userStrengthDays.includes(dayNum)) {
          userStrengthDays.push(dayNum);
        }
      }
    }
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  console.log('[PlanGenerator] runsPerWeek:', runsPerWeek, '| availableDays:', availableDays.map(d => dayNames[d]).join(', '), '| constrainedDays:', [...constrainedDays].map(d => d != null ? dayNames[d] : '?').join(', '), '| userStrengthDays:', userStrengthDays.map(d => dayNames[d]).join(', '));

  const weeks: WeekPlan[] = [];
  let globalWeek = 0;
  let phaseWeekCounter = 0;

  const peakDistance = (() => {
    if (raceDistance === 'marathon') return Math.max(currentMileage * 1.8, 70);
    if (raceDistance === 'half_marathon') return Math.max(currentMileage * 1.6, 50);
    if (raceDistance === '10k') return Math.max(currentMileage * 1.4, 35);
    return Math.max(currentMileage * 1.3, 25);
  })();

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

      let weekProgress: number;
      if (phaseBlock.phase === 'base') {
        weekProgress = (globalWeek / totalWeeks) * 0.5;
      } else if (phaseBlock.phase === 'build') {
        weekProgress = 0.5 + ((globalWeek - phases[0].weeks) / totalWeeks) * 0.35;
      } else if (phaseBlock.phase === 'peak') {
        weekProgress = 0.9;
      } else if (phaseBlock.phase === 'taper') {
        weekProgress = 0.7 - (w * 0.15);
      } else {
        weekProgress = 0.3;
      }

      let totalDistance = currentMileage + (peakDistance - currentMileage) * weekProgress;
      if (recovery) totalDistance *= 0.7;
      if (isVacation) totalDistance *= 0.3;
      totalDistance = Math.round(totalDistance * 10) / 10;

      const maxLongRunPercent = phaseBlock.phase === 'base' ? 0.28 : phaseBlock.phase === 'build' ? 0.32 : 0.35;
      let longRunKm = Math.round(totalDistance * maxLongRunPercent * 10) / 10;
      const maxLongRun = raceDistance === 'marathon' ? 35 : raceDistance === 'half_marathon' ? 21 : 15;
      longRunKm = Math.min(longRunKm, maxLongRun);
      if (recovery) longRunKm *= 0.75;

      const qualitySessions = recovery ? 0 : phaseBlock.phase === 'base' ? 1 : phaseBlock.phase === 'build' || phaseBlock.phase === 'peak' ? 2 : 0;

      const description = getWeekDescription(phaseBlock.phase, recovery, isVacation, globalWeek, totalWeeks);

      const sessions = generateWeekSessions({
        phase: phaseBlock.phase,
        totalDistance,
        longRunKm,
        qualitySessions,
        recovery,
        isVacation,
        availableDays,
        longRunDay,
        constrainedDays,
        paces,
        runsPerWeek,
        weekNumber: globalWeek,
        weekStart,
        strengthPreference: profile.strength_preference || 'none',
        raceDistance,
        userStrengthDays,
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

function getWeekDescription(phase: PlanPhase, recovery: boolean, vacation: boolean, week: number, total: number): string {
  if (vacation) return 'Rest & recharge week — light activity only';
  if (recovery) return `Recovery week — reduced volume to absorb training from weeks ${Math.max(1, week - 3)}–${week - 1}`;
  switch (phase) {
    case 'base': return 'Building aerobic foundation with easy mileage and strides';
    case 'build': return 'Increasing intensity — tempo and interval work layered in';
    case 'peak': return 'Peak training — highest volume and specificity';
    case 'taper': return 'Tapering — maintaining intensity, reducing volume for race day';
    case 'race': return 'Race week — trust your training!';
  }
}

interface WeekSessionParams {
  phase: PlanPhase;
  totalDistance: number;
  longRunKm: number;
  qualitySessions: number;
  recovery: boolean;
  isVacation: boolean;
  availableDays: number[];
  longRunDay: number;
  constrainedDays: Set<number | null>;
  paces: ReturnType<typeof pacesFromVdot>;
  runsPerWeek: number;
  weekNumber: number;
  weekStart: Date;
  strengthPreference: string;
  raceDistance: string;
  userStrengthDays: number[]; // Only place strength on these days (from constraints/life_activities)
}

function generateWeekSessions(params: WeekSessionParams): PlannedSession[] {
  const {
    phase, totalDistance, longRunKm, qualitySessions, recovery, isVacation,
    availableDays, longRunDay, constrainedDays, paces, runsPerWeek,
    weekNumber, weekStart, strengthPreference, raceDistance, userStrengthDays,
  } = params;

  if (isVacation) {
    return availableDays.slice(0, 2).map((day, i) => ({
      dayOfWeek: day,
      type: 'easy' as SessionType,
      title: i === 0 ? 'Easy Shake-out' : 'Light Jog',
      description: 'Keep the legs moving with a relaxed, conversational-pace run.',
      distanceKm: Math.round(totalDistance / 2 * 10) / 10,
      targetPaceMinKm: paces.easy + 0.3,
      targetHrZone: 2,
      durationMinutes: null,
      structure: {
        blocks: [
          { type: 'main', description: `Easy run at ${formatPace(paces.easy + 0.3)}/km`, distance_km: Math.round(totalDistance / 2 * 10) / 10, target_pace_min_km: paces.easy + 0.3, target_hr_zone: 2 },
        ],
      },
      orderInDay: 0,
    }));
  }

  const sessions: PlannedSession[] = [];
  const candidateDays = availableDays.filter(d => !constrainedDays.has(d));
  let runDays = candidateDays.slice(0, Math.min(runsPerWeek, 6));

  // Ensure longRunDay is included — but REPLACE, don't add, to keep exactly runsPerWeek
  if (!runDays.includes(longRunDay) && availableDays.includes(longRunDay) && !constrainedDays.has(longRunDay)) {
    if (runDays.length >= runsPerWeek) {
      // Replace the last non-long-run day
      runDays[runDays.length - 1] = longRunDay;
    } else {
      runDays.push(longRunDay);
    }
    runDays.sort((a, b) => a - b);
  }

  // Hard cap: never exceed runsPerWeek
  runDays = runDays.slice(0, runsPerWeek);

  const longRunAdded = runDays.includes(longRunDay);
  let remainingDistance = totalDistance;

  if (longRunAdded && phase !== 'race') {
    const lr = createLongRun(longRunKm, paces, phase, weekNumber, raceDistance);
    sessions.push({ ...lr, dayOfWeek: longRunDay });
    remainingDistance -= longRunKm;
  }

  if (phase === 'race') {
    const raceDayIdx = runDays[runDays.length - 1] || 6;
    sessions.push({
      dayOfWeek: raceDayIdx,
      type: 'race',
      title: `${raceDistance.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Race Day`,
      description: 'This is what you trained for. Trust the plan and enjoy it!',
      distanceKm: RACE_DISTANCES_KM[raceDistance as RaceDistance] || 21.1,
      targetPaceMinKm: paces.tempo,
      targetHrZone: 4,
      durationMinutes: null,
      structure: {
        blocks: [
          { type: 'warmup', description: '10min easy jog + dynamic stretches', duration_minutes: 10 },
          { type: 'main', description: `Race! Target pace: ${formatPace(paces.tempo)}/km`, distance_km: RACE_DISTANCES_KM[raceDistance as RaceDistance] || 21.1 },
          { type: 'cooldown', description: '10min easy jog + stretching', duration_minutes: 10 },
        ],
      },
      orderInDay: 0,
    });
    remainingDistance = Math.max(0, remainingDistance - (RACE_DISTANCES_KM[raceDistance as RaceDistance] || 21.1));
  }

  let qualityAdded = 0;
  const otherRunDays = runDays.filter(d => d !== longRunDay || phase === 'race');

  for (const day of otherRunDays) {
    if (sessions.some(s => s.dayOfWeek === day)) continue;
    if (remainingDistance <= 0) break;

    if (qualityAdded < qualitySessions && !recovery) {
      const qualitySession = createQualitySession(
        phase, paces, remainingDistance, qualityAdded, raceDistance
      );
      sessions.push({ ...qualitySession, dayOfWeek: day });
      remainingDistance -= qualitySession.distanceKm || 0;
      qualityAdded++;
    } else {
      // Cap per-run distance: recovery max 6km, easy max 12km
      const maxRunDist = recovery ? 6 : 12;
      const remainingSlots = Math.max(1, otherRunDays.length - sessions.length + 1);
      const idealDist = Math.round(remainingDistance / remainingSlots * 10) / 10;
      const easyDist = Math.min(idealDist, maxRunDist, remainingDistance);
      if (easyDist < 2) continue;
      sessions.push({
        dayOfWeek: day,
        type: recovery ? 'recovery' : 'easy',
        title: recovery ? 'Recovery Run' : 'Easy Run',
        description: recovery
          ? 'Very easy effort. Focus on form and staying relaxed.'
          : 'Conversational pace. Building aerobic fitness.',
        distanceKm: Math.round(easyDist * 10) / 10,
        targetPaceMinKm: recovery ? paces.recovery : paces.easy,
        targetHrZone: recovery ? 1 : 2,
        durationMinutes: null,
        structure: {
          blocks: [
            { type: 'warmup', description: '5min walk/easy jog', duration_minutes: 5 },
            { type: 'main', description: `${recovery ? 'Recovery' : 'Easy'} run at ${formatPace(recovery ? paces.recovery : paces.easy)}/km`, distance_km: Math.round(Math.max(0, easyDist - 1) * 10) / 10, target_pace_min_km: recovery ? paces.recovery : paces.easy, target_hr_zone: recovery ? 1 : 2 },
            { type: 'cooldown', description: '5min walk + stretching', duration_minutes: 5 },
          ],
        },
        orderInDay: 0,
      });
      remainingDistance -= easyDist;
    }
  }

  // Only add strength sessions on user-specified strength days — never auto-generate on other days
  if (strengthPreference !== 'none' && !isVacation && userStrengthDays.length > 0) {
    for (const sDay of userStrengthDays) {
      if (!sessions.some(s => s.dayOfWeek === sDay)) {
        sessions.push(createStrengthSession(phase, strengthPreference, sDay));
      }
    }
  }

  sessions.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  // POST-GENERATION VALIDATION
  // 1. Enforce exact run count — trim excess run sessions
  const runTypes: SessionType[] = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
  const runSessions = sessions.filter(s => runTypes.includes(s.type));
  if (runSessions.length > runsPerWeek && phase !== 'race') {
    const excess = runSessions.length - runsPerWeek;
    // Remove the last N easy/recovery runs (keep quality + long)
    let removed = 0;
    for (let i = sessions.length - 1; i >= 0 && removed < excess; i--) {
      if (sessions[i].type === 'easy' || sessions[i].type === 'recovery') {
        sessions.splice(i, 1);
        removed++;
      }
    }
    console.log(`[PlanGenerator] Trimmed ${removed} excess run sessions for week ${weekNumber}`);
  }

  // 2. Ensure no sessions land on constrained days
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (constrainedDays.has(sessions[i].dayOfWeek)) {
      console.log(`[PlanGenerator] Removing session on constrained day ${sessions[i].dayOfWeek} for week ${weekNumber}`);
      sessions.splice(i, 1);
    }
  }

  // 3. Strip any strength sessions on days NOT in userStrengthDays
  if (userStrengthDays.length > 0) {
    for (let i = sessions.length - 1; i >= 0; i--) {
      if (sessions[i].type === 'strength' && !userStrengthDays.includes(sessions[i].dayOfWeek)) {
        console.warn(`[PlanGenerator] Removing unauthorized strength session on day ${sessions[i].dayOfWeek} for week ${weekNumber} — only allowed on [${userStrengthDays.join(',')}]`);
        sessions.splice(i, 1);
      }
    }
  }

  return sessions;
}

function createLongRun(distanceKm: number, paces: ReturnType<typeof pacesFromVdot>, phase: PlanPhase, _week: number, _raceDistance: string): Omit<PlannedSession, 'dayOfWeek'> {
  const blocks: SessionBlock[] = [
    { type: 'warmup', description: '10min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy + 0.3, target_hr_zone: 2 },
  ];

  if (phase === 'build' || phase === 'peak') {
    const mainDist = Math.round((distanceKm - 3) * 10) / 10;
    const tempoDist = Math.round(mainDist * 0.3 * 10) / 10;
    blocks.push(
      { type: 'main', description: `Easy pace for ${Math.round(mainDist - tempoDist)}km`, distance_km: mainDist - tempoDist, target_pace_min_km: paces.long, target_hr_zone: 2 },
      { type: 'main', description: `Tempo finish: ${tempoDist}km at ${formatPace(paces.tempo)}/km`, distance_km: tempoDist, target_pace_min_km: paces.tempo, target_hr_zone: 3 },
    );
  } else {
    blocks.push(
      { type: 'main', description: `Long run at ${formatPace(paces.long)}/km`, distance_km: distanceKm - 3, target_pace_min_km: paces.long, target_hr_zone: 2 },
    );
  }

  blocks.push(
    { type: 'cooldown', description: '10min easy jog + stretching', duration_minutes: 10, target_pace_min_km: paces.easy + 0.5, target_hr_zone: 1 },
  );

  return {
    type: 'long',
    title: phase === 'build' || phase === 'peak' ? 'Long Run with Tempo Finish' : 'Long Run',
    description: `Build endurance with a steady long run. Stay relaxed and fuel well.`,
    distanceKm,
    targetPaceMinKm: paces.long,
    targetHrZone: 2,
    durationMinutes: null,
    structure: { blocks },
    orderInDay: 0,
  };
}

function createQualitySession(
  phase: PlanPhase, paces: ReturnType<typeof pacesFromVdot>,
  maxDistance: number, qualityIndex: number, _raceDistance: string
): Omit<PlannedSession, 'dayOfWeek'> {
  if (phase === 'base' || qualityIndex === 0) {
    const dist = Math.min(8, maxDistance);
    return {
      type: 'tempo',
      title: 'Tempo Run',
      description: 'Comfortably hard effort — build lactate threshold.',
      distanceKm: dist,
      targetPaceMinKm: paces.tempo,
      targetHrZone: 3,
      durationMinutes: null,
      structure: {
        blocks: [
          { type: 'warmup', description: '15min easy jog + drills', duration_minutes: 15, target_pace_min_km: paces.easy, target_hr_zone: 2 },
          { type: 'main', description: `Tempo: ${Math.round((dist - 4) * 10) / 10}km at ${formatPace(paces.tempo)}/km`, distance_km: dist - 4, target_pace_min_km: paces.tempo, target_hr_zone: 3 },
          { type: 'cooldown', description: '10min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy + 0.3, target_hr_zone: 2 },
        ],
      },
      orderInDay: 0,
    };
  }

  const dist = Math.min(9, maxDistance);
  const reps = phase === 'peak' ? 6 : 5;
  return {
    type: 'intervals',
    title: `${reps}×1km Intervals`,
    description: 'Build VO2max with hard repeats and full recovery.',
    distanceKm: dist,
    targetPaceMinKm: paces.interval,
    targetHrZone: 4,
    durationMinutes: null,
    structure: {
      blocks: [
        { type: 'warmup', description: '15min easy jog + strides', duration_minutes: 15, target_pace_min_km: paces.easy, target_hr_zone: 2 },
        { type: 'interval', description: `1km at ${formatPace(paces.interval)}/km`, distance_km: 1, target_pace_min_km: paces.interval, target_hr_zone: 4, repeats: reps },
        { type: 'recovery', description: '400m jog recovery between reps', distance_km: 0.4, target_pace_min_km: paces.recovery },
        { type: 'cooldown', description: '10min easy jog', duration_minutes: 10, target_pace_min_km: paces.easy + 0.3 },
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
      ? 'Squats, deadlifts, lunges — build the foundation.'
      : 'Squats, planks, push-ups, lunges — build stability.';
  } else if (phase === 'peak') {
    title = 'Strength: Single-Leg & Plyometrics';
    description = 'Single-leg squats, box jumps, bounding — race-specific power.';
  } else if (phase === 'taper') {
    title = 'Strength: Maintenance';
    description = 'Light bodyweight work — maintain without fatiguing.';
  } else {
    title = 'Strength: Runner-Specific';
    description = 'Hip stability, core, and single-leg strength work.';
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

function formatPace(paceMinKm: number): string {
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export { formatPace, pacesFromVdot, estimateVdot };

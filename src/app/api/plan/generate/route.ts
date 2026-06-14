import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generatePlan, formatPace, deriveThresholdPace, derivePaces } from '@/lib/plan-generator';
import { RACES } from '@/lib/races';
import { format, addDays } from 'date-fns';

const DAY_KEY_TO_NAME: Record<string, string> = {
  sunday: 'Sundays', monday: 'Mondays', tuesday: 'Tuesdays', wednesday: 'Wednesdays',
  thursday: 'Thursdays', friday: 'Fridays', saturday: 'Saturdays',
};

const DAY_NUM_TO_NAME: Record<number, string> = {
  0: 'Sundays', 1: 'Mondays', 2: 'Tuesdays', 3: 'Wednesdays',
  4: 'Thursdays', 5: 'Fridays', 6: 'Saturdays',
};

const DAY_KEY_TO_NUM: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profileRes, goalRes, constraintsRes, lifeActivitiesRes, userRacesRes, userSportsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('life_activities').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true).limit(1),
    supabase.from('user_sports').select('*').eq('user_id', user.id),
  ]);

  if (!profileRes.data || !goalRes.data) {
    const details = {
      userId: user.id,
      profileFound: !!profileRes.data,
      profileError: profileRes.error?.message || null,
      goalFound: !!goalRes.data,
      goalError: goalRes.error?.message || null,
    };
    console.error('Plan generation failed: missing data', details);
    return NextResponse.json({
      error: `Plan generation failed: ${!profileRes.data ? 'user profile not found' : 'no active goal found'} (user: ${user.id.slice(0, 8)}...)`,
      details,
    }, { status: 404 });
  }

  // ── Log all input data for debugging ──
  const profile = profileRes.data;
  const goal = goalRes.data;
  const lifeActivities = (lifeActivitiesRes.data || []).filter((la: { active: boolean }) => la.active);
  const activeConstraints = (constraintsRes.data || []).filter((c: { active: boolean }) => c.active);
  const userSports = userSportsRes.data || [];

  // ── FULL INPUT AUDIT LOG ──
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  console.log('═══════════════════════════════════════════════');
  console.log('[PlanGenerate] FULL INPUT AUDIT');
  console.log('───────────────────────────────────────────────');
  console.log('[PlanGenerate] Profile:', JSON.stringify({
    runs_per_week: profile.runs_per_week,
    available_days: profile.available_days?.map((d: number) => dayNames[d]),
    preferred_long_run_day: profile.preferred_long_run_day != null ? dayNames[profile.preferred_long_run_day] : null,
    strength_preference: profile.strength_preference,
    current_weekly_mileage_km: profile.current_weekly_mileage_km,
    preferred_session_length: profile.preferred_session_length,
    time_preference: profile.time_preference,
  }));
  console.log('[PlanGenerate] Goal:', JSON.stringify({
    race_distance: goal.race_distance,
    race_date: goal.race_date,
    plan_weeks: goal.plan_weeks,
    baseline_5k: goal.baseline_5k_seconds,
    baseline_10k: goal.baseline_10k_seconds,
    baseline_half: goal.baseline_half_seconds,
    baseline_marathon: goal.baseline_marathon_seconds,
  }));
  console.log('[PlanGenerate] Life activities count:', lifeActivities.length,
    lifeActivities.length > 0
      ? lifeActivities.map((la: { activity_type: string; details: unknown; sport_name: string | null }) =>
          `${la.activity_type}${la.sport_name ? `(${la.sport_name})` : ''}: ${JSON.stringify(la.details)}`
        ).join(' | ')
      : '(none — no gym, team sport, or other activities)');
  console.log('[PlanGenerate] Active constraints count:', activeConstraints.length,
    activeConstraints.length > 0
      ? activeConstraints.map((c: { type: string; activity_type: string | null; day_of_week: number | null }) =>
          `${c.type}/${c.activity_type}@${c.day_of_week != null ? dayNames[c.day_of_week] : 'n/a'}`
        ).join(' | ')
      : '(none)');
  console.log('[PlanGenerate] User sports count:', userSports.length);
  console.log('═══════════════════════════════════════════════');

  // Log warnings for missing input fields
  if (!goal.race_distance) console.warn('[PlanGenerate] WARNING: goal.race_distance is missing');
  if (!goal.race_date) console.warn('[PlanGenerate] WARNING: goal.race_date is missing');
  if (!profile.runs_per_week) console.warn('[PlanGenerate] WARNING: profile.runs_per_week is missing');
  if (!profile.available_days?.length) console.warn('[PlanGenerate] WARNING: profile.available_days is empty');

  // ── Extract strength + team sport days for validation ──
  // Only populated from current onboarding data — if no life activities exist, these stay empty
  const strengthDays: number[] = [];
  const teamSportDays: number[] = [];

  for (const la of lifeActivities) {
    if (!la.active) continue;
    const days = (la.details as Record<string, unknown>)?.days;
    if (!Array.isArray(days)) continue;
    for (const dayKey of days) {
      const num = DAY_KEY_TO_NUM[dayKey as string];
      if (num === undefined) continue;
      if (la.activity_type === 'gym' && !strengthDays.includes(num)) strengthDays.push(num);
      if (la.activity_type === 'team_sport' && !teamSportDays.includes(num)) teamSportDays.push(num);
    }
  }
  for (const c of activeConstraints) {
    if (c.type === 'recurring_activity' && c.activity_type === 'generic_strength' && c.day_of_week != null) {
      if (!strengthDays.includes(c.day_of_week)) strengthDays.push(c.day_of_week);
    }
  }

  console.log('[PlanGenerate] strengthDays:', strengthDays.length > 0 ? strengthDays.map(d => dayNames[d]).join(', ') : 'NONE — no strength sessions will be generated');
  console.log('[PlanGenerate] teamSportDays:', teamSportDays.length > 0 ? teamSportDays.map(d => dayNames[d]).join(', ') : 'NONE — no team sport avoidance needed');

  // ── Derive threshold pace for logging and response ──
  const thresholdPace = deriveThresholdPace(goal, profile);
  const paces = derivePaces(thresholdPace);
  console.log(`[PlanGenerate] Derived threshold pace: ${formatPace(thresholdPace)} /km`);

  // ── Resolve race name and distance for plan generator ──
  const userRace = userRacesRes.data?.[0];
  let resolvedRaceName = 'your race';
  let resolvedRaceDistanceKm: number | undefined;
  if (userRace?.custom_name) {
    resolvedRaceName = userRace.custom_name;
    if (userRace.custom_distance_km) resolvedRaceDistanceKm = userRace.custom_distance_km;
  } else if (userRace?.race_id) {
    const libRace = RACES.find(r => r.id === userRace.race_id);
    if (libRace) {
      resolvedRaceName = libRace.name;
      resolvedRaceDistanceKm = libRace.distanceKm;
    }
  }

  // ── Generate the plan ──
  const plan = generatePlan(profile, goal, activeConstraints, lifeActivities, resolvedRaceName, resolvedRaceDistanceKm);

  // ── POST-GENERATION VALIDATION ──
  // Strip any strength sessions on unauthorized days (belt-and-suspenders with plan-generator.ts)
  if (strengthDays.length > 0) {
    for (const week of plan) {
      for (let i = week.sessions.length - 1; i >= 0; i--) {
        if (week.sessions[i].type === 'strength' && !strengthDays.includes(week.sessions[i].dayOfWeek)) {
          console.warn(`[PlanGenerate] VALIDATION: Removing unauthorized strength session on day ${week.sessions[i].dayOfWeek} in week ${week.weekNumber}`);
          week.sessions.splice(i, 1);
        }
      }
    }
  }

  // Validate: no quality session day-after long run (Rule 5 double-check)
  for (const week of plan) {
    const longSession = week.sessions.find(s => s.type === 'long');
    if (!longSession) continue;
    const dayAfterLong = (longSession.dayOfWeek + 1) % 7;
    for (const s of week.sessions) {
      if (s.dayOfWeek === dayAfterLong && ['tempo', 'intervals', 'hills'].includes(s.type)) {
        console.warn(`[PlanGenerate] VALIDATION FAIL: ${s.type} on ${dayNames[s.dayOfWeek]} is day-after long run in week ${week.weekNumber}`);
      }
    }
  }

  // Log first 3 weeks for audit
  for (const week of plan.slice(0, 3)) {
    const runTypes = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
    const runs = week.sessions.filter(s => runTypes.includes(s.type));
    console.log(`[PlanGenerate] Week ${week.weekNumber}: ${runs.length} runs on [${runs.map(s => dayNames[s.dayOfWeek]).join(', ')}], total sessions: ${week.sessions.length}`);
  }

  // ── Write to database ──
  await supabase.from('sessions').delete().eq('user_id', user.id);
  await supabase.from('plan_intents').delete().eq('user_id', user.id);

  for (const week of plan) {
    const { data: intent } = await supabase.from('plan_intents').insert({
      user_id: user.id,
      goal_id: goal.id,
      week_number: week.weekNumber,
      phase: week.phase,
      week_state: week.weekNumber === 1 ? 'current' : 'planned',
      total_distance_km: week.totalDistanceKm,
      long_run_km: week.longRunKm,
      quality_sessions: week.qualitySessions,
      description: week.description,
      is_recovery: week.isRecovery,
      starts_on: week.startsOn,
    }).select().single();

    if (intent) {
      const sessions = week.sessions.map(s => {
        const sessionDate = addDays(new Date(week.startsOn), s.dayOfWeek === 0 ? 6 : s.dayOfWeek - 1);
        return {
          user_id: user.id,
          plan_intent_id: intent.id,
          week_number: week.weekNumber,
          day_of_week: s.dayOfWeek,
          session_date: format(sessionDate, 'yyyy-MM-dd'),
          type: s.type,
          title: s.title,
          description: s.description,
          distance_km: s.distanceKm,
          target_pace_min_km: s.targetPaceMinKm,
          target_hr_zone: s.targetHrZone,
          duration_minutes: s.durationMinutes,
          structure: s.structure,
          status: 'planned',
          order_in_day: s.orderInDay,
        };
      });

      if (sessions.length > 0) {
        await supabase.from('sessions').insert(sessions);
      }
    }
  }

  // ── Generate plan explanation ──
  const raceName = resolvedRaceName;

  const totalWeeks = plan.length;

  // Build activity awareness clause — only from current data
  const activityNotes: string[] = [];
  if (lifeActivities.length > 0) {
    for (const la of lifeActivities) {
      if (!la.active) continue;
      const days = (la.details as Record<string, unknown>)?.days;
      if (Array.isArray(days) && days.length > 0) {
        const dayNamesList = days.map((d: string) => DAY_KEY_TO_NAME[d] || d).join(' and ');
        if (la.activity_type === 'team_sport') {
          activityNotes.push(`you play ${la.sport_name || 'team sport'} on ${dayNamesList}`);
        } else if (la.activity_type === 'gym') {
          activityNotes.push(`you do strength training on ${dayNamesList}`);
        }
      }
    }
  }
  if (activeConstraints.length > 0) {
    for (const c of activeConstraints) {
      if (c.type !== 'recurring_activity' || c.day_of_week == null) continue;
      const dayName = DAY_NUM_TO_NAME[c.day_of_week] || `day ${c.day_of_week}`;
      const actLabel = c.activity_type === 'generic_strength' ? 'strength training' : (c.activity_type || 'an activity');
      if (!activityNotes.some(n => n.includes(actLabel))) {
        activityNotes.push(`you have ${actLabel} on ${dayName}`);
      }
    }
  }

  const activityClause = activityNotes.length > 0
    ? `Since ${activityNotes.join(' and ')}, I've structured your week to avoid scheduling hard runs on or next to those days.`
    : `I've spread your sessions across the week to balance training and recovery.`;

  const runsPerWeek = profile.runs_per_week || 3;
  const thresholdNote = `Your plan is built around a threshold pace of ${formatPace(thresholdPace)} /km — all training paces are derived from this anchor.`;

  const explanation = `Here's your ${totalWeeks}-week training plan for ${raceName}. ${thresholdNote} ${activityClause} The athlete has selected exactly ${runsPerWeek} run sessions per week. You'll run ${runsPerWeek} times per week, starting with a base-building phase focused on aerobic fitness (80%+ easy pace), before introducing more intensity closer to race day. The plan includes recovery weeks every 3–4 weeks to let your body absorb the training. All recommended paces are expressed in whole 5-second increments (e.g. 5:00, 5:05, 5:10). Never place two recovery runs on consecutive days unless there is a quality session or rest day before them. Distribute run types logically: long run on the highest-availability day, quality sessions spaced with easy/rest days between them.`;

  // Save explanation as a coach message
  await supabase.from('coach_messages').insert({
    user_id: user.id,
    role: 'assistant',
    content: explanation,
    action_type: 'none',
    action_data: {
      type: 'plan_explanation',
      race_name: raceName,
      total_weeks: totalWeeks,
      threshold_pace_kmmin: thresholdPace,
    },
  });

  return NextResponse.json({
    success: true,
    weeks: plan.length,
    explanation,
    raceName,
    threshold_pace_kmmin: thresholdPace,
  });
}

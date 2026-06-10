import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generatePlan } from '@/lib/plan-generator';
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

export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profileRes, goalRes, constraintsRes, lifeActivitiesRes, userRacesRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('life_activities').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true).limit(1),
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

  console.log('[PlanGenerate] Profile runs_per_week:', profileRes.data.runs_per_week, '| available_days:', profileRes.data.available_days, '| life_activities:', (lifeActivitiesRes.data || []).map((la: { activity_type: string; details: unknown }) => ({ type: la.activity_type, details: la.details })));

  const plan = generatePlan(profileRes.data, goalRes.data, constraintsRes.data || [], lifeActivitiesRes.data || []);

  // Log validation: check session counts per week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const week of plan.slice(0, 3)) {
    const runTypes = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
    const runs = week.sessions.filter(s => runTypes.includes(s.type));
    console.log(`[PlanGenerate] Week ${week.weekNumber}: ${runs.length} runs on [${runs.map(s => dayNames[s.dayOfWeek]).join(', ')}], total sessions: ${week.sessions.length}`);
  }

  // Delete existing plan
  await supabase.from('sessions').delete().eq('user_id', user.id);
  await supabase.from('plan_intents').delete().eq('user_id', user.id);

  for (const week of plan) {
    const { data: intent } = await supabase.from('plan_intents').insert({
      user_id: user.id,
      goal_id: goalRes.data.id,
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

  // Generate plan explanation from user data
  // Resolve race name: try custom_name → library lookup by race_id → goal distance fallback
  const userRace = userRacesRes.data?.[0];
  let raceName = 'your race';
  if (userRace?.custom_name) {
    raceName = userRace.custom_name;
  } else if (userRace?.race_id) {
    const libRace = RACES.find(r => r.id === userRace.race_id);
    if (libRace) raceName = libRace.name;
  }
  if (raceName === 'your race' && goalRes.data.race_distance) {
    const distNames: Record<string, string> = { '5k': '5K', '10k': '10K', 'half_marathon': 'Half Marathon', 'marathon': 'Marathon' };
    raceName = distNames[goalRes.data.race_distance] || goalRes.data.race_distance;
  }

  const totalWeeks = plan.length;
  const lifeActivities = lifeActivitiesRes.data || [];
  const activeConstraints = constraintsRes.data || [];

  const activityNotes: string[] = [];
  // Check life_activities for gym/team_sport days
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
  // Also check constraints for recurring activities (tennis, gym, etc.)
  for (const c of activeConstraints) {
    if (c.type !== 'recurring_activity' || c.day_of_week == null) continue;
    const dayName = DAY_NUM_TO_NAME[c.day_of_week] || `day ${c.day_of_week}`;
    const actLabel = c.activity_type === 'generic_strength' ? 'strength training' : (c.activity_type || 'an activity');
    // Don't duplicate if already covered by life_activities
    if (!activityNotes.some(n => n.includes(actLabel))) {
      activityNotes.push(`you have ${actLabel} on ${dayName}`);
    }
  }

  const activityClause = activityNotes.length > 0
    ? `Since ${activityNotes.join(' and ')}, I've structured your week to avoid scheduling hard runs on or next to those days.`
    : `I've spread your sessions across the week to balance training and recovery.`;

  const runsPerWeek = profileRes.data.runs_per_week || 3;
  const explanation = `Here's your ${totalWeeks}-week training plan for ${raceName}. ${activityClause} You'll run ${runsPerWeek} times per week, starting with a base-building phase focused on aerobic fitness, before introducing more intensity closer to race day. The plan includes recovery weeks every 3–4 weeks to let your body absorb the training.`;

  // Save explanation as a coach message with special action_type
  await supabase.from('coach_messages').insert({
    user_id: user.id,
    role: 'assistant',
    content: explanation,
    action_type: 'none',
    action_data: { type: 'plan_explanation', race_name: raceName, total_weeks: totalWeeks },
  });

  return NextResponse.json({ success: true, weeks: plan.length, explanation, raceName });
}

import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { generatePlan } from '@/lib/plan-generator';
import { format, addDays } from 'date-fns';

export async function POST() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [profileRes, goalRes, constraintsRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
    supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
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

  const plan = generatePlan(profileRes.data, goalRes.data, constraintsRes.data || []);

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

  return NextResponse.json({ success: true, weeks: plan.length });
}

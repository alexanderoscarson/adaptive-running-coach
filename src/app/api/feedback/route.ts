import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, rpe, notes, actualDistanceKm, actualDurationSeconds, avgHr, maxHr, avgPaceMinKm } = await request.json();

  const { data: session } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { data: log, error } = await supabase.from('session_logs').insert({
    session_id: sessionId,
    user_id: user.id,
    actual_distance_km: actualDistanceKm || session.distance_km,
    actual_duration_seconds: actualDurationSeconds,
    avg_hr: avgHr,
    max_hr: maxHr,
    avg_pace_min_km: avgPaceMinKm,
    rpe,
    notes,
  }).select().single();

  await supabase.from('sessions').update({
    status: 'completed',
    updated_at: new Date().toISOString(),
  }).eq('id', sessionId);

  if (rpe && (rpe <= 3 || rpe >= 8)) {
    await adjustUpcomingSessions(supabase, user.id, rpe, avgPaceMinKm, session.target_pace_min_km);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(log);
}

async function adjustUpcomingSessions(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  userId: string,
  rpe: number,
  actualPace: number | null,
  targetPace: number | null
) {
  const { data: upcoming } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('session_date', new Date().toISOString().split('T')[0])
    .order('session_date')
    .limit(7);

  if (!upcoming?.length) return;

  const paceAdjustment = rpe >= 8 ? 0.15 : rpe <= 3 ? -0.1 : 0;
  const distanceAdjustment = rpe >= 8 ? 0.9 : rpe <= 3 ? 1.05 : 1;

  for (const session of upcoming) {
    if (session.type === 'rest' || session.type === 'strength') continue;

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (session.target_pace_min_km && paceAdjustment !== 0) {
      updates.target_pace_min_km = Math.round((session.target_pace_min_km + paceAdjustment) * 100) / 100;
    }
    if (session.distance_km && distanceAdjustment !== 1) {
      updates.distance_km = Math.round(session.distance_km * distanceAdjustment * 10) / 10;
    }

    if (Object.keys(updates).length > 1) {
      updates.adaptation_reason = rpe >= 8
        ? 'Reduced targets — recent RPE indicates high fatigue'
        : 'Bumped targets — recent RPE indicates room to push';

      await supabase.from('sessions').update(updates).eq('id', session.id);
    }
  }
}

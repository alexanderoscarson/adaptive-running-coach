import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.STRAVA_VERIFY_TOKEN) {
    return NextResponse.json({ 'hub.challenge': challenge });
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (body.object_type !== 'activity' || body.aspect_type !== 'create') {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createServiceSupabase();
  const athleteId = String(body.owner_id);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('strava_athlete_id', athleteId)
    .single();

  if (!profile) return NextResponse.json({ ok: true });

  let accessToken = profile.strava_access_token;
  if (profile.strava_token_expires_at && profile.strava_token_expires_at < Date.now() / 1000) {
    const refreshRes = await fetch('https://www.strava.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        refresh_token: profile.strava_refresh_token,
        grant_type: 'refresh_token',
      }),
    });
    const refreshData = await refreshRes.json();
    accessToken = refreshData.access_token;
    await supabase.from('user_profiles').update({
      strava_access_token: refreshData.access_token,
      strava_refresh_token: refreshData.refresh_token,
      strava_token_expires_at: refreshData.expires_at,
    }).eq('id', profile.id);
  }

  const activityRes = await fetch(
    `https://www.strava.com/api/v3/activities/${body.object_id}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const activity = await activityRes.json();

  if (activity.type !== 'Run') return NextResponse.json({ ok: true });

  const activityDate = new Date(activity.start_date_local).toISOString().split('T')[0];

  const { data: matchingSession } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', profile.id)
    .eq('session_date', activityDate)
    .eq('status', 'planned')
    .in('type', ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'])
    .order('order_in_day')
    .limit(1)
    .single();

  if (matchingSession) {
    await supabase.from('session_logs').insert({
      session_id: matchingSession.id,
      user_id: profile.id,
      actual_distance_km: Math.round(activity.distance / 100) / 10,
      actual_duration_seconds: activity.moving_time,
      avg_hr: activity.average_heartrate || null,
      max_hr: activity.max_heartrate || null,
      avg_pace_min_km: activity.moving_time ? Math.round((activity.moving_time / 60) / (activity.distance / 1000) * 100) / 100 : null,
      strava_activity_id: String(body.object_id),
    });

    await supabase.from('sessions').update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    }).eq('id', matchingSession.id);
  }

  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const weekNumber = searchParams.get('week');

  let query = supabase
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('session_date', { ascending: true })
    .order('order_in_day', { ascending: true });

  if (date) {
    query = query.eq('session_date', date);
  } else if (weekNumber) {
    query = query.eq('week_number', parseInt(weekNumber));
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, status } = await request.json();

  const { data, error } = await supabase
    .from('sessions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId, newDayOfWeek, newSessionDate } = await request.json();

  const { data: existing } = await supabase
    .from('sessions')
    .select('week_number')
    .eq('user_id', user.id)
    .eq('day_of_week', newDayOfWeek)
    .eq('week_number', (await supabase.from('sessions').select('week_number').eq('id', sessionId).eq('user_id', user.id).single()).data?.week_number ?? 0);

  if (existing && existing.length >= 2) {
    return NextResponse.json({ error: 'Day is full (max 2 sessions)' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('sessions')
    .update({
      day_of_week: newDayOfWeek,
      session_date: newSessionDate,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { sessionId } = await request.json();

  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

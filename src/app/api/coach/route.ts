import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { chatWithCoach } from '@/lib/coach';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { message, language, conversationId } = await request.json();

  const [profileRes, userRacesRes, userSportsRes, messagesRes, logsRes, sessionsRes, constraintsRes, checkinRes] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('user_sports').select('*').eq('user_id', user.id),
    conversationId
      ? supabase.from('coach_messages').select('*').eq('user_id', user.id).eq('conversation_id', conversationId).order('created_at', { ascending: true }).limit(20)
      : supabase.from('coach_messages').select('*').eq('user_id', user.id).order('created_at', { ascending: true }).limit(20),
    supabase.from('session_logs').select('*, session:sessions(*)').eq('user_id', user.id).gte('completed_at', new Date(Date.now() - 7 * 86400000).toISOString()).order('completed_at', { ascending: false }),
    supabase.from('sessions').select('*').eq('user_id', user.id).eq('status', 'planned').gte('session_date', new Date().toISOString().split('T')[0]).order('session_date', { ascending: true }).limit(14),
    supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
    supabase.from('weekly_checkins').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
  ]);

  if (!profileRes.data) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  await supabase.from('coach_messages').insert({
    user_id: user.id,
    role: 'user',
    content: message,
    action_type: 'none',
    ...(conversationId ? { conversation_id: conversationId } : {}),
  });

  const history = (messagesRes.data || []).map(m => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  history.push({ role: 'user', content: message });

  // Override profile language with client-side preference if provided
  const profileWithLang = language
    ? { ...profileRes.data, language: language as 'en' | 'sv' }
    : profileRes.data;

  const result = await chatWithCoach(history, {
    profile: profileWithLang,
    userRaces: userRacesRes.data || [],
    userSports: userSportsRes.data || [],
    recentLogs: logsRes.data || [],
    upcomingSessions: sessionsRes.data || [],
    constraints: constraintsRes.data || [],
    lastCheckin: checkinRes.data?.[0] || null,
  });

  const assistantMsg = await supabase.from('coach_messages').insert({
    user_id: user.id,
    role: 'assistant',
    content: result.content,
    action_type: result.proposal ? 'proposal' : 'none',
    action_data: result.proposal,
    ...(conversationId ? { conversation_id: conversationId } : {}),
  }).select().single();

  return NextResponse.json({
    message: result.content,
    proposal: result.proposal,
    messageId: assistantMsg.data?.id,
  });
}

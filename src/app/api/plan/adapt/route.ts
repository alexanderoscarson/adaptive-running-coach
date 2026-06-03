import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { action, messageId, proposal } = await request.json();

  if (action === 'apply' && proposal) {
    const { affected_session_ids, changes, summary, reason } = proposal;

    const previousStates: Record<string, unknown>[] = [];

    if (affected_session_ids?.length) {
      const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .in('id', affected_session_ids);

      if (sessions) {
        previousStates.push(...sessions);

        for (const session of sessions) {
          const updates: Record<string, unknown> = { status: 'adapted', adaptation_reason: reason, updated_at: new Date().toISOString() };
          if (changes?.new_distance_km) updates.distance_km = changes.new_distance_km;
          if (changes?.new_pace_min_km) updates.target_pace_min_km = changes.new_pace_min_km;
          if (changes?.new_type) updates.type = changes.new_type;
          if (changes?.new_title) updates.title = changes.new_title;
          if (changes?.new_description) updates.description = changes.new_description;

          await supabase.from('sessions').update(updates).eq('id', session.id);
        }
      }
    }

    if (changes?.volume_change_percent) {
      const { data: upcoming } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'planned')
        .gte('session_date', new Date().toISOString().split('T')[0])
        .order('session_date')
        .limit(7);

      if (upcoming) {
        for (const session of upcoming) {
          if (session.distance_km) {
            const factor = 1 + (changes.volume_change_percent / 100);
            await supabase.from('sessions').update({
              distance_km: Math.round(session.distance_km * factor * 10) / 10,
              status: 'adapted',
              adaptation_reason: reason,
            }).eq('id', session.id);
          }
        }
      }
    }

    const { data: audit } = await supabase.from('audit_entries').insert({
      user_id: user.id,
      action: `plan_modification: ${proposal.modification_type}`,
      reason: reason || summary,
      details: { proposal, changes },
      coach_message_id: messageId,
      undo_data: { previous_states: previousStates },
    }).select().single();

    if (messageId) {
      await supabase.from('coach_messages').update({ action_type: 'applied' }).eq('id', messageId);
    }

    return NextResponse.json({ success: true, auditId: audit?.id });
  }

  if (action === 'skip' && messageId) {
    await supabase.from('coach_messages').update({ action_type: 'skipped' }).eq('id', messageId);
    return NextResponse.json({ success: true });
  }

  if (action === 'undo') {
    const { auditId } = await request.json();
    const { data: audit } = await supabase
      .from('audit_entries')
      .select('*')
      .eq('id', auditId)
      .eq('user_id', user.id)
      .single();

    if (audit?.undo_data?.previous_states) {
      for (const prev of audit.undo_data.previous_states as Record<string, unknown>[]) {
        await supabase.from('sessions').update(prev).eq('id', prev.id);
      }
      await supabase.from('audit_entries').update({ undone: true }).eq('id', auditId);
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

import Anthropic from '@anthropic-ai/sdk';
import type { UserProfile, Session, SessionLog, Constraint, UserRace, UserSport, WeeklyCheckin } from '@/types/database';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CoachContext {
  profile: UserProfile;
  userRaces: UserRace[];
  userSports: UserSport[];
  recentLogs: (SessionLog & { session: Session })[];
  upcomingSessions: Session[];
  constraints: Constraint[];
  lastCheckin?: WeeklyCheckin | null;
}

const COACH_SYSTEM_PROMPT = `You are an AI endurance training coach for Parrot (PT). You help athletes training for races across running, cycling, cross-country skiing, swimming, and triathlon.

LANGUAGE RULE (critical):
- Check the athlete's language preference in the context below.
- If their language is "sv", respond ENTIRELY in Swedish. Use informal "du" (never "ni"). Swedish should feel native — not translated.
- If their language is "en", respond in English.
- NEVER mix languages in a single response.

Your coaching style:
- Encouraging but honest. Beginner-friendly — never assume knowledge
- Explain WHY sessions are structured the way they are
- Warm and direct tone
- Avoid overly sporty jargon for beginners
- Reference specific data from their training when available

Your role:
- Answer questions about training, nutrition, recovery, and race strategy
- Analyze recent training data and provide insights
- Consider ALL activities (not just endurance) when assessing training load
- Propose specific plan modifications when the athlete's situation changes
- For multi-race plans (like Svensk Klassiker), periodize across all goal races

When you want to modify the training plan, use the propose_plan_modification tool.

CRITICAL RULES FOR RESPONSE LENGTH:
- Keep responses SHORT: 2 to 3 sentences max for simple questions
- For analysis, use max 4 to 5 sentences with clear structure
- Never use markdown headers in responses
- Use plain conversational language, not report style
- One key insight per response
- If you need to say more, let the user ask follow-ups

REGULAR TRAVEL RULE:
- If the athlete has "regular_travel" in their life activities, they have recurring schedule disruptions.
- Insert one "flex week" every 3–4 weeks with ~25% reduced volume, no sessions requiring fixed equipment (pool, indoor bike, weights), and only running or bodyweight activities.
- In the weekly Sunday check-in, include a reminder that flex weeks exist and ask the user to confirm whether the upcoming week is a travel week or a normal week.

STRENGTH & TEAM SPORT SCHEDULING:
- If the athlete has strength training days specified, never schedule a hard endurance session (intervals, tempo, hills) the day before or after a strength day. Place easy/recovery sessions adjacent to strength days instead.
- If the athlete has team sport days specified, treat those as moderate-to-high load days and avoid stacking quality endurance sessions on the same or adjacent days.

Other guidelines:
- Use metric units (km, min/km)
- Consider cross-training and life activities when assessing fatigue
- If RPE is consistently high (7+) for easy sessions, suggest reducing intensity
- If RPE is consistently low (3-4) for quality sessions, suggest increasing targets
- Always explain WHY you're recommending a change`;

const PLAN_MODIFICATION_TOOL: Anthropic.Tool = {
  name: 'propose_plan_modification',
  description: 'Propose a change to the training plan. Use when suggesting modifications to upcoming sessions, weekly volume, or workout structure.',
  input_schema: {
    type: 'object' as const,
    properties: {
      modification_type: {
        type: 'string',
        enum: ['swap_session', 'adjust_volume', 'adjust_pace', 'add_rest', 'reschedule', 'replace_session'],
        description: 'The type of modification being proposed',
      },
      summary: {
        type: 'string',
        description: 'A short (1-2 sentence) summary of the change',
      },
      reason: {
        type: 'string',
        description: 'Why this change is recommended',
      },
      affected_session_ids: {
        type: 'array',
        items: { type: 'string' },
        description: 'IDs of sessions that would be modified',
      },
      changes: {
        type: 'object',
        description: 'The specific changes to apply',
        properties: {
          new_distance_km: { type: 'number' },
          new_pace_min_km: { type: 'number' },
          new_type: { type: 'string' },
          new_title: { type: 'string' },
          new_description: { type: 'string' },
          volume_change_percent: { type: 'number' },
        },
      },
    },
    required: ['modification_type', 'summary', 'reason'],
  },
};

function formatPace(paceMinKm: number): string {
  const mins = Math.floor(paceMinKm);
  const secs = Math.round((paceMinKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function buildContextMessage(ctx: CoachContext): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let context = `## Athlete Profile
- Language preference: ${ctx.profile.language || 'en'}
- Session preference: ${ctx.profile.preferred_session_length || '45-60'} min, ${ctx.profile.time_preference || 'any'} time
- Training days: ${ctx.profile.available_days?.map(d => dayNames[d]).join(', ') || 'Not set'}

## Goal Races
`;
  if (ctx.userRaces.length === 0) {
    context += 'No races selected.\n';
  } else {
    for (const ur of ctx.userRaces) {
      context += `- ${ur.race_id || ur.custom_name} (${ur.target_date || 'no date'})\n`;
    }
  }

  context += `\n## Sports & Levels\n`;
  for (const us of ctx.userSports) {
    context += `- ${us.sport}: ${us.experience_level} (priority: ${us.priority_weight}%)\n`;
  }

  context += `\n## Recent 7 Days of Training\n`;
  if (ctx.recentLogs.length === 0) {
    context += 'No sessions logged in the past 7 days.\n';
  } else {
    for (const log of ctx.recentLogs) {
      context += `- ${log.session.title} (${log.session.sport} / ${log.session.type}): ${log.actual_distance_km || '?'}km, ${log.avg_pace_min_km ? formatPace(log.avg_pace_min_km) + '/km' : '?'}, RPE ${log.rpe || '?'}/10${log.notes ? ` — "${log.notes}"` : ''}\n`;
    }
  }

  context += `\n## Upcoming 7 Days\n`;
  if (ctx.upcomingSessions.length === 0) {
    context += 'No sessions scheduled.\n';
  } else {
    for (const s of ctx.upcomingSessions) {
      context += `- ${dayNames[s.day_of_week] || '?'}: ${s.title} (${s.sport} / ${s.type}) — ${s.distance_km || '?'}km [${s.status}] (id: ${s.id})\n`;
    }
  }

  if (ctx.constraints.length > 0) {
    context += `\n## Active Constraints\n`;
    for (const c of ctx.constraints) {
      if (c.type === 'injury') context += `- INJURY: ${c.injury_description} (${c.injury_severity})\n`;
      else if (c.type === 'vacation') context += `- VACATION: ${c.start_date} to ${c.end_date} (${c.vacation_mode})\n`;
      else if (c.type === 'recurring_activity') context += `- ${c.activity_type} on ${dayNames[c.day_of_week || 0]}\n`;
      else context += `- ${c.type}: ${JSON.stringify(c.details)}\n`;
    }
  }

  if (ctx.lastCheckin) {
    context += `\n## Last Check-in\n`;
    context += `- Feeling: ${ctx.lastCheckin.feeling_score}/5\n`;
    context += `- Status: ${ctx.lastCheckin.status}\n`;
  }

  return context;
}

export async function chatWithCoach(
  messages: { role: 'user' | 'assistant'; content: string }[],
  context: CoachContext
): Promise<{
  content: string;
  proposal: Record<string, unknown> | null;
}> {
  const contextMessage = buildContextMessage(context);

  const anthropicMessages: Anthropic.MessageParam[] = [
    {
      role: 'user',
      content: `[CONTEXT — do not repeat this to the user]\n${contextMessage}\n[END CONTEXT]\n\n${messages[0]?.content || 'Hello!'}`,
    },
    ...messages.slice(1).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: COACH_SYSTEM_PROMPT,
    tools: [PLAN_MODIFICATION_TOOL],
    messages: anthropicMessages,
  });

  let textContent = '';
  let proposal: Record<string, unknown> | null = null;

  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += block.text;
    } else if (block.type === 'tool_use' && block.name === 'propose_plan_modification') {
      proposal = block.input as Record<string, unknown>;
    }
  }

  return { content: textContent, proposal };
}

export async function generateWeeklyCheckin(context: CoachContext): Promise<string> {
  const contextMessage = buildContextMessage(context);

  const completedSessions = context.recentLogs.length;
  const totalLoad = context.recentLogs.reduce((sum, l) => sum + (l.actual_distance_km || 0), 0);
  const missedSessions = context.upcomingSessions.filter(s => s.status === 'skipped');

  const checkinPrompt = `Generate a weekly check-in message for this athlete. Include:
1. A brief recap of last week (${completedSessions} sessions completed, ${totalLoad.toFixed(1)}km total)
${missedSessions.length > 0 ? `2. Acknowledge missed session(s): ${missedSessions.map(s => s.title).join(', ')}. Ask how the week went.` : '2. A positive observation about their consistency.'}
3. Ask "How are you feeling?" to prompt them to share their energy level.

Keep it to 3-4 sentences. Warm, conversational tone. If their language preference is 'sv', write in Swedish using informal "du".`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: COACH_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `[CONTEXT]\n${contextMessage}\n[END CONTEXT]\n\n${checkinPrompt}`,
      },
    ],
  });

  const text = response.content.find(b => b.type === 'text');
  return text?.type === 'text' ? text.text : '';
}

export async function adaptPlanForFeeling(
  feelingScore: number,
  context: CoachContext
): Promise<{ message: string; adjustments: Record<string, unknown> }> {
  const contextMessage = buildContextMessage(context);

  const prompt = `The athlete rated their feeling as ${feelingScore}/5 (1=exhausted, 2=tired, 3=okay, 4=good, 5=great).

Based on this, propose next week's plan. If feeling is 1-2, reduce volume/intensity. If 3, maintain. If 4-5, can slightly increase or maintain.

Respond with:
1. A short message (2-3 sentences) explaining what you'd adjust and why
2. Use the propose_plan_modification tool if changes are needed`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    system: COACH_SYSTEM_PROMPT,
    tools: [PLAN_MODIFICATION_TOOL],
    messages: [
      {
        role: 'user',
        content: `[CONTEXT]\n${contextMessage}\n[END CONTEXT]\n\n${prompt}`,
      },
    ],
  });

  let message = '';
  let adjustments: Record<string, unknown> = {};

  for (const block of response.content) {
    if (block.type === 'text') {
      message += block.text;
    } else if (block.type === 'tool_use' && block.name === 'propose_plan_modification') {
      adjustments = block.input as Record<string, unknown>;
    }
  }

  return { message, adjustments };
}

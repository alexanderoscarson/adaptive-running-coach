import Anthropic from '@anthropic-ai/sdk';
import type { UserProfile, Goal, Session, SessionLog, Constraint } from '@/types/database';
import { formatPace } from './plan-generator';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface CoachContext {
  profile: UserProfile;
  goal: Goal;
  recentLogs: (SessionLog & { session: Session })[];
  upcomingSessions: Session[];
  constraints: Constraint[];
}

const COACH_SYSTEM_PROMPT = `You are an expert running coach AI embedded in a training app. You combine deep knowledge of exercise physiology with an encouraging, pragmatic coaching style.

Your role:
- Answer questions about training, nutrition, recovery, and race strategy
- Analyze recent training data and provide insights
- Propose specific plan modifications when the athlete's situation changes
- Be proactive about identifying signs of overtraining, under-recovery, or good progress

When you want to modify the training plan, use the propose_plan_modification tool. This creates a visual proposal card the user can Apply, Tweak, or Skip.

Guidelines:
- Keep responses concise and actionable (2-4 sentences usually)
- Reference specific data points from their training
- If RPE is consistently high (7+) for easy runs, suggest reducing intensity
- If RPE is consistently low (3-4) for quality sessions, suggest increasing targets
- Always explain WHY you're recommending a change
- Be encouraging but honest
- Use metric units (km, min/km)`;

const PLAN_MODIFICATION_TOOL: Anthropic.Tool = {
  name: 'propose_plan_modification',
  description: 'Propose a change to the training plan. Use this when suggesting modifications to upcoming sessions, weekly volume, or workout structure.',
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

function buildContextMessage(ctx: CoachContext): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let context = `## Athlete Profile
- Age: ${ctx.profile.age || 'Unknown'}, Gender: ${ctx.profile.gender || 'Unknown'}
- Weekly mileage: ${ctx.profile.current_weekly_mileage_km || '?'}km, Runs/week: ${ctx.profile.runs_per_week || '?'}
- Max HR: ${ctx.profile.max_hr || 'Unknown'}, Resting HR: ${ctx.profile.resting_hr || 'Unknown'}

## Goal
- Type: ${ctx.goal.type}, Distance: ${ctx.goal.race_distance || 'N/A'}
- Race date: ${ctx.goal.race_date || 'No specific date'}
- Target time: ${ctx.goal.target_time_seconds ? `${Math.floor(ctx.goal.target_time_seconds / 3600)}h${Math.floor((ctx.goal.target_time_seconds % 3600) / 60)}m` : 'None set'}

## Recent 7 Days of Training
`;

  if (ctx.recentLogs.length === 0) {
    context += 'No sessions logged in the past 7 days.\n';
  } else {
    for (const log of ctx.recentLogs) {
      context += `- ${log.session.title} (${log.session.type}): ${log.actual_distance_km || '?'}km, ${log.avg_pace_min_km ? formatPace(log.avg_pace_min_km) + '/km' : '?'}, RPE ${log.rpe || '?'}/10${log.notes ? ` — "${log.notes}"` : ''}\n`;
    }
  }

  context += `\n## Upcoming 7 Days\n`;
  if (ctx.upcomingSessions.length === 0) {
    context += 'No sessions scheduled.\n';
  } else {
    for (const s of ctx.upcomingSessions) {
      context += `- ${dayNames[s.day_of_week] || '?'}: ${s.title} (${s.type}) — ${s.distance_km || '?'}km at ${s.target_pace_min_km ? formatPace(s.target_pace_min_km) + '/km' : '?'} [${s.status}] (id: ${s.id})\n`;
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
    max_tokens: 1024,
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

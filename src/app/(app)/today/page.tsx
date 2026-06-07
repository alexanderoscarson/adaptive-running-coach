'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isToday, parseISO, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Clock, Zap, Heart, AlertTriangle, Undo2, Info, Dumbbell, Play, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Session, PlanIntent, Constraint } from '@/types/database';

const SESSION_COLORS: Record<string, string> = {
  easy: 'bg-green-400',
  long: 'bg-purple-500',
  tempo: 'bg-orange-400',
  intervals: 'bg-red-500',
  hills: 'bg-amber-500',
  recovery: 'bg-emerald-300',
  strength: 'bg-blue-500',
  cross_training: 'bg-cyan-500',
  rest: 'bg-gray-300',
  race: 'bg-yellow-400',
};

const SESSION_ICONS: Record<string, React.ReactNode> = {
  easy: <Clock className="h-5 w-5 text-green-500" />,
  long: <Zap className="h-5 w-5 text-purple-500" />,
  tempo: <Zap className="h-5 w-5 text-orange-500" />,
  intervals: <Zap className="h-5 w-5 text-red-500" />,
  hills: <Zap className="h-5 w-5 text-amber-600" />,
  recovery: <Heart className="h-5 w-5 text-emerald-400" />,
  strength: <Dumbbell className="h-5 w-5 text-blue-500" />,
  rest: <Clock className="h-5 w-5 text-gray-400" />,
  race: <Zap className="h-5 w-5 text-yellow-500" />,
};

const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACTIVITY_LABELS: Record<string, string> = {
  tennis: 'Tennis', padel: 'Padel', cycling: 'Cycling', swimming: 'Swimming',
  hiking: 'Hiking', skiing: 'Skiing', climbing: 'Climbing',
  generic_cardio: 'Cardio', generic_strength: 'Gym',
};

const WORKOUT_EXPLAINERS: Record<string, { title: string; explanation: string; tips: string[] }> = {
  easy: {
    title: 'Why easy runs matter',
    explanation: 'Easy runs build your aerobic base without stressing your body. They improve fat burning, strengthen tendons and ligaments, and promote recovery between hard sessions. Most of your weekly mileage should be at this effort.',
    tips: ['Keep it conversational. If you can\'t talk in full sentences, slow down.', 'Don\'t chase pace. Go by feel and heart rate.', 'These runs should feel almost too easy.'],
  },
  long: {
    title: 'Why long runs matter',
    explanation: 'The long run is the cornerstone of endurance training. It teaches your body to burn fat efficiently, builds mental toughness, and prepares your muscles and joints for race distance. Fueling and hydration practice starts here.',
    tips: ['Start slower than you think. Negative split if possible.', 'Practice your race day nutrition on long runs.', 'Stay consistent. The long run builds over weeks.'],
  },
  tempo: {
    title: 'Why tempo runs matter',
    explanation: 'Tempo runs train your lactate threshold, the pace you can sustain for about an hour. Running at this "comfortably hard" effort teaches your body to clear lactate faster, making race pace feel easier over time.',
    tips: ['Aim for a pace you could hold for about 50 to 60 minutes in a race.', 'It should feel controlled but challenging. Not an all out effort.', 'Focus on even pacing throughout the tempo section.'],
  },
  intervals: {
    title: 'Why intervals matter',
    explanation: 'Interval training improves your VO2max, the maximum amount of oxygen your body can use. These hard repeats with recovery between them push your cardiovascular system to adapt and become more efficient at delivering oxygen to your muscles.',
    tips: ['Run the repeats at a consistent effort, not all out on the first one.', 'Use the recovery fully. Walk or jog, don\'t rush it.', 'Quality over quantity. If form breaks down, stop.'],
  },
  hills: {
    title: 'Why hill work matters',
    explanation: 'Hills build running-specific strength, improve your stride power, and boost VO2max with less impact stress than flat intervals. The uphill works your glutes and calves hard while the downhill trains eccentric strength.',
    tips: ['Lean slightly forward into the hill, don\'t hunch.', 'Shorten your stride going up, focus on cadence.', 'Controlled effort on the way down to protect your knees.'],
  },
  recovery: {
    title: 'Why recovery runs matter',
    explanation: 'Recovery runs increase blood flow to tired muscles without adding training stress. They help flush metabolic waste and promote adaptation from your harder sessions. The key is keeping the effort genuinely easy.',
    tips: ['Slower than your easy pace. This is the easiest run of the week.', 'If you feel tired, it\'s OK to walk sections.', 'Keep it short. The goal is movement, not mileage.'],
  },
  strength: {
    title: 'Why strength training matters',
    explanation: 'Strength work prevents injuries, improves running economy, and builds the muscular endurance needed for late race performance. Runner-specific strength focuses on single leg stability, hip strength, and core control.',
    tips: ['Focus on form over weight. Quality reps prevent injury.', 'Compound movements (squats, deadlifts, lunges) give the most return.', 'Schedule strength 2+ hours away from quality runs when possible.'],
  },
  race: {
    title: 'Race day',
    explanation: 'Trust your training. The hay is in the barn. Your job today is to execute the pacing strategy you\'ve practiced and enjoy the experience.',
    tips: ['Start conservatively. The first km should feel easy.', 'Stick to your nutrition plan. Nothing new on race day.', 'Smile at the crowds. It actually helps with perceived effort.'],
  },
};

function formatPace(pace: number | null) {
  if (!pace) return '--:--';
  const mins = Math.floor(pace);
  const secs = Math.round((pace - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function TodayPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [currentIntent, setCurrentIntent] = useState<PlanIntent | null>(null);
  const [adaptation, setAdaptation] = useState<{ message: string; auditId: string } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [rpe, setRpe] = useState([5]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(new Set());
  const [expandedExplainer, setExpandedExplainer] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
    if (!profile?.onboarding_completed) { router.push('/onboarding'); return; }
    setUserName(profile.full_name?.split(' ')[0] || '');

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [todayRes, weekRes, intentRes, constraintsRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id).eq('session_date', today).order('order_in_day'),
      supabase.from('sessions').select('*').eq('user_id', user.id).gte('session_date', weekStart).lte('session_date', weekEnd).order('session_date').order('order_in_day'),
      supabase.from('plan_intents').select('*').eq('user_id', user.id).eq('week_state', 'current').single(),
      supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
    ]);

    setSessions(todayRes.data || []);
    setWeekSessions(weekRes.data || []);
    setCurrentIntent(intentRes.data);
    setConstraints(constraintsRes.data || []);

    const adapted = (todayRes.data || []).find(s => s.adaptation_reason);
    if (adapted) setAdaptation({ message: adapted.adaptation_reason!, auditId: '' });

    setLoading(false);
  }

  async function markComplete(sessionId: string) {
    setFeedbackOpen(sessionId);
  }

  async function submitFeedback() {
    if (!feedbackOpen) return;
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: feedbackOpen, rpe: rpe[0], notes }),
    });
    setFeedbackOpen(null);
    setRpe([5]);
    setNotes('');
    loadData();
  }

  async function toggleSession(sessionId: string, currentStatus: string) {
    if (currentStatus === 'planned') {
      setFeedbackOpen(sessionId);
    } else {
      await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, status: 'planned' }),
      });
      loadData();
    }
  }

  async function skipSession(sessionId: string) {
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status: 'skipped' }),
    });
    loadData();
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  }

  // Build the week strip data (Mon–Sun)
  const weekStartDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const recurringConstraints = constraints.filter(c => c.type === 'recurring_activity');

  const weekStripDays = DAY_NAMES_SHORT.map((name, idx) => {
    const date = addDays(weekStartDate, idx);
    const dayValue = idx === 6 ? 0 : idx + 1; // Mon=1..Sat=6, Sun=0
    const daySessions = weekSessions.filter(s => s.day_of_week === dayValue);
    const dayConstraints = recurringConstraints.filter(c => c.day_of_week === dayValue);
    const isCurrentDay = isToday(date);

    // Collect color dots for sessions
    const dots: string[] = [];
    daySessions.forEach(s => dots.push(SESSION_COLORS[s.type] || SESSION_COLORS.easy));
    dayConstraints.forEach(() => dots.push('bg-pink-400'));

    const allCompleted = daySessions.length > 0 && daySessions.every(s => s.status === 'completed');

    return { name, date: format(date, 'd'), isCurrentDay, dots, allCompleted, hasSessions: daySessions.length > 0 || dayConstraints.length > 0 };
  });

  const completedThisWeek = weekSessions.filter(s => s.status === 'completed').length;
  const totalThisWeek = weekSessions.filter(s => s.type !== 'rest').length;
  const todayDate = format(new Date(), 'EEEE, MMMM d');
  const hasNoSessionToday = sessions.length === 0;

  // Build today's full activity list (sessions + constraints)
  const todayDayValue = new Date().getDay(); // 0=Sun
  const todayConstraints = recurringConstraints.filter(c => c.day_of_week === todayDayValue);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {currentIntent && (
            <p className="text-xs font-bold text-primary tracking-wide">
              WEEK {currentIntent.week_number}/{17} · {currentIntent.phase.toUpperCase()}
            </p>
          )}
          <h1 className="text-2xl font-extrabold mt-0.5">{todayDate}</h1>
        </div>
      </div>

      {/* Week strip — Runna style */}
      <Card className="overflow-hidden">
        <CardContent className="py-3 px-2">
          <div className="grid grid-cols-7 gap-0.5">
            {weekStripDays.map((day, idx) => (
              <div key={idx} className={cn(
                'flex flex-col items-center py-2 rounded-xl transition-all',
                day.isCurrentDay && 'bg-primary/10'
              )}>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">{day.name}</span>
                <span className={cn(
                  'text-sm font-extrabold mt-0.5',
                  day.isCurrentDay && 'text-primary'
                )}>
                  {day.date}
                </span>
                {/* Color dots */}
                <div className="flex gap-0.5 mt-1.5 min-h-[8px]">
                  {day.dots.map((color, i) => (
                    <div key={i} className={cn('w-2 h-2 rounded-full', color)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Adaptation banner */}
      {adaptation && (
        <Card className="border-amber-500/40 bg-amber-500/5">
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">Plan adapted</p>
              <p className="text-xs text-muted-foreground mt-0.5">{adaptation.message}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => router.push('/audit')}>Details</Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-2"><Undo2 className="h-3 w-3" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week overview card */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">This Week</h2>
            <span className="text-xs font-bold text-muted-foreground">{completedThisWeek}/{totalThisWeek} done</span>
          </div>

          {/* All week sessions + constraints as a checklist */}
          <div className="space-y-1">
            {weekStripDays.map((day, idx) => {
              const dayValue = idx === 6 ? 0 : idx + 1;
              const daySessions = weekSessions.filter(s => s.day_of_week === dayValue);
              const dayConstraints = recurringConstraints.filter(c => c.day_of_week === dayValue);

              if (daySessions.length === 0 && dayConstraints.length === 0) return null;

              return (
                <div key={idx}>
                  {daySessions.map(s => (
                    <div key={s.id} className={cn(
                      'flex items-center gap-3 py-2',
                      s.status === 'completed' && 'opacity-50'
                    )}>
                      <div className={cn('w-2.5 h-2.5 rounded-sm shrink-0', SESSION_COLORS[s.type] || SESSION_COLORS.easy)} />
                      <span className="text-xs font-bold w-8 text-muted-foreground">{day.name}</span>
                      <span className={cn('text-sm font-bold flex-1', s.status === 'completed' && 'line-through')}>
                        {s.title}
                        {s.distance_km ? <span className="font-normal text-muted-foreground"> · {s.distance_km}km</span> : null}
                      </span>
                      <button onClick={() => toggleSession(s.id, s.status)} className="shrink-0">
                        {s.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-primary/60 transition-colors" />
                        )}
                      </button>
                    </div>
                  ))}
                  {dayConstraints.map(c => {
                    const actKey = `${c.id}-${dayValue}`;
                    const isDone = completedActivities.has(actKey);
                    return (
                      <div key={c.id} className={cn('flex items-center gap-3 py-2', isDone && 'opacity-50')}>
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0 bg-pink-400" />
                        <span className="text-xs font-bold w-8 text-muted-foreground">{day.name}</span>
                        <span className={cn('text-sm font-bold flex-1 text-pink-600 dark:text-pink-400', isDone && 'line-through')}>
                          {ACTIVITY_LABELS[c.activity_type || ''] || c.activity_type || 'Activity'}
                        </span>
                        <button onClick={() => setCompletedActivities(prev => {
                          const next = new Set(prev);
                          if (next.has(actKey)) next.delete(actKey); else next.add(actKey);
                          return next;
                        })} className="shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="h-5 w-5 text-pink-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-pink-400/60 transition-colors" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Today's session(s) detail cards */}
      {hasNoSessionToday && todayConstraints.length === 0 ? (
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/20 flex items-center justify-center">
            <div className="text-4xl">😴</div>
          </div>
          <CardContent className="py-5 text-center">
            <h2 className="text-xl font-extrabold">{userName ? `Rest up, ${userName}` : 'Rest day'}</h2>
            <p className="text-sm text-muted-foreground mt-1">Recovery fuels success. Enjoy the gift of a rest day!</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {sessions.map(session => (
            <Card key={session.id} className={cn('overflow-hidden', session.status === 'completed' && 'opacity-60')}>
              {/* Session header with color bar */}
              <div className={cn('h-1.5', SESSION_COLORS[session.type] || SESSION_COLORS.easy)} />

              <CardContent className="py-4 px-5 space-y-3">
                <div className="flex items-center gap-3">
                  {SESSION_ICONS[session.type] || SESSION_ICONS.easy}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold">{session.title}</h3>
                    <div className="flex gap-2 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-xs font-bold">{session.type.toUpperCase()}</Badge>
                      {session.distance_km && <span className="text-xs font-bold text-muted-foreground">{session.distance_km}km</span>}
                      {session.target_pace_min_km && <span className="text-xs font-bold text-muted-foreground">{formatPace(session.target_pace_min_km)}/km</span>}
                      {session.duration_minutes && <span className="text-xs font-bold text-muted-foreground">{session.duration_minutes}min</span>}
                    </div>
                  </div>
                  {session.status === 'completed' && <CheckCircle2 className="h-7 w-7 text-primary" />}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{session.description}</p>

                {/* Expandable workout explainer */}
                {WORKOUT_EXPLAINERS[session.type] && (
                  <div>
                    <button
                      onClick={() => setExpandedExplainer(expandedExplainer === session.id ? null : session.id)}
                      className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors py-1"
                    >
                      <Lightbulb className="h-3.5 w-3.5" />
                      {expandedExplainer === session.id ? 'Hide info' : 'Why this workout?'}
                      {expandedExplainer === session.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                    {expandedExplainer === session.id && (
                      <div className="mt-2 rounded-xl bg-primary/5 border border-primary/10 p-4 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                        <h4 className="text-sm font-extrabold">{WORKOUT_EXPLAINERS[session.type].title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{WORKOUT_EXPLAINERS[session.type].explanation}</p>
                        <div className="space-y-1.5">
                          {WORKOUT_EXPLAINERS[session.type].tips.map((tip, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-primary text-xs font-extrabold mt-0.5">•</span>
                              <span className="text-xs font-semibold text-muted-foreground">{tip}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Workout structure blocks — Runna style */}
                {session.structure && (session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number; target_pace_min_km?: number }> }).blocks?.length > 0 && (
                  <div className="space-y-1.5">
                    {(session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number; target_pace_min_km?: number }> }).blocks.map((block, i) => (
                      <div key={i} className={cn(
                        'rounded-xl p-3 flex items-start gap-3',
                        block.type === 'warmup' ? 'bg-muted/60' :
                        block.type === 'interval' ? 'bg-accent/10 border border-accent/20' :
                        block.type === 'recovery' ? 'bg-muted/40' :
                        block.type === 'cooldown' ? 'bg-muted/60' :
                        'bg-primary/5 border border-primary/10'
                      )}>
                        <div className="w-7 h-7 rounded-lg bg-background flex items-center justify-center shrink-0">
                          <span className="text-xs font-extrabold">{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-0.5">
                            {block.type === 'warmup' ? 'Warm-Up' :
                             block.type === 'cooldown' ? 'Cool Down' :
                             block.type === 'interval' ? `Repeat x${block.repeats || 1}` :
                             block.type === 'recovery' ? 'Rest' : 'Main'}
                          </p>
                          <p className="text-sm font-bold">{block.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {session.status === 'planned' && (
                  <div className="flex gap-2 pt-1">
                    <Button size="lg" className="flex-1 h-12 rounded-xl font-bold text-base" onClick={() => markComplete(session.id)}>
                      <Play className="h-4 w-4 mr-2 fill-current" /> Complete Workout
                    </Button>
                    <Button variant="outline" size="lg" className="h-12 rounded-xl font-bold" onClick={() => skipSession(session.id)}>Skip</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Today's constraint activities */}
          {todayConstraints.map(c => {
            const actKey = `today-${c.id}`;
            const isDone = completedActivities.has(actKey);
            return (
            <Card key={c.id} className={cn('overflow-hidden', isDone && 'opacity-60')}>
              <div className="h-1.5 bg-pink-400" />
              <CardContent className="py-4 px-5 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-xl">
                  {c.activity_type === 'tennis' ? '🎾' :
                   c.activity_type === 'padel' ? '🏓' :
                   c.activity_type === 'cycling' ? '🚴' :
                   c.activity_type === 'swimming' ? '🏊' :
                   c.activity_type === 'hiking' ? '🥾' :
                   c.activity_type === 'generic_strength' ? '🏋️' : '💪'}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold">{ACTIVITY_LABELS[c.activity_type || ''] || 'Activity'}</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Scheduled activity</p>
                </div>
                <button onClick={() => setCompletedActivities(prev => {
                  const next = new Set(prev);
                  if (next.has(actKey)) next.delete(actKey); else next.add(actKey);
                  return next;
                })}>
                  {isDone ? (
                    <CheckCircle2 className="h-6 w-6 text-pink-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground/30 hover:text-pink-400/60 transition-colors" />
                  )}
                </button>
              </CardContent>
            </Card>
            );
          })}
        </>
      )}

      {/* RPE Feedback Dialog */}
      <Dialog open={!!feedbackOpen} onOpenChange={() => setFeedbackOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold">How did it go?</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div>
              <label className="text-sm font-bold mb-3 block">Effort (RPE): <span className="text-primary text-lg">{rpe[0]}</span>/10</label>
              <Slider value={rpe} onValueChange={(val) => setRpe(Array.isArray(val) ? val : [val])} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs font-bold text-muted-foreground mt-2">
                <span>Very easy</span><span>Maximal</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-bold mb-2 block">Notes <span className="font-normal text-muted-foreground">(optional)</span></label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Any niggles?" rows={3} className="rounded-xl" />
            </div>
            <Button className="w-full h-11 rounded-xl font-bold" onClick={submitFeedback}>Save feedback</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

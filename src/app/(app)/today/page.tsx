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
import { CheckCircle2, Circle, Clock, Zap, Heart, AlertTriangle, Undo2, Info, Dumbbell, Play } from 'lucide-react';
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
                  {dayConstraints.map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-2">
                      <div className="w-2.5 h-2.5 rounded-sm shrink-0 bg-pink-400" />
                      <span className="text-xs font-bold w-8 text-muted-foreground">{day.name}</span>
                      <span className="text-sm font-bold flex-1 text-pink-600 dark:text-pink-400">
                        {ACTIVITY_LABELS[c.activity_type || ''] || c.activity_type || 'Activity'}
                      </span>
                    </div>
                  ))}
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

                {/* Workout structure blocks — Runna style */}
                {session.structure && (session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number; target_pace_min_km?: number }> }).blocks?.length > 0 && (
                  <div className="space-y-1.5">
                    {(session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number; target_pace_min_km?: number }> }).blocks.map((block, i) => (
                      <div key={i} className={cn(
                        'rounded-xl p-3 flex items-start gap-3',
                        block.type === 'warmup' ? 'bg-muted/60' :
                        block.type === 'interval' ? 'bg-orange-500/10 border border-orange-400/20' :
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
          {todayConstraints.map(c => (
            <Card key={c.id} className="overflow-hidden">
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
                <div>
                  <h3 className="text-lg font-extrabold">{ACTIVITY_LABELS[c.activity_type || ''] || 'Activity'}</h3>
                  <p className="text-xs text-muted-foreground font-medium">Scheduled activity · Plan adjusted around this</p>
                </div>
              </CardContent>
            </Card>
          ))}
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

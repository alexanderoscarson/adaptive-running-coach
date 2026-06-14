'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays, differenceInCalendarWeeks } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Circle, Plane, Target, GripVertical, X, Bot, Clock, Zap, Dumbbell, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { PlanIntent, Session, Goal, Constraint, LifeActivity, UserRace } from '@/types/database';
import { RACES, SPORT_EMOJI } from '@/lib/races';

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
  constraint_activity: 'bg-pink-400',
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

const PHASE_COLORS: Record<string, string> = {
  base: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40',
  build: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40',
  peak: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40',
  taper: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40',
  race: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEK_DAYS_ORDERED = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

const ACTIVITY_LABELS: Record<string, string> = {
  tennis: 'Tennis', padel: 'Padel', cycling: 'Cycling', swimming: 'Swimming',
  hiking: 'Hiking', skiing: 'Skiing', climbing: 'Climbing',
  generic_cardio: 'Cardio', generic_strength: 'Gym',
};

const EFFORT_LABELS: Record<number, string> = {
  1: 'Very easy', 2: 'Easy', 3: 'Moderate', 4: 'Hard', 5: 'Very hard',
};

function formatPace(pace: number | null) {
  if (!pace) return '--:--';
  const totalSeconds = Math.round(pace * 60);
  const rounded = Math.round(totalSeconds / 5) * 5;
  const mins = Math.floor(rounded / 60);
  const secs = rounded % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function PlanPage() {
  const [intents, setIntents] = useState<PlanIntent[]>([]);
  const [sessions, setSessions] = useState<Record<number, Session[]>>({});
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [lifeActivities, setLifeActivities] = useState<LifeActivity[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [raceName, setRaceName] = useState<string>('');
  const [planExplanation, setPlanExplanation] = useState<string>('');
  const [storedRaceName, setStoredRaceName] = useState<string>('');
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dragOverDay, setDragOverDay] = useState<{ week: number; day: number } | null>(null);
  const [detailSession, setDetailSession] = useState<Session | null>(null);
  const [detailConstraint, setDetailConstraint] = useState<LifeActivity | Constraint | null>(null);
  const [detailDay, setDetailDay] = useState<{ dayName: string; date: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const dragSessionRef = useRef<{ session: Session; weekNumber: number } | null>(null);
  const dragActivityRef = useRef<{ activity: LifeActivity | Constraint; dayOfWeek: number; weekNumber: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [intentsRes, goalRes, constraintsRes, lifeActivitiesRes, userRacesRes, explanationRes] = await Promise.all([
      supabase.from('plan_intents').select('*').eq('user_id', user.id).order('week_number'),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
      supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('life_activities').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true).limit(1),
      supabase.from('coach_messages').select('content, action_data').eq('user_id', user.id).eq('role', 'assistant').order('created_at', { ascending: false }).limit(20),
    ]);

    setIntents(intentsRes.data || []);
    setGoal(goalRes.data);
    setConstraints(constraintsRes.data || []);
    setLifeActivities(lifeActivitiesRes.data || []);

    // Resolve race name: custom_name → library lookup → inactive user_races fallback
    const ur = userRacesRes.data?.[0] as UserRace | undefined;
    if (ur?.custom_name) {
      setRaceName(ur.custom_name);
    } else if (ur?.race_id) {
      const libRace = RACES.find(r => r.id === ur.race_id);
      if (libRace) setRaceName(libRace.name);
    }
    // If still no name from active user_races, try inactive ones (may have been deactivated by onboarding retry)
    if (!ur?.custom_name && !(ur?.race_id && RACES.find(r => r.id === ur.race_id))) {
      const { data: anyRaces } = await supabase
        .from('user_races')
        .select('custom_name, race_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const fallbackRace = anyRaces?.[0];
      if (fallbackRace?.custom_name) {
        setRaceName(fallbackRace.custom_name);
      } else if (fallbackRace?.race_id) {
        const libRace = RACES.find(r => r.id === fallbackRace.race_id);
        if (libRace) setRaceName(libRace.name);
      }
    }

    // Find plan explanation from coach messages
    const explanationMsg = (explanationRes.data || []).find(
      (m: { action_data: Record<string, unknown> | null }) => (m.action_data as Record<string, unknown>)?.type === 'plan_explanation'
    );
    if (explanationMsg) {
      setPlanExplanation(explanationMsg.content);
      const savedName = (explanationMsg.action_data as Record<string, unknown>)?.race_name;
      if (savedName && typeof savedName === 'string') setStoredRaceName(savedName);
    }

    const currentWeek = (intentsRes.data || []).find(i => i.week_state === 'current');
    if (currentWeek) {
      setExpandedWeek(currentWeek.week_number);
    }
    // Preload all sessions so week overview labels work
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('session_date')
      .order('order_in_day');
    if (allSessions) {
      const grouped: Record<number, Session[]> = {};
      for (const s of allSessions) {
        if (!grouped[s.week_number]) grouped[s.week_number] = [];
        grouped[s.week_number].push(s);
      }
      setSessions(grouped);
    }
    setLoading(false);
  }

  async function loadWeekSessions(userId: string, weekNumber: number) {
    const { data } = await supabase.from('sessions').select('*').eq('user_id', userId).eq('week_number', weekNumber).order('session_date').order('order_in_day');
    setSessions(prev => ({ ...prev, [weekNumber]: data || [] }));
  }

  async function toggleWeek(weekNumber: number) {
    if (expandedWeek === weekNumber) { setExpandedWeek(null); return; }
    setExpandedWeek(weekNumber);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !sessions[weekNumber]) loadWeekSessions(user.id, weekNumber);
  }

  async function toggleSessionComplete(sessionId: string, currentStatus: string) {
    const newStatus = currentStatus === 'completed' ? 'planned' : 'completed';
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status: newStatus }),
    });
    setSessions(prev => {
      const updated = { ...prev };
      for (const week in updated) {
        updated[week] = updated[week].map(s =>
          s.id === sessionId ? { ...s, status: newStatus } : s
        );
      }
      return updated;
    });
  }

  async function deleteSession(sessionId: string) {
    const res = await fetch('/api/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      setSessions(prev => {
        const updated = { ...prev };
        for (const week in updated) {
          updated[week] = updated[week].filter(s => s.id !== sessionId);
        }
        return updated;
      });
      toast.success('Session removed');
    } else {
      toast.error('Failed to remove session');
    }
    setDeleteConfirm(null);
  }

  // --- Drag and Drop (all session types + life activities) ---
  function handleDragStart(e: React.DragEvent, session: Session, weekNumber: number) {
    dragSessionRef.current = { session, weekNumber };
    dragActivityRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', session.id);
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }

  function handleActivityDragStart(e: React.DragEvent, activity: LifeActivity | Constraint, dayOfWeek: number, weekNumber: number) {
    dragActivityRef.current = { activity, dayOfWeek, weekNumber };
    dragSessionRef.current = null;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'activity');
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragOverDay(null);
    dragSessionRef.current = null;
    dragActivityRef.current = null;
  }

  function handleDragOver(e: React.DragEvent, weekNumber: number, dayOfWeek: number) {
    e.preventDefault();
    // Life activities can always be dropped on any day
    if (dragActivityRef.current) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverDay({ week: weekNumber, day: dayOfWeek });
      return;
    }
    const weekSessions = sessions[weekNumber] || [];
    const sessionsOnDay = weekSessions.filter(s => s.day_of_week === dayOfWeek);
    const draggedId = dragSessionRef.current?.session.id;
    const countExcludingSelf = sessionsOnDay.filter(s => s.id !== draggedId).length;
    if (countExcludingSelf >= 2) {
      e.dataTransfer.dropEffect = 'none';
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDragOverDay({ week: weekNumber, day: dayOfWeek });
  }

  function handleDragLeave() {
    setDragOverDay(null);
  }

  async function handleDrop(e: React.DragEvent, weekNumber: number, dayOfWeek: number) {
    e.preventDefault();
    setDragOverDay(null);

    // Handle life activity drop
    if (dragActivityRef.current) {
      const actData = dragActivityRef.current;
      dragActivityRef.current = null;
      if (actData.dayOfWeek === dayOfWeek) return;

      const oldDay = actData.dayOfWeek;
      const dayKeyMap: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
      const newDayKey = dayKeyMap[dayOfWeek];
      const oldDayKey = dayKeyMap[oldDay];
      const activity = actData.activity;

      // Determine if it's a Constraint or LifeActivity and update accordingly
      if ('day_of_week' in activity && 'type' in activity && (activity as Constraint).type === 'recurring_activity') {
        // It's a Constraint — update via PATCH
        const res = await fetch('/api/constraints', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ constraintId: (activity as Constraint).id, day_of_week: dayOfWeek }),
        });
        if (res.ok) {
          setConstraints(prev => prev.map(c => c.id === (activity as Constraint).id ? { ...c, day_of_week: dayOfWeek } : c));
          toast.success(`Activity moved to ${DAY_NAMES[dayOfWeek]}`, { duration: 5000 });
        } else {
          toast.error('Failed to move activity');
        }
      } else {
        // It's a LifeActivity — update days array in details
        const la = activity as LifeActivity;
        const days = ((la.details as Record<string, unknown>)?.days as string[]) || [];
        const newDays = days.map(d => d === oldDayKey ? newDayKey : d);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('life_activities').update({ details: { ...la.details as object, days: newDays } }).eq('id', la.id).eq('user_id', user.id);
          setLifeActivities(prev => prev.map(l => l.id === la.id ? { ...l, details: { ...l.details as object, days: newDays } } : l));
          toast.success(`Activity moved to ${DAY_NAMES[dayOfWeek]}`, { duration: 5000 });
        }
      }
      return;
    }

    // Handle session drop
    const dragData = dragSessionRef.current;
    if (!dragData || dragData.weekNumber !== weekNumber) return;
    const session = dragData.session;
    if (session.day_of_week === dayOfWeek) return;

    const weekSessions = sessions[weekNumber] || [];
    const sessionsOnDay = weekSessions.filter(s => s.day_of_week === dayOfWeek && s.id !== session.id);
    if (sessionsOnDay.length >= 2) return;

    const oldDay = session.day_of_week;
    const oldDate = session.session_date;
    const intent = intents.find(i => i.week_number === weekNumber);
    if (!intent) return;
    const weekStart = parseISO(intent.starts_on);
    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const newDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');

    setSessions(prev => {
      const updated = { ...prev };
      updated[weekNumber] = (updated[weekNumber] || []).map(s =>
        s.id === session.id ? { ...s, day_of_week: dayOfWeek, session_date: newDate } : s
      );
      return updated;
    });

    const res = await fetch('/api/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: session.id, newDayOfWeek: dayOfWeek, newSessionDate: newDate }),
    });

    if (!res.ok) {
      setSessions(prev => {
        const updated = { ...prev };
        updated[weekNumber] = (updated[weekNumber] || []).map(s =>
          s.id === session.id ? { ...s, day_of_week: oldDay, session_date: oldDate } : s
        );
        return updated;
      });
      toast.error('Failed to move session');
      return;
    }

    toast.success(`Session moved to ${DAY_NAMES[dayOfWeek]}`, {
      action: {
        label: 'Undo',
        onClick: async () => {
          setSessions(prev => {
            const updated = { ...prev };
            updated[weekNumber] = (updated[weekNumber] || []).map(s =>
              s.id === session.id ? { ...s, day_of_week: oldDay, session_date: oldDate } : s
            );
            return updated;
          });
          await fetch('/api/sessions', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId: session.id, newDayOfWeek: oldDay, newSessionDate: oldDate }),
          });
        },
      },
      duration: 5000,
    });
  }

  function getLifeActivityForDay(dayOfWeek: number) {
    const dayKeyMap: Record<number, string> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };
    const dayKey = dayKeyMap[dayOfWeek];
    for (const la of lifeActivities) {
      if (!la.active) continue;
      if (la.activity_type !== 'gym' && la.activity_type !== 'team_sport') continue;
      const days = (la.details as Record<string, unknown>)?.days;
      if (Array.isArray(days) && days.includes(dayKey)) return la;
    }
    return constraints.find(c => c.type === 'recurring_activity' && c.day_of_week === dayOfWeek) || null;
  }

  function openSessionDetail(session: Session, weekNumber: number) {
    const intent = intents.find(i => i.week_number === weekNumber);
    setDetailSession(session);
    setDetailConstraint(null);
    setDetailDay({
      dayName: DAY_NAMES[session.day_of_week],
      date: session.session_date ? format(parseISO(session.session_date), 'EEEE, d MMM yyyy') : '',
    });
  }

  function openActivityDetail(activity: LifeActivity | Constraint, dayOfWeek: number, weekNumber: number) {
    const intent = intents.find(i => i.week_number === weekNumber);
    const weekStart = intent ? parseISO(intent.starts_on) : new Date();
    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const actDate = addDays(weekStart, dayOffset);
    setDetailSession(null);
    setDetailConstraint(activity);
    setDetailDay({
      dayName: DAY_NAMES[dayOfWeek],
      date: format(actDate, 'EEEE, d MMM yyyy'),
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading plan…</div></div>;
  }

  // Fix 2: Weeks until race — computed dynamically from goal.race_date
  const weeksUntilRace = (() => {
    if (!goal?.race_date) return null;
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const raceDate = new Date(goal.race_date);
    const diff = raceDate.getTime() - todayMidnight.getTime();
    if (diff <= 0) return 0;
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
  })();

  // Use the resolved race name; never fall back to distance enum labels like "Marathon"
  const displayRaceName = raceName || 'your race';

  // Dynamically replace the stored race name in the coach explanation with the current one
  const dynamicExplanation = (() => {
    if (!planExplanation) return '';
    if (storedRaceName && displayRaceName && storedRaceName !== displayRaceName) {
      return planExplanation.replace(storedRaceName, displayRaceName);
    }
    return planExplanation.replace(
      /training plan for [^.]+\./,
      `training plan for ${displayRaceName}.`
    );
  })();
  const raceDate = goal?.race_date ? format(parseISO(goal.race_date), 'dd MMM yyyy').toUpperCase() : null;
  const totalWeeks = intents.length;
  const completedWeeks = intents.filter(i => i.week_state === 'completed').length;
  const totalDistance = intents.reduce((sum, i) => sum + Number(i.total_distance_km), 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5 pb-8">
      {/* Dynamic race name title — uses resolved name, never distance enum */}
      <h1 className="text-2xl font-bold text-center font-display">
        {`Plan for ${displayRaceName}`}
      </h1>

      {/* Fix 3: Coach explanation card */}
      {dynamicExplanation && (
        <Card className="bg-gradient-to-br from-primary/10 to-purple-500/5 border-primary/20">
          <CardContent className="py-4 px-5">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary mb-1 font-display">Your Coach</p>
                <p className="text-sm text-foreground leading-relaxed">{dynamicExplanation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal banner */}
      {goal && (
        <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
          <CardContent className="py-5 px-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-extrabold text-xl capitalize font-display">{displayRaceName}</h2>
                {raceDate && <p className="text-sm text-muted-foreground mt-0.5">Race day: <span className="font-semibold text-foreground">{raceDate}</span></p>}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-primary" />
              </div>
            </div>

            <div className="flex gap-1 mt-4">
              {intents.map(i => (
                <div key={i.id} className={cn(
                  'flex-1 h-1.5 rounded-full',
                  i.week_state === 'completed' ? 'bg-primary' : 'bg-primary/20'
                )} />
              ))}
            </div>

            {/* Fix 2: Show weeks until race + total weeks */}
            <div className="flex justify-between mt-3">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Progress</p>
                <p className="text-xl font-extrabold">{completedWeeks}/{totalWeeks} <span className="text-sm font-semibold text-muted-foreground">weeks</span></p>
              </div>
              {weeksUntilRace !== null && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-semibold">Until Race</p>
                  <p className="text-xl font-extrabold">{weeksUntilRace} <span className="text-sm font-semibold text-muted-foreground">weeks</span></p>
                </div>
              )}
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-semibold">Total Distance</p>
                <p className="text-xl font-extrabold">{Math.round(totalDistance)} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Week cards */}
      <ScrollArea className="flex-1">
        <div className="space-y-3">
          {intents.map(intent => {
            const isExpanded = expandedWeek === intent.week_number;
            const isVacation = intent.week_state === 'vacation';
            const isCurrent = intent.week_state === 'current';
            const weekSessions = sessions[intent.week_number] || [];
            const weekStart = format(parseISO(intent.starts_on), 'd MMM').toUpperCase();
            const weekEndDate = new Date(intent.starts_on);
            weekEndDate.setDate(weekEndDate.getDate() + 6);
            const weekEnd = format(weekEndDate, 'd MMM').toUpperCase();

            return (
              <Card
                key={intent.id}
                className={cn(
                  'transition-all overflow-hidden',
                  isCurrent && 'border-primary/40 shadow-sm',
                  isVacation && 'border-dashed border-sky-300',
                  intent.week_state === 'completed' && 'opacity-70'
                )}
              >
                <button onClick={() => toggleWeek(intent.week_number)} className="w-full text-left">
                  <CardContent className="py-4 px-5">
                    <p className="text-xs font-bold text-primary tracking-wide">{weekStart} - {weekEnd}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <h3 className="text-lg font-extrabold font-display">Week {intent.week_number}</h3>
                      <Badge variant="secondary" className={cn('text-[10px] font-bold px-2 py-0', PHASE_COLORS[intent.phase])}>
                        {intent.phase.toUpperCase()}
                      </Badge>
                      {intent.is_recovery && <Badge variant="outline" className="text-[10px] font-bold px-2 py-0">RECOVERY</Badge>}
                      {isVacation && <Plane className="h-4 w-4 text-sky-500" />}
                    </div>

                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{intent.total_distance_km}</span>km
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{intent.quality_sessions}</span> quality
                      </p>
                    </div>

                    {/* Session type labels per week */}
                    {(sessions[intent.week_number] || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {(sessions[intent.week_number] || [])
                          .filter(s => ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'].includes(s.type))
                          .sort((a, b) => a.day_of_week - b.day_of_week)
                          .map(s => (
                            <span key={s.id} className={cn(
                              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold',
                              s.type === 'easy' && 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                              s.type === 'long' && 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
                              s.type === 'tempo' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                              s.type === 'intervals' && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
                              s.type === 'hills' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
                              s.type === 'recovery' && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
                              s.type === 'race' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                            )}>
                              <span className={cn('w-1.5 h-1.5 rounded-full', SESSION_COLORS[s.type])} />
                              {DAY_NAMES[s.day_of_week]}: {s.type === 'easy' ? 'Easy Run' : s.type === 'long' ? 'Long Run' : s.type === 'tempo' ? 'Tempo' : s.type === 'intervals' ? 'Intervals' : s.type === 'hills' ? 'Hills' : s.type === 'recovery' ? 'Recovery' : s.type === 'race' ? 'Race' : s.title}
                            </span>
                          ))}
                      </div>
                    )}
                  </CardContent>
                </button>

                {/* Expanded: day-column layout */}
                {isExpanded && (
                  <div className="px-5 pb-4">
                    {weekSessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Loading sessions…</p>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS_ORDERED.map(dayOfWeek => {
                          const daySessions = weekSessions.filter(s => s.day_of_week === dayOfWeek);
                          const lifeActivity = getLifeActivityForDay(dayOfWeek);
                          const isDragOver = dragOverDay?.week === intent.week_number && dragOverDay?.day === dayOfWeek;
                          const draggedId = dragSessionRef.current?.session.id;
                          const isFull = daySessions.filter(s => s.id !== draggedId).length >= 2;

                          return (
                            <div
                              key={dayOfWeek}
                              className={cn(
                                'rounded-lg p-1 min-h-[80px] transition-colors border border-transparent',
                                isDragOver && !isFull && 'border-primary/50 bg-primary/5',
                                isDragOver && isFull && 'border-destructive/50 bg-destructive/5',
                              )}
                              onDragOver={(e) => handleDragOver(e, intent.week_number, dayOfWeek)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, intent.week_number, dayOfWeek)}
                            >
                              <p className="text-[10px] font-bold text-muted-foreground text-center mb-1">{DAY_NAMES[dayOfWeek]}</p>

                              {isFull && isDragOver && (
                                <p className="text-[8px] text-destructive text-center font-semibold">Full</p>
                              )}

                              {/* Fix 4+5: All sessions are tappable, draggable, deletable */}
                              {daySessions.map(session => (
                                <div
                                  key={session.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, session, intent.week_number)}
                                  onDragEnd={handleDragEnd}
                                  className={cn(
                                    'rounded-md p-1.5 mb-1 cursor-grab active:cursor-grabbing transition-opacity group relative',
                                    session.status === 'completed' ? 'opacity-60' : '',
                                    'bg-card border shadow-sm hover:shadow-md'
                                  )}
                                >
                                  {/* Delete button */}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(session.id); }}
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>

                                  <div
                                    className="flex items-start gap-1 cursor-pointer"
                                    onClick={() => openSessionDetail(session, intent.week_number)}
                                  >
                                    <div className={cn('w-2 h-2 rounded-sm shrink-0 mt-0.5', SESSION_COLORS[session.type] || SESSION_COLORS.easy)} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold leading-tight truncate">{session.title}</p>
                                      {session.distance_km ? (
                                        <p className="text-[9px] text-muted-foreground">{session.distance_km}km</p>
                                      ) : session.duration_minutes ? (
                                        <p className="text-[9px] text-muted-foreground">{session.duration_minutes}m</p>
                                      ) : null}
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleSessionComplete(session.id, session.status); }}
                                      className="shrink-0"
                                    >
                                      {session.status === 'completed' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                      ) : (
                                        <Circle className="h-3.5 w-3.5 text-muted-foreground/30 hover:text-primary/60 transition-colors" />
                                      )}
                                    </button>
                                  </div>
                                  <GripVertical className="h-3 w-3 text-muted-foreground/20 mx-auto mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              ))}

                              {/* Life activity / constraint card — tappable + draggable */}
                              {lifeActivity && (
                                <div
                                  draggable
                                  onDragStart={(e) => handleActivityDragStart(e, lifeActivity, dayOfWeek, intent.week_number)}
                                  onDragEnd={handleDragEnd}
                                  className="rounded-md p-1.5 mb-1 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/40 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group"
                                  onClick={() => openActivityDetail(lifeActivity, dayOfWeek, intent.week_number)}
                                >
                                  <div className="flex items-center gap-1">
                                    <div className={cn('w-2 h-2 rounded-sm shrink-0', SESSION_COLORS.constraint_activity)} />
                                    <p className="text-[10px] font-bold leading-tight truncate">
                                      {'sport_name' in lifeActivity
                                        ? ((lifeActivity as LifeActivity).sport_name || ACTIVITY_LABELS[(lifeActivity as LifeActivity).activity_type || ''] || 'Activity')
                                        : ACTIVITY_LABELS[(lifeActivity as Constraint).activity_type || ''] || 'Activity'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Rest day indicator */}
                              {daySessions.length === 0 && !lifeActivity && (
                                <div
                                  className="flex items-center justify-center h-10 text-muted-foreground/20 cursor-pointer hover:text-muted-foreground/40 transition-colors"
                                  onClick={() => {
                                    const intent2 = intents.find(i => i.week_number === intent.week_number);
                                    const ws = intent2 ? parseISO(intent2.starts_on) : new Date();
                                    const dOff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                                    setDetailSession(null);
                                    setDetailConstraint(null);
                                    setDetailDay({
                                      dayName: DAY_NAMES[dayOfWeek],
                                      date: format(addDays(ws, dOff), 'EEEE, d MMM yyyy'),
                                    });
                                  }}
                                >
                                  <p className="text-[9px]">Rest</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      {/* Fix 4: Session detail modal */}
      <Dialog open={!!detailSession || !!detailConstraint || (!!detailDay && !detailSession && !detailConstraint)} onOpenChange={() => { setDetailSession(null); setDetailConstraint(null); setDetailDay(null); }}>
        <DialogContent className="max-w-md">
          {detailSession && detailDay && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  {SESSION_ICONS[detailSession.type] || SESSION_ICONS.easy}
                  <div>
                    <DialogTitle className="text-lg font-extrabold font-display">{detailSession.title}</DialogTitle>
                    <p className="text-xs text-muted-foreground">{detailDay.date}</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs font-bold">{detailSession.type.toUpperCase()}</Badge>
                  {detailSession.distance_km && <Badge variant="outline" className="text-xs">{detailSession.distance_km}km</Badge>}
                  {detailSession.target_pace_min_km && <Badge variant="outline" className="text-xs">{formatPace(detailSession.target_pace_min_km)}/km</Badge>}
                  {detailSession.target_hr_zone && <Badge variant="outline" className="text-xs">Zone {detailSession.target_hr_zone} — {EFFORT_LABELS[detailSession.target_hr_zone] || ''}</Badge>}
                  {detailSession.duration_minutes && <Badge variant="outline" className="text-xs">{detailSession.duration_minutes} min</Badge>}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{detailSession.description}</p>

                {detailSession.structure && (detailSession.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number }> }).blocks?.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Workout Structure</p>
                    {(detailSession.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number }> }).blocks.map((block, i) => (
                      <div key={i} className={cn(
                        'rounded-xl p-3 flex items-start gap-3',
                        block.type === 'warmup' || block.type === 'cooldown' ? 'bg-muted/60' :
                        block.type === 'interval' ? 'bg-accent/10 border border-accent/20' :
                        'bg-primary/5 border border-primary/10'
                      )}>
                        <div className="w-6 h-6 rounded-lg bg-background flex items-center justify-center shrink-0">
                          <span className="text-xs font-extrabold">{i + 1}</span>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {block.type === 'warmup' ? 'Warm-Up' : block.type === 'cooldown' ? 'Cool Down' : block.type === 'interval' ? `Repeat x${block.repeats || 1}` : 'Main'}
                          </p>
                          <p className="text-sm font-semibold">{block.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {detailConstraint && detailDay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold font-display">
                  {('sport_name' in detailConstraint && (detailConstraint as LifeActivity).sport_name)
                    || ACTIVITY_LABELS[('activity_type' in detailConstraint ? (detailConstraint as LifeActivity).activity_type : '') || '']
                    || 'Activity'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{detailDay.date}</p>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Badge className="bg-pink-500 text-xs">Scheduled Activity</Badge>
                <p className="text-sm text-muted-foreground">This is a recurring activity from your schedule. Your training plan is structured to avoid placing hard runs on or next to this day.</p>
                {'activity_type' in detailConstraint && (detailConstraint as LifeActivity).activity_type === 'team_sport' && (
                  <p className="text-sm text-muted-foreground">Focus on having fun and staying loose. Keep hydrated and warm up properly.</p>
                )}
                {'activity_type' in detailConstraint && (detailConstraint as LifeActivity).activity_type === 'gym' && (
                  <p className="text-sm text-muted-foreground">Focus on compound movements and core stability. Keep the session moderate to complement your running.</p>
                )}
              </div>
            </>
          )}

          {!detailSession && !detailConstraint && detailDay && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-extrabold font-display">Rest Day</DialogTitle>
                <p className="text-xs text-muted-foreground">{detailDay.date}</p>
              </DialogHeader>
              <div className="pt-2">
                <p className="text-sm text-muted-foreground">No sessions scheduled. Recovery is just as important as training — your body adapts and gets stronger during rest.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">Remove this session?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will permanently remove the session from your plan.</p>
          <div className="flex gap-2 pt-2">
            <Button variant="destructive" className="flex-1" onClick={() => deleteConfirm && deleteSession(deleteConfirm)}>Remove</Button>
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Plane, RefreshCw, Target, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanIntent, Session, Goal, Constraint } from '@/types/database';

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

const PHASE_COLORS: Record<string, string> = {
  base: 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/40',
  build: 'text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-900/40',
  peak: 'text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-900/40',
  taper: 'text-purple-700 bg-purple-100 dark:text-purple-300 dark:bg-purple-900/40',
  race: 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ACTIVITY_LABELS: Record<string, string> = {
  tennis: 'Tennis', padel: 'Padel', cycling: 'Cycling', swimming: 'Swimming',
  hiking: 'Hiking', skiing: 'Skiing', climbing: 'Climbing',
  generic_cardio: 'Cardio', generic_strength: 'Gym',
};

export default function PlanPage() {
  const [intents, setIntents] = useState<PlanIntent[]>([]);
  const [sessions, setSessions] = useState<Record<number, Session[]>>({});
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [intentsRes, goalRes, constraintsRes] = await Promise.all([
      supabase.from('plan_intents').select('*').eq('user_id', user.id).order('week_number'),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).single(),
      supabase.from('constraints').select('*').eq('user_id', user.id).eq('active', true),
    ]);

    setIntents(intentsRes.data || []);
    setGoal(goalRes.data);
    setConstraints(constraintsRes.data || []);

    const currentWeek = (intentsRes.data || []).find(i => i.week_state === 'current');
    if (currentWeek) {
      setExpandedWeek(currentWeek.week_number);
      loadWeekSessions(user.id, currentWeek.week_number);
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
    // Update local state
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

  // Merge constraint activities into a week's sessions for display
  function getWeekDisplay(weekSessions: Session[]) {
    const recurringConstraints = constraints.filter(c => c.type === 'recurring_activity');
    const displayItems: Array<{
      id: string;
      day: number;
      dayName: string;
      title: string;
      subtitle: string;
      color: string;
      isSession: boolean;
      status: string;
      sessionId?: string;
    }> = [];

    // Add running/strength sessions
    for (const s of weekSessions) {
      displayItems.push({
        id: s.id,
        day: s.day_of_week,
        dayName: DAY_NAMES[s.day_of_week] || '?',
        title: s.title,
        subtitle: s.distance_km ? `${s.distance_km}km` : s.duration_minutes ? `${s.duration_minutes}m` : '',
        color: SESSION_COLORS[s.type] || SESSION_COLORS.easy,
        isSession: true,
        status: s.status,
        sessionId: s.id,
      });
    }

    // Add constraint activities (tennis, padel, etc.)
    for (const c of recurringConstraints) {
      if (c.day_of_week == null) continue;
      // Don't duplicate if there's already a cross_training session on that day
      const alreadyHas = displayItems.some(d => d.day === c.day_of_week && !d.isSession);
      if (alreadyHas) continue;
      displayItems.push({
        id: `constraint-${c.id}`,
        day: c.day_of_week,
        dayName: DAY_NAMES[c.day_of_week] || '?',
        title: ACTIVITY_LABELS[c.activity_type || ''] || c.activity_type || 'Activity',
        subtitle: '',
        color: SESSION_COLORS.constraint_activity,
        isSession: false,
        status: 'planned',
      });
    }

    // Sort by day
    displayItems.sort((a, b) => {
      const dayA = a.day === 0 ? 7 : a.day;
      const dayB = b.day === 0 ? 7 : b.day;
      return dayA - dayB;
    });

    return displayItems;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading plan…</div></div>;
  }

  const distanceName = goal?.race_distance?.replace('_', ' ') || 'training';
  const raceDate = goal?.race_date ? format(parseISO(goal.race_date), 'dd MMM yyyy').toUpperCase() : null;
  const totalWeeks = intents.length;
  const completedWeeks = intents.filter(i => i.week_state === 'completed').length;
  const totalDistance = intents.reduce((sum, i) => sum + Number(i.total_distance_km), 0);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-5 pb-8">
      <h1 className="text-2xl font-bold text-center">Your Plan</h1>

      {/* Goal banner — Runna style */}
      {goal && (
        <Card className="bg-gradient-to-br from-primary/15 to-primary/5 border-primary/20">
          <CardContent className="py-5 px-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-extrabold text-xl capitalize">{distanceName} Plan</h2>
                {raceDate && <p className="text-sm text-muted-foreground mt-0.5">Your race: <span className="font-semibold text-foreground">{raceDate}</span></p>}
              </div>
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Target className="h-7 w-7 text-primary" />
              </div>
            </div>

            {/* Week dots */}
            <div className="flex gap-1 mt-4">
              {intents.map(i => (
                <div key={i.id} className={cn(
                  'flex-1 h-1.5 rounded-full',
                  i.week_state === 'completed' ? 'bg-primary' : 'bg-primary/20'
                )} />
              ))}
            </div>

            <div className="flex justify-between mt-3">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Total Weeks</p>
                <p className="text-xl font-extrabold">{completedWeeks}/{totalWeeks}</p>
              </div>
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
            const weekItems = sessions[intent.week_number] ? getWeekDisplay(sessions[intent.week_number]) : [];
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
                    {/* Date range */}
                    <p className="text-xs font-bold text-primary tracking-wide">{weekStart} - {weekEnd}</p>

                    {/* Week title + phase */}
                    <div className="flex items-center gap-2 mt-1">
                      <h3 className="text-lg font-extrabold">Week {intent.week_number}</h3>
                      <Badge variant="secondary" className={cn('text-[10px] font-bold px-2 py-0', PHASE_COLORS[intent.phase])}>
                        {intent.phase.toUpperCase()}
                      </Badge>
                      {intent.is_recovery && <Badge variant="outline" className="text-[10px] font-bold px-2 py-0">RECOVERY</Badge>}
                      {isVacation && <Plane className="h-4 w-4 text-sky-500" />}
                    </div>

                    {/* Session progress bar segments */}
                    {isExpanded && weekItems.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {weekItems.map(item => (
                          <div key={item.id} className={cn(
                            'flex-1 h-2 rounded-full',
                            item.status === 'completed' ? item.color : 'bg-muted-foreground/15'
                          )} />
                        ))}
                      </div>
                    )}

                    {/* Summary stats */}
                    <div className="flex gap-4 mt-2">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{intent.total_distance_km}</span>km
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{intent.quality_sessions}</span> quality
                      </p>
                    </div>
                  </CardContent>
                </button>

                {/* Expanded: session list */}
                {isExpanded && (
                  <div className="px-5 pb-4 space-y-1">
                    {weekItems.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Loading sessions…</p>
                    ) : (
                      weekItems.map(item => (
                        <div
                          key={item.id}
                          className={cn(
                            'flex items-center gap-3 py-2.5 px-1',
                            item.status === 'completed' && 'opacity-60'
                          )}
                        >
                          {/* Color dot */}
                          <div className={cn('w-3 h-3 rounded-sm shrink-0', item.color)} />

                          {/* Day */}
                          <span className="text-xs font-bold w-8 text-muted-foreground">{item.dayName}</span>

                          {/* Title + subtitle */}
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-bold">{item.title}</span>
                            {item.subtitle && (
                              <span className="text-sm text-muted-foreground ml-1.5">· {item.subtitle}</span>
                            )}
                          </div>

                          {/* Checkbox */}
                          {item.isSession && (
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleSessionComplete(item.sessionId!, item.status); }}
                              className="shrink-0 p-0.5"
                            >
                              {item.status === 'completed' ? (
                                <CheckCircle2 className="h-5 w-5 text-primary" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-primary/60 transition-colors" />
                              )}
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

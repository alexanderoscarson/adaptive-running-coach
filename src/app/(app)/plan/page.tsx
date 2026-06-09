'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, parseISO, addDays } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Plane, Target, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
const WEEK_DAYS_ORDERED = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun

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
  const [dragOverDay, setDragOverDay] = useState<{ week: number; day: number } | null>(null);
  const dragSessionRef = useRef<{ session: Session; weekNumber: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [intentsRes, goalRes, constraintsRes] = await Promise.all([
      supabase.from('plan_intents').select('*').eq('user_id', user.id).order('week_number'),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
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

  // --- Drag and Drop ---
  function handleDragStart(e: React.DragEvent, session: Session, weekNumber: number) {
    dragSessionRef.current = { session, weekNumber };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', session.id);
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  }

  function handleDragEnd(e: React.DragEvent) {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    setDragOverDay(null);
    dragSessionRef.current = null;
  }

  function handleDragOver(e: React.DragEvent, weekNumber: number, dayOfWeek: number) {
    e.preventDefault();
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
    const dragData = dragSessionRef.current;
    if (!dragData || dragData.weekNumber !== weekNumber) return;

    const session = dragData.session;
    if (session.day_of_week === dayOfWeek) return;

    const weekSessions = sessions[weekNumber] || [];
    const sessionsOnDay = weekSessions.filter(s => s.day_of_week === dayOfWeek && s.id !== session.id);
    if (sessionsOnDay.length >= 2) return;

    const oldDay = session.day_of_week;
    const oldDate = session.session_date;

    // Calculate new date from week start
    const intent = intents.find(i => i.week_number === weekNumber);
    if (!intent) return;
    const weekStart = parseISO(intent.starts_on);
    const dayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Mon=0 offset
    const newDate = format(addDays(weekStart, dayOffset), 'yyyy-MM-dd');

    // Optimistic update
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
      // Revert
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

  function getConstraintForDay(dayOfWeek: number) {
    return constraints.find(c => c.type === 'recurring_activity' && c.day_of_week === dayOfWeek);
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

      {/* Goal banner */}
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
                      <h3 className="text-lg font-extrabold">Week {intent.week_number}</h3>
                      <Badge variant="secondary" className={cn('text-[10px] font-bold px-2 py-0', PHASE_COLORS[intent.phase])}>
                        {intent.phase.toUpperCase()}
                      </Badge>
                      {intent.is_recovery && <Badge variant="outline" className="text-[10px] font-bold px-2 py-0">RECOVERY</Badge>}
                      {isVacation && <Plane className="h-4 w-4 text-sky-500" />}
                    </div>

                    {isExpanded && weekSessions.length > 0 && (
                      <div className="flex gap-1 mt-3">
                        {weekSessions.map(s => (
                          <div key={s.id} className={cn(
                            'flex-1 h-2 rounded-full',
                            s.status === 'completed' ? SESSION_COLORS[s.type] || SESSION_COLORS.easy : 'bg-muted-foreground/15'
                          )} />
                        ))}
                      </div>
                    )}

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

                {/* Expanded: day-column layout with drag-and-drop */}
                {isExpanded && (
                  <div className="px-5 pb-4">
                    {weekSessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Loading sessions…</p>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {WEEK_DAYS_ORDERED.map(dayOfWeek => {
                          const daySessions = weekSessions.filter(s => s.day_of_week === dayOfWeek);
                          const constraint = getConstraintForDay(dayOfWeek);
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
                              <p className="text-[10px] font-bold text-muted-foreground text-center mb-1">
                                {DAY_NAMES[dayOfWeek]}
                              </p>

                              {isFull && isDragOver && (
                                <p className="text-[8px] text-destructive text-center font-semibold">Full</p>
                              )}

                              {daySessions.map(session => (
                                <div
                                  key={session.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, session, intent.week_number)}
                                  onDragEnd={handleDragEnd}
                                  className={cn(
                                    'rounded-md p-1.5 mb-1 cursor-grab active:cursor-grabbing transition-opacity group',
                                    session.status === 'completed' ? 'opacity-60' : '',
                                    'bg-card border shadow-sm hover:shadow-md'
                                  )}
                                >
                                  <div className="flex items-start gap-1">
                                    <div className={cn('w-2 h-2 rounded-sm shrink-0 mt-0.5', SESSION_COLORS[session.type] || SESSION_COLORS.easy)} />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[10px] font-bold leading-tight truncate">{session.title}</p>
                                      {session.distance_km && (
                                        <p className="text-[9px] text-muted-foreground">{session.distance_km}km</p>
                                      )}
                                      {!session.distance_km && session.duration_minutes && (
                                        <p className="text-[9px] text-muted-foreground">{session.duration_minutes}m</p>
                                      )}
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

                              {constraint && (
                                <div className="rounded-md p-1.5 mb-1 bg-pink-50 dark:bg-pink-950/30 border border-pink-200 dark:border-pink-800/40">
                                  <div className="flex items-center gap-1">
                                    <div className={cn('w-2 h-2 rounded-sm shrink-0', SESSION_COLORS.constraint_activity)} />
                                    <p className="text-[10px] font-bold leading-tight truncate">
                                      {ACTIVITY_LABELS[constraint.activity_type || ''] || constraint.activity_type || 'Activity'}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {daySessions.length === 0 && !constraint && (
                                <div className="flex items-center justify-center h-10 text-muted-foreground/20">
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
    </div>
  );
}

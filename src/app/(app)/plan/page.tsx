'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, parseISO, isThisWeek } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Circle, Plane, RefreshCw, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PlanIntent, Session, Goal } from '@/types/database';

const PHASE_COLORS: Record<string, string> = {
  base: 'text-green-600 bg-green-100 dark:bg-green-900/30',
  build: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
  peak: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
  taper: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
  race: 'text-red-600 bg-red-100 dark:bg-red-900/30',
};

const WEEK_STATE_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  current: <Circle className="h-4 w-4 text-primary fill-primary" />,
  planned: <Circle className="h-4 w-4 text-muted-foreground" />,
  adapted: <RefreshCw className="h-4 w-4 text-amber-500" />,
  vacation: <Plane className="h-4 w-4 text-sky-500" />,
  recovery: <RefreshCw className="h-4 w-4 text-emerald-500" />,
};

export default function PlanPage() {
  const [intents, setIntents] = useState<PlanIntent[]>([]);
  const [sessions, setSessions] = useState<Record<number, Session[]>>({});
  const [goal, setGoal] = useState<Goal | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [intentsRes, goalRes] = await Promise.all([
      supabase.from('plan_intents').select('*').eq('user_id', user.id).order('week_number'),
      supabase.from('goals').select('*').eq('user_id', user.id).eq('active', true).single(),
    ]);

    setIntents(intentsRes.data || []);
    setGoal(goalRes.data);

    const currentWeek = (intentsRes.data || []).find(i => i.week_state === 'current');
    if (currentWeek) {
      setExpandedWeek(currentWeek.week_number);
      loadWeekSessions(user.id, currentWeek.week_number);
    }

    setLoading(false);
  }

  async function loadWeekSessions(userId: string, weekNumber: number) {
    const { data } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .order('session_date')
      .order('order_in_day');

    setSessions(prev => ({ ...prev, [weekNumber]: data || [] }));
  }

  async function toggleWeek(weekNumber: number) {
    if (expandedWeek === weekNumber) {
      setExpandedWeek(null);
      return;
    }
    setExpandedWeek(weekNumber);
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !sessions[weekNumber]) {
      loadWeekSessions(user.id, weekNumber);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading plan…</div>
      </div>
    );
  }

  const distanceName = goal?.race_distance?.replace('_', ' ') || 'training';
  const raceDate = goal?.race_date ? format(parseISO(goal.race_date), 'MMM d, yyyy') : null;
  const totalWeeks = intents.length;
  const completedWeeks = intents.filter(i => i.week_state === 'completed').length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      {goal && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <h2 className="font-bold text-lg capitalize">{distanceName}</h2>
                <p className="text-sm text-muted-foreground">
                  {raceDate ? `Race day: ${raceDate}` : 'General improvement plan'}
                  {goal.target_time_seconds ? ` · Target: ${Math.floor(goal.target_time_seconds / 3600)}h${Math.floor((goal.target_time_seconds % 3600) / 60).toString().padStart(2, '0')}m` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span>{completedWeeks}/{totalWeeks} weeks</span>
              <div className="flex-1 h-1 bg-muted rounded-full">
                <div className="h-1 bg-primary rounded-full" style={{ width: `${(completedWeeks / totalWeeks) * 100}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <ScrollArea className="flex-1">
        <div className="space-y-1.5">
          {intents.map(intent => {
            const isExpanded = expandedWeek === intent.week_number;
            const isVacation = intent.week_state === 'vacation';
            const weekSessions = sessions[intent.week_number] || [];

            return (
              <div key={intent.id}>
                <button
                  onClick={() => toggleWeek(intent.week_number)}
                  className={cn(
                    'w-full text-left p-3 rounded-lg border transition-all',
                    isVacation && 'border-dashed border-sky-300',
                    intent.week_state === 'current' && 'border-primary bg-primary/5',
                    intent.week_state === 'completed' && 'bg-muted/30',
                    intent.week_state === 'adapted' && 'border-amber-300',
                    !['current', 'completed', 'adapted'].includes(intent.week_state) && !isVacation && 'border-border hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {WEEK_STATE_ICONS[intent.week_state] || WEEK_STATE_ICONS.planned}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Week {intent.week_number}</span>
                        <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', PHASE_COLORS[intent.phase])}>
                          {intent.phase}
                        </Badge>
                        {intent.is_recovery && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Recovery</Badge>}
                        {isVacation && <Plane className="h-3 w-3 text-sky-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{intent.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-medium">{intent.total_distance_km}km</div>
                      <div className="text-[10px] text-muted-foreground">{format(parseISO(intent.starts_on), 'MMM d')}</div>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  {intent.adaptation_reason && (
                    <p className="text-xs text-amber-600 mt-1 pl-7">Adapted: {intent.adaptation_reason}</p>
                  )}
                </button>

                {isExpanded && (
                  <div className="ml-7 mt-1 space-y-1 mb-2">
                    {weekSessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground p-2">Loading sessions…</p>
                    ) : (
                      weekSessions.map(s => (
                        <div
                          key={s.id}
                          className={cn(
                            'flex items-center gap-3 p-2 rounded-md text-sm',
                            s.status === 'completed' && 'opacity-60'
                          )}
                        >
                          <span className="text-xs text-muted-foreground w-8">{format(parseISO(s.session_date), 'EEE')}</span>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-xs">{s.title}</span>
                            {s.distance_km && <span className="text-xs text-muted-foreground ml-2">{s.distance_km}km</span>}
                          </div>
                          {s.status === 'completed' && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                          {s.adaptation_reason && <RefreshCw className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

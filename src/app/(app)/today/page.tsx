'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, Clock, Zap, Heart, AlertTriangle, Undo2, Info, Dumbbell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Session, PlanIntent, SessionLog } from '@/types/database';

const SESSION_ICONS: Record<string, React.ReactNode> = {
  easy: <Clock className="h-5 w-5 text-green-500" />,
  long: <Zap className="h-5 w-5 text-blue-500" />,
  tempo: <Zap className="h-5 w-5 text-orange-500" />,
  intervals: <Zap className="h-5 w-5 text-red-500" />,
  hills: <Zap className="h-5 w-5 text-amber-600" />,
  recovery: <Heart className="h-5 w-5 text-emerald-400" />,
  strength: <Dumbbell className="h-5 w-5 text-purple-500" />,
  rest: <Clock className="h-5 w-5 text-gray-400" />,
  race: <Zap className="h-5 w-5 text-yellow-500" />,
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
  const [currentIntent, setCurrentIntent] = useState<PlanIntent | null>(null);
  const [adaptation, setAdaptation] = useState<{ message: string; auditId: string } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<string | null>(null);
  const [rpe, setRpe] = useState([5]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const { data: profile } = await supabase.from('user_profiles').select('onboarding_completed').eq('id', user.id).single();
    if (!profile?.onboarding_completed) { router.push('/onboarding'); return; }

    const today = format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [todayRes, weekRes, intentRes] = await Promise.all([
      supabase.from('sessions').select('*').eq('user_id', user.id).eq('session_date', today).order('order_in_day'),
      supabase.from('sessions').select('*').eq('user_id', user.id).gte('session_date', weekStart).lte('session_date', weekEnd).order('session_date').order('order_in_day'),
      supabase.from('plan_intents').select('*').eq('user_id', user.id).eq('week_state', 'current').single(),
    ]);

    setSessions(todayRes.data || []);
    setWeekSessions(weekRes.data || []);
    setCurrentIntent(intentRes.data);

    const adapted = (todayRes.data || []).find(s => s.adaptation_reason);
    if (adapted) {
      setAdaptation({ message: adapted.adaptation_reason!, auditId: '' });
    }

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

  async function skipSession(sessionId: string) {
    await fetch('/api/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, status: 'skipped' }),
    });
    loadData();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading your training…</div>
      </div>
    );
  }

  const completedThisWeek = weekSessions.filter(s => s.status === 'completed').length;
  const totalThisWeek = weekSessions.filter(s => s.type !== 'rest').length;
  const weekProgress = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;
  const todayDate = format(new Date(), 'EEEE, MMMM d');

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-sm text-muted-foreground">{todayDate}</p>
      </div>

      {adaptation && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="py-3 px-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Plan adapted</p>
              <p className="text-xs text-muted-foreground">{adaptation.message}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => router.push('/audit')}>
                <Info className="h-3 w-3 mr-1" /> Details
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7">
                <Undo2 className="h-3 w-3 mr-1" /> Undo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentIntent && (
        <Card className="bg-muted/30">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                Week {currentIntent.week_number} · {currentIntent.phase.charAt(0).toUpperCase() + currentIntent.phase.slice(1)} Phase
              </span>
              <span className="text-xs text-muted-foreground">{completedThisWeek}/{totalThisWeek} sessions</span>
            </div>
            <Progress value={weekProgress} className="h-1.5" />
            <div className="flex gap-1.5 mt-3">
              {weekSessions.filter(s => s.type !== 'rest').map(s => (
                <div
                  key={s.id}
                  className={cn(
                    'flex-1 h-1.5 rounded-full',
                    s.status === 'completed' ? 'bg-green-500' :
                    s.status === 'skipped' ? 'bg-gray-300' :
                    isToday(parseISO(s.session_date)) ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">Rest day</p>
            <p className="text-sm text-muted-foreground mt-1">Recovery is part of the plan. Enjoy it!</p>
          </CardContent>
        </Card>
      ) : (
        sessions.map(session => (
          <Card key={session.id} className={cn(session.status === 'completed' && 'opacity-60')}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {SESSION_ICONS[session.type] || SESSION_ICONS.easy}
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{session.title}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{session.type}</Badge>
                    {session.distance_km && <span className="text-xs text-muted-foreground">{session.distance_km}km</span>}
                    {session.target_pace_min_km && <span className="text-xs text-muted-foreground">{formatPace(session.target_pace_min_km)}/km</span>}
                    {session.duration_minutes && <span className="text-xs text-muted-foreground">{session.duration_minutes}min</span>}
                  </div>
                </div>
                {session.status === 'completed' && <CheckCircle2 className="h-6 w-6 text-green-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{session.description}</p>

              {session.structure && (session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number }> }).blocks?.length > 0 && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  {(session.structure as { blocks: Array<{ type: string; description: string; distance_km?: number; duration_minutes?: number; repeats?: number }> }).blocks.map((block, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <div className={cn(
                        'w-1.5 h-1.5 rounded-full mt-1.5 shrink-0',
                        block.type === 'warmup' ? 'bg-yellow-400' :
                        block.type === 'main' ? 'bg-blue-500' :
                        block.type === 'interval' ? 'bg-red-500' :
                        block.type === 'recovery' ? 'bg-green-400' : 'bg-gray-400'
                      )} />
                      <span className="text-muted-foreground">
                        {block.repeats ? `${block.repeats}× ` : ''}
                        {block.description}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {session.status === 'planned' && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1" onClick={() => markComplete(session.id)}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Complete
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => skipSession(session.id)}>Skip</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={!!feedbackOpen} onOpenChange={() => setFeedbackOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How did it go?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Effort (RPE): {rpe[0]}/10</label>
              <Slider value={rpe} onValueChange={(val) => setRpe(Array.isArray(val) ? val : [val])} min={1} max={10} step={1} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Very easy</span><span>Maximal</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
              <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Any niggles?" rows={3} />
            </div>
            <Button className="w-full" onClick={submitFeedback}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

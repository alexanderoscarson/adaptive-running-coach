'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Plane, Activity, AlertTriangle, Calendar } from 'lucide-react';
import type { Constraint, RecurringActivity, VacationMode } from '@/types/database';

const ACTIVITIES: { value: RecurringActivity; label: string; emoji: string }[] = [
  { value: 'tennis', label: 'Tennis', emoji: '🎾' },
  { value: 'padel', label: 'Padel', emoji: '🏓' },
  { value: 'cycling', label: 'Cycling', emoji: '🚴' },
  { value: 'swimming', label: 'Swimming', emoji: '🏊' },
  { value: 'hiking', label: 'Hiking', emoji: '🥾' },
  { value: 'skiing', label: 'Skiing', emoji: '⛷️' },
  { value: 'climbing', label: 'Climbing', emoji: '🧗' },
  { value: 'generic_cardio', label: 'Other Cardio', emoji: '💪' },
  { value: 'generic_strength', label: 'Gym/Strength', emoji: '🏋️' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

export default function ConstraintsPage() {
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState<RecurringActivity>('tennis');
  const [newActivityDay, setNewActivityDay] = useState(1);
  const [newVacStart, setNewVacStart] = useState('');
  const [newVacEnd, setNewVacEnd] = useState('');
  const [newVacMode, setNewVacMode] = useState<VacationMode>('rest');
  const [newInjuryDesc, setNewInjuryDesc] = useState('');
  const [newInjurySeverity, setNewInjurySeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
  const [activeTab, setActiveTab] = useState('activities');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => { loadConstraints(); }, []);

  async function loadConstraints() {
    const res = await fetch('/api/constraints');
    const data = await res.json();
    setConstraints(data);
    setLoading(false);
  }

  async function addConstraint(body: Record<string, unknown>) {
    await fetch('/api/constraints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setDialogOpen(false);
    loadConstraints();
  }

  async function removeConstraint(id: string) {
    await fetch('/api/constraints', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    loadConstraints();
  }

  function handleAddActivity() {
    addConstraint({
      type: 'recurring_activity',
      activity_type: newActivity,
      day_of_week: newActivityDay,
      load_impact: 'medium',
    });
  }

  function handleAddVacation() {
    addConstraint({
      type: 'vacation',
      start_date: newVacStart,
      end_date: newVacEnd,
      vacation_mode: newVacMode,
      load_impact: newVacMode === 'rest' ? 'high' : 'medium',
    });
  }

  function handleAddInjury() {
    addConstraint({
      type: 'injury',
      injury_description: newInjuryDesc,
      injury_severity: newInjurySeverity,
      load_impact: newInjurySeverity === 'severe' ? 'high' : 'medium',
    });
  }

  const recurringActivities = constraints.filter(c => c.type === 'recurring_activity');
  const vacations = constraints.filter(c => c.type === 'vacation');
  const injuries = constraints.filter(c => c.type === 'injury');

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Schedule</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <Button size="sm" onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-1" /> Add</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add constraint</DialogTitle></DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="activities">Activity</TabsTrigger>
                <TabsTrigger value="vacation">Vacation</TabsTrigger>
                <TabsTrigger value="injury">Injury</TabsTrigger>
              </TabsList>
              <TabsContent value="activities" className="space-y-3 pt-2">
                <div>
                  <Label>Activity</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {ACTIVITIES.map(a => (
                      <Badge key={a.value} variant={newActivity === a.value ? 'default' : 'outline'} className="cursor-pointer" onClick={() => setNewActivity(a.value)}>
                        {a.emoji} {a.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Day</Label>
                  <div className="flex gap-1.5 mt-1">
                    {DAYS.map((d, i) => (
                      <Button key={d} variant={newActivityDay === DAY_VALUES[i] ? 'default' : 'outline'} size="sm" className="w-11" onClick={() => setNewActivityDay(DAY_VALUES[i])}>{d}</Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddActivity}>Add activity</Button>
              </TabsContent>
              <TabsContent value="vacation" className="space-y-3 pt-2">
                <div><Label>Start date</Label><Input type="date" value={newVacStart} onChange={e => setNewVacStart(e.target.value)} /></div>
                <div><Label>End date</Label><Input type="date" value={newVacEnd} onChange={e => setNewVacEnd(e.target.value)} /></div>
                <div>
                  <Label>Mode</Label>
                  <div className="flex gap-2 mt-1">
                    {[{ v: 'rest' as const, l: 'Full rest' }, { v: 'travel_light' as const, l: 'Travel light' }, { v: 'active' as const, l: 'Active' }].map(m => (
                      <Button key={m.v} variant={newVacMode === m.v ? 'default' : 'outline'} size="sm" onClick={() => setNewVacMode(m.v)} className="flex-1">{m.l}</Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddVacation}>Add vacation</Button>
              </TabsContent>
              <TabsContent value="injury" className="space-y-3 pt-2">
                <div><Label>Description</Label><Input value={newInjuryDesc} onChange={e => setNewInjuryDesc(e.target.value)} placeholder="Left knee pain" /></div>
                <div>
                  <Label>Severity</Label>
                  <div className="flex gap-2 mt-1">
                    {[{ v: 'minor' as const, l: 'Minor' }, { v: 'moderate' as const, l: 'Moderate' }, { v: 'severe' as const, l: 'Severe' }].map(s => (
                      <Button key={s.v} variant={newInjurySeverity === s.v ? 'default' : 'outline'} size="sm" onClick={() => setNewInjurySeverity(s.v)} className="flex-1">{s.l}</Button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={handleAddInjury}>Add injury flag</Button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {recurringActivities.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Activity className="h-4 w-4" /> Recurring Activities</h2>
          <div className="space-y-1.5">
            {recurringActivities.map(c => (
              <Card key={c.id}>
                <CardContent className="py-2.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold capitalize">{c.activity_type?.replace('_', ' ')}</span>
                    <span className="text-xs text-muted-foreground ml-2">{DAYS[DAY_VALUES.indexOf(c.day_of_week!)]}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeConstraint(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {vacations.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Plane className="h-4 w-4" /> Vacations</h2>
          <div className="space-y-1.5">
            {vacations.map(c => (
              <Card key={c.id}>
                <CardContent className="py-2.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">{c.start_date} → {c.end_date}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{c.vacation_mode}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeConstraint(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {injuries.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4" /> Injuries</h2>
          <div className="space-y-1.5">
            {injuries.map(c => (
              <Card key={c.id} className="border-red-200">
                <CardContent className="py-2.5 px-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold">{c.injury_description}</span>
                    <Badge variant="destructive" className="ml-2 text-xs">{c.injury_severity}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeConstraint(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {constraints.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm font-semibold">No constraints yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add activities, vacations, or injuries to shape your plan</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

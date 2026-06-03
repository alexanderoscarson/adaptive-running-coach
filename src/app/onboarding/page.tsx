'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

const ACTIVITIES = [
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

const TOTAL_STEPS = 8;

function timeToSeconds(time: string): number | null {
  if (!time) return null;
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goalType, setGoalType] = useState('race');
  const [raceDistance, setRaceDistance] = useState('half_marathon');
  const [targetTime, setTargetTime] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [baseline5k, setBaseline5k] = useState('');
  const [baseline10k, setBaseline10k] = useState('');
  const [baselineHalf, setBaselineHalf] = useState('');
  const [baselineMarathon, setBaselineMarathon] = useState('');
  const [weeklyMileage, setWeeklyMileage] = useState('20');
  const [runsPerWeek, setRunsPerWeek] = useState('3');
  const [availableDays, setAvailableDays] = useState<number[]>([1, 3, 5, 6]);
  const [longRunDay, setLongRunDay] = useState(6);
  const [strengthPref, setStrengthPref] = useState('moderate');
  const [maxHr, setMaxHr] = useState('');
  const [restingHr, setRestingHr] = useState('');
  const [activities, setActivities] = useState<{ type: string; day: number }[]>([]);

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (profile?.onboarding_completed) { router.push('/today'); return; }
      if (profile?.onboarding_step) setStep(profile.onboarding_step);
      if (profile?.age) setAge(String(profile.age));
      if (profile?.gender) setGender(profile.gender);
    }
    loadProgress();
  }, []);

  async function saveProgress(newStep: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_profiles').update({ onboarding_step: newStep }).eq('id', user.id);
  }

  function toggleDay(day: number) {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  }

  function toggleActivity(type: string, day: number) {
    setActivities(prev => {
      const exists = prev.find(a => a.type === type && a.day === day);
      if (exists) return prev.filter(a => !(a.type === type && a.day === day));
      return [...prev, { type, day }];
    });
  }

  async function handleFinish() {
    setGenerating(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_profiles').update({
      age: age ? parseInt(age) : null,
      gender: gender || null,
      max_hr: maxHr ? parseInt(maxHr) : null,
      resting_hr: restingHr ? parseInt(restingHr) : null,
      current_weekly_mileage_km: weeklyMileage ? parseFloat(weeklyMileage) : 20,
      runs_per_week: runsPerWeek ? parseInt(runsPerWeek) : 3,
      available_days: availableDays,
      preferred_long_run_day: longRunDay,
      strength_preference: strengthPref,
      onboarding_completed: true,
      onboarding_step: TOTAL_STEPS,
    }).eq('id', user.id);

    await supabase.from('goals').insert({
      user_id: user.id,
      type: goalType,
      race_distance: raceDistance,
      target_time_seconds: timeToSeconds(targetTime),
      race_date: raceDate || null,
      baseline_5k_seconds: timeToSeconds(baseline5k),
      baseline_10k_seconds: timeToSeconds(baseline10k),
      baseline_half_seconds: timeToSeconds(baselineHalf),
      baseline_marathon_seconds: timeToSeconds(baselineMarathon),
      plan_weeks: 17,
    });

    for (const act of activities) {
      await supabase.from('constraints').insert({
        user_id: user.id,
        type: 'recurring_activity',
        activity_type: act.type,
        day_of_week: act.day,
        load_impact: 'medium',
      });
    }

    await fetch('/api/plan/generate', { method: 'POST' });

    setGenerating(false);
    router.push('/today');
    router.refresh();
  }

  function next() {
    const newStep = Math.min(step + 1, TOTAL_STEPS - 1);
    setStep(newStep);
    saveProgress(newStep);
  }

  function prev() {
    setStep(s => Math.max(0, s - 1));
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <div className="p-4 max-w-lg mx-auto w-full">
        <Progress value={progress} className="h-1.5 mb-6" />
        <p className="text-xs text-muted-foreground text-center mb-4">Step {step + 1} of {TOTAL_STEPS}</p>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 pb-24">
        <Card className="w-full max-w-lg">
          {step === 0 && (
            <>
              <CardHeader>
                <CardTitle>About you</CardTitle>
                <CardDescription>Help us personalize your training zones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Age</Label>
                  <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" />
                </div>
                <div>
                  <Label>Gender</Label>
                  <div className="flex gap-2 mt-1">
                    {[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }, { v: 'non_binary', l: 'Non-binary' }, { v: 'prefer_not_to_say', l: 'Skip' }].map(g => (
                      <Button key={g.v} variant={gender === g.v ? 'default' : 'outline'} size="sm" onClick={() => setGender(g.v)}>{g.l}</Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Max Heart Rate (optional)</Label>
                  <Input type="number" value={maxHr} onChange={e => setMaxHr(e.target.value)} placeholder="185" />
                </div>
                <div>
                  <Label>Resting Heart Rate (optional)</Label>
                  <Input type="number" value={restingHr} onChange={e => setRestingHr(e.target.value)} placeholder="55" />
                </div>
              </CardContent>
            </>
          )}

          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle>Your goal</CardTitle>
                <CardDescription>What are you training for?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {[{ v: 'race', l: 'Race' }, { v: 'target_time', l: 'Target time' }, { v: 'just_improve', l: 'Just improve' }].map(g => (
                    <Button key={g.v} variant={goalType === g.v ? 'default' : 'outline'} size="sm" onClick={() => setGoalType(g.v)} className="flex-1">{g.l}</Button>
                  ))}
                </div>
                {goalType !== 'just_improve' && (
                  <div>
                    <Label>Race distance</Label>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {[{ v: '5k', l: '5K' }, { v: '10k', l: '10K' }, { v: 'half_marathon', l: 'Half Marathon' }, { v: 'marathon', l: 'Marathon' }].map(d => (
                        <Button key={d.v} variant={raceDistance === d.v ? 'default' : 'outline'} size="sm" onClick={() => setRaceDistance(d.v)}>{d.l}</Button>
                      ))}
                    </div>
                  </div>
                )}
                {goalType === 'target_time' && (
                  <div>
                    <Label>Target time (HH:MM:SS)</Label>
                    <Input value={targetTime} onChange={e => setTargetTime(e.target.value)} placeholder="1:45:00" />
                  </div>
                )}
                {goalType === 'race' && (
                  <div>
                    <Label>Race date</Label>
                    <Input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} />
                  </div>
                )}
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle>Current fitness</CardTitle>
                <CardDescription>Share any recent race or time trial results (MM:SS or HH:MM:SS)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>5K time</Label>
                  <Input value={baseline5k} onChange={e => setBaseline5k(e.target.value)} placeholder="25:00" />
                </div>
                <div>
                  <Label>10K time</Label>
                  <Input value={baseline10k} onChange={e => setBaseline10k(e.target.value)} placeholder="52:00" />
                </div>
                <div>
                  <Label>Half Marathon time</Label>
                  <Input value={baselineHalf} onChange={e => setBaselineHalf(e.target.value)} placeholder="1:55:00" />
                </div>
                <div>
                  <Label>Marathon time</Label>
                  <Input value={baselineMarathon} onChange={e => setBaselineMarathon(e.target.value)} placeholder="4:10:00" />
                </div>
                <p className="text-xs text-muted-foreground">Fill in whichever you have — even one helps us calibrate your paces.</p>
              </CardContent>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle>Current volume</CardTitle>
                <CardDescription>How much are you running right now?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Weekly mileage (km)</Label>
                  <Input type="number" value={weeklyMileage} onChange={e => setWeeklyMileage(e.target.value)} placeholder="20" />
                </div>
                <div>
                  <Label>Runs per week</Label>
                  <div className="flex gap-2 mt-1">
                    {[2, 3, 4, 5, 6].map(n => (
                      <Button key={n} variant={runsPerWeek === String(n) ? 'default' : 'outline'} size="sm" onClick={() => setRunsPerWeek(String(n))} className="w-12">{n}</Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle>Available days</CardTitle>
                <CardDescription>Which days can you run?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {DAYS.map((d, i) => (
                    <Button
                      key={d}
                      variant={availableDays.includes(DAY_VALUES[i]) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleDay(DAY_VALUES[i])}
                      className="w-14"
                    >
                      {d}
                    </Button>
                  ))}
                </div>
                <div>
                  <Label>Preferred long run day</Label>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {DAYS.map((d, i) => (
                      <Button
                        key={d}
                        variant={longRunDay === DAY_VALUES[i] ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setLongRunDay(DAY_VALUES[i])}
                        className="w-14"
                        disabled={!availableDays.includes(DAY_VALUES[i])}
                      >
                        {d}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle>Strength training</CardTitle>
                <CardDescription>How much strength work do you want in your plan?</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { v: 'none', l: 'None', d: 'No strength work in the plan' },
                    { v: 'light', l: 'Light', d: 'Bodyweight circuits, 20 min' },
                    { v: 'moderate', l: 'Moderate', d: 'Runner-specific strength, 30 min' },
                    { v: 'heavy', l: 'Heavy', d: 'Compound lifts + plyometrics, 45 min' },
                  ].map(s => (
                    <button
                      key={s.v}
                      onClick={() => setStrengthPref(s.v)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg border transition-colors',
                        strengthPref === s.v ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                      )}
                    >
                      <div className="font-medium text-sm">{s.l}</div>
                      <div className="text-xs text-muted-foreground">{s.d}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {step === 6 && (
            <>
              <CardHeader>
                <CardTitle>Other activities</CardTitle>
                <CardDescription>Add recurring activities so we plan around them</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {ACTIVITIES.map(act => (
                    <div key={act.value}>
                      <div className="text-sm font-medium mb-1">{act.emoji} {act.label}</div>
                      <div className="flex gap-1.5 flex-wrap">
                        {DAYS.map((d, i) => {
                          const selected = activities.some(a => a.type === act.value && a.day === DAY_VALUES[i]);
                          return (
                            <Badge
                              key={d}
                              variant={selected ? 'default' : 'outline'}
                              className="cursor-pointer text-xs"
                              onClick={() => toggleActivity(act.value, DAY_VALUES[i])}
                            >
                              {d}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Tap days to mark when you do each activity. Skip this if you only run.</p>
              </CardContent>
            </>
          )}

          {step === 7 && (
            <>
              <CardHeader>
                <CardTitle>Ready to go!</CardTitle>
                <CardDescription>We'll generate your personalized {raceDistance.replace('_', ' ')} training plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Goal</span><span>{goalType === 'race' ? `${raceDistance.replace('_', ' ')} race` : goalType === 'target_time' ? `${raceDistance.replace('_', ' ')} in ${targetTime}` : 'General improvement'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Weekly volume</span><span>{weeklyMileage}km / {runsPerWeek} runs</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Plan length</span><span>17 weeks</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Strength</span><span className="capitalize">{strengthPref}</span></div>
                  {activities.length > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Other activities</span><span>{activities.length} scheduled</span></div>
                  )}
                </div>
                <Button className="w-full" size="lg" onClick={handleFinish} disabled={generating}>
                  {generating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating your plan…</> : 'Generate my plan'}
                </Button>
              </CardContent>
            </>
          )}

          <div className="flex justify-between p-4 pt-0">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : <div />}
            {step < TOTAL_STEPS - 1 && (
              <Button size="sm" onClick={next}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

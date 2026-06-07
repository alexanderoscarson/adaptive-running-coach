'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, Search, MapPin, Calendar, Trophy, X, Info } from 'lucide-react';

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

const STEP_TITLES = [
  { title: 'Let\'s get\nto know you', emoji: '👋' },
  { title: 'Set your\ngoal', emoji: '🎯' },
  { title: 'Where are\nyou now?', emoji: '📊' },
  { title: 'Your weekly\nvolume', emoji: '📏' },
  { title: 'Pick your\ndays', emoji: '📅' },
  { title: 'Strength\ntraining', emoji: '💪' },
  { title: 'Other\nactivities', emoji: '🎾' },
  { title: 'Ready\nto go!', emoji: '🚀' },
];

const TOTAL_STEPS = 8;

interface Race {
  id: string;
  name: string;
  location: string;
  country: string;
  date: string;
  distance: string;
}

function timeToSeconds(time: string): number | null {
  if (!time) return null;
  const parts = time.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Form state
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [goalType, setGoalType] = useState('race');
  const [raceDistance, setRaceDistance] = useState('half_marathon');
  const [targetTime, setTargetTime] = useState('');
  const [raceDate, setRaceDate] = useState('');
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [raceQuery, setRaceQuery] = useState('');
  const [raceResults, setRaceResults] = useState<Race[]>([]);
  const [raceSearchOpen, setRaceSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [baseline5k, setBaseline5k] = useState('');
  const [baseline10k, setBaseline10k] = useState('');
  const [baselineHalf, setBaselineHalf] = useState('');
  const [baselineMarathon, setBaselineMarathon] = useState('');
  const [weeklyMileage, setWeeklyMileage] = useState('20');
  const [runsPerWeek, setRunsPerWeek] = useState('3');
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [longRunDay, setLongRunDay] = useState<number | null>(null);
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

  // Race search with debounce
  const searchRaces = useCallback(async (query: string, distance: string) => {
    if (query.length < 2 && !distance) return;
    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (distance) params.set('distance', distance);
      const res = await fetch(`/api/races?${params}`);
      const data = await res.json();
      setRaceResults(data);
    } catch {
      setRaceResults([]);
    }
    setSearchLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (raceSearchOpen) {
        searchRaces(raceQuery, raceDistance);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [raceQuery, raceDistance, raceSearchOpen, searchRaces]);

  function selectRace(race: Race) {
    setSelectedRace(race);
    setRaceDate(race.date);
    setRaceDistance(race.distance as typeof raceDistance);
    setRaceSearchOpen(false);
    setRaceQuery('');
  }

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
      available_days: availableDays.length > 0 ? availableDays : [1, 3, 5, 6],
      preferred_long_run_day: longRunDay ?? 6,
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side — branded gradient panel (desktop) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-gradient-to-br from-primary to-purple-700 items-center justify-center p-12 relative">
        <div className="text-white text-center">
          <div className="text-7xl mb-6">{STEP_TITLES[step].emoji}</div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight whitespace-pre-line">{STEP_TITLES[step].title}</h2>
        </div>
        <div className="absolute bottom-8 left-8 right-8">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center justify-between text-white/80 text-sm font-bold mb-2">
              <span>Step {step + 1} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </div>
      </div>

      {/* Right side — form */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile progress bar */}
        <div className="md:hidden p-4 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-semibold">Step {step + 1} of {TOTAL_STEPS}</span>
            <span className="text-xs text-primary font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Mobile gradient strip */}
        <div className="md:hidden h-24 relative mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-purple-700 flex items-center justify-center gap-3">
          <span className="text-3xl">{STEP_TITLES[step].emoji}</span>
          <span className="text-white font-extrabold text-lg">{STEP_TITLES[step].title.replace('\n', ' ')}</span>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 py-6 md:py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-md">
            {/* Step 0 — About You */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">About you</h1>
                  <p className="text-muted-foreground mt-1">Help us personalize your training zones</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold">Age</Label>
                    <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="30" className="mt-1 h-11 rounded-xl" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Gender</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[{ v: 'male', l: 'Male' }, { v: 'female', l: 'Female' }, { v: 'non_binary', l: 'Non-binary' }, { v: 'prefer_not_to_say', l: 'Prefer not to say' }].map(g => (
                        <button key={g.v} onClick={() => setGender(g.v)} className={cn(
                          'py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all',
                          gender === g.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                        )}>{g.l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold">Max HR <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input type="number" value={maxHr} onChange={e => setMaxHr(e.target.value)} placeholder="185" className="mt-1 h-11 rounded-xl" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Resting HR <span className="text-muted-foreground font-normal">(optional)</span></Label>
                      <Input type="number" value={restingHr} onChange={e => setRestingHr(e.target.value)} placeholder="55" className="mt-1 h-11 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1 — Goal with Race Search */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your goal</h1>
                  <p className="text-muted-foreground mt-1">What are you training for?</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[{ v: 'race', l: 'Race', icon: '🏁' }, { v: 'target_time', l: 'Target time', icon: '⏱️' }, { v: 'just_improve', l: 'Just improve', icon: '📈' }].map(g => (
                    <button key={g.v} onClick={() => setGoalType(g.v)} className={cn(
                      'py-3 px-2 rounded-xl border text-center transition-all',
                      goalType === g.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    )}>
                      <div className="text-2xl mb-1">{g.icon}</div>
                      <div className="text-xs font-semibold">{g.l}</div>
                    </button>
                  ))}
                </div>

                {goalType !== 'just_improve' && (
                  <>
                    <div>
                      <Label className="text-sm font-semibold">Race distance</Label>
                      <div className="grid grid-cols-4 gap-2 mt-1">
                        {[{ v: '5k', l: '5K' }, { v: '10k', l: '10K' }, { v: 'half_marathon', l: 'Half' }, { v: 'marathon', l: 'Marathon' }].map(d => (
                          <button key={d.v} onClick={() => { setRaceDistance(d.v); setSelectedRace(null); }} className={cn(
                            'py-2.5 rounded-xl border text-sm font-semibold transition-all',
                            raceDistance === d.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                          )}>{d.l}</button>
                        ))}
                      </div>
                    </div>

                    {/* Race Search */}
                    <div>
                      <Label className="text-sm font-semibold">Find your race</Label>
                      <div className="relative mt-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          value={raceQuery}
                          onChange={e => { setRaceQuery(e.target.value); setRaceSearchOpen(true); }}
                          onFocus={() => { setRaceSearchOpen(true); searchRaces(raceQuery, raceDistance); }}
                          placeholder="Search races... e.g. Stockholm, Berlin, NYC"
                          className="pl-10 h-11 rounded-xl"
                        />
                      </div>

                      {/* Selected race card */}
                      {selectedRace && (
                        <Card className="mt-3 border-primary/30 bg-primary/5">
                          <CardContent className="py-3 px-4 flex items-center gap-3">
                            <Trophy className="h-5 w-5 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{selectedRace.name}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span>{selectedRace.location}</span>
                                <Calendar className="h-3 w-3 ml-1" />
                                <span>{new Date(selectedRace.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </div>
                            </div>
                            <button onClick={() => { setSelectedRace(null); setRaceDate(''); }} className="text-muted-foreground hover:text-foreground">
                              <X className="h-4 w-4" />
                            </button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Race search results dropdown */}
                      {raceSearchOpen && !selectedRace && (
                        <div className="mt-2 rounded-xl border bg-card shadow-lg max-h-64 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-1" /> Searching…
                            </div>
                          ) : raceResults.length === 0 ? (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {raceQuery.length < 2 ? 'Type to search races worldwide' : 'No races found — try a different search'}
                            </div>
                          ) : (
                            raceResults.map(race => (
                              <button
                                key={race.id}
                                onClick={() => selectRace(race)}
                                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b last:border-0"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <Trophy className="h-4 w-4 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{race.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <MapPin className="h-3 w-3" />
                                      <span>{race.location}, {race.country}</span>
                                      <span>·</span>
                                      <span>{new Date(race.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className="text-[10px] shrink-0">{race.distance.replace('_', ' ')}</Badge>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Manual date fallback */}
                    {!selectedRace && (
                      <div>
                        <Label className="text-sm font-semibold">Or enter a date manually</Label>
                        <Input type="date" value={raceDate} onChange={e => setRaceDate(e.target.value)} className="mt-1 h-11 rounded-xl" />
                      </div>
                    )}
                  </>
                )}

                {goalType === 'target_time' && (
                  <div>
                    <Label className="text-sm font-semibold">Target time (HH:MM:SS)</Label>
                    <Input value={targetTime} onChange={e => setTargetTime(e.target.value)} placeholder="1:45:00" className="mt-1 h-11 rounded-xl" />
                  </div>
                )}
              </div>
            )}

            {/* Step 2 — Current Fitness */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Current fitness</h1>
                  <p className="text-muted-foreground mt-1">Share any recent race or time trial results</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: '5K time', value: baseline5k, set: setBaseline5k, ph: '25:00' },
                    { label: '10K time', value: baseline10k, set: setBaseline10k, ph: '52:00' },
                    { label: 'Half Marathon time', value: baselineHalf, set: setBaselineHalf, ph: '1:55:00' },
                    { label: 'Marathon time', value: baselineMarathon, set: setBaselineMarathon, ph: '4:10:00' },
                  ].map(f => (
                    <div key={f.label}>
                      <Label className="text-sm font-semibold">{f.label}</Label>
                      <Input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} className="mt-1 h-11 rounded-xl" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                  Fill in whichever you have — even one helps us calibrate your training paces. Format: MM:SS or HH:MM:SS.
                </p>
              </div>
            )}

            {/* Step 3 — Current Volume */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Current volume</h1>
                  <p className="text-muted-foreground mt-1">How much are you running right now?</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold">Weekly distance (km)</Label>
                  <Input type="number" value={weeklyMileage} onChange={e => setWeeklyMileage(e.target.value)} placeholder="20" className="mt-1 h-11 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">Runs per week</Label>
                  <div className="flex gap-2 mt-2">
                    {[2, 3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setRunsPerWeek(String(n))} className={cn(
                        'flex-1 py-3 rounded-xl border text-lg font-semibold transition-all',
                        runsPerWeek === String(n) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 — Available Days */}
            {step === 4 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your schedule</h1>
                  <p className="text-muted-foreground mt-1">Which days can you run?</p>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Available days</Label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((d, i) => (
                      <button key={d} onClick={() => toggleDay(DAY_VALUES[i])} className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        availableDays.includes(DAY_VALUES[i]) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{d}</button>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">We recommend 3–5 days per week with at least one rest day between hard sessions. Spreading runs across the week helps recovery.</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Preferred long run day</Label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((d, i) => (
                      <button
                        key={d}
                        onClick={() => setLongRunDay(DAY_VALUES[i])}
                        disabled={!availableDays.includes(DAY_VALUES[i])}
                        className={cn(
                          'py-3 rounded-xl border text-sm font-semibold transition-all',
                          longRunDay === DAY_VALUES[i] ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary/40',
                          !availableDays.includes(DAY_VALUES[i]) && 'opacity-30 cursor-not-allowed'
                        )}
                      >{d}</button>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">Most runners do their long run on Saturday or Sunday when they have more time. Pick the day that works best for you.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 — Strength */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Strength training</h1>
                  <p className="text-muted-foreground mt-1">How much strength work in your plan?</p>
                </div>
                <div className="space-y-2">
                  {[
                    { v: 'none', l: 'None', d: 'Running only — no strength sessions', icon: '🚫' },
                    { v: 'light', l: 'Light', d: 'Bodyweight circuits, 20 minutes', icon: '🧘' },
                    { v: 'moderate', l: 'Moderate', d: 'Runner-specific strength, 30 minutes', icon: '💪' },
                    { v: 'heavy', l: 'Heavy', d: 'Compound lifts + plyometrics, 45 minutes', icon: '🏋️' },
                  ].map(s => (
                    <button key={s.v} onClick={() => setStrengthPref(s.v)} className={cn(
                      'w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4',
                      strengthPref === s.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    )}>
                      <span className="text-2xl">{s.icon}</span>
                      <div>
                        <div className="font-semibold text-sm">{s.l}</div>
                        <div className="text-xs text-muted-foreground">{s.d}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 6 — Other Activities */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Other activities</h1>
                  <p className="text-muted-foreground mt-1">We'll plan around your other commitments</p>
                </div>
                <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                  {ACTIVITIES.map(act => (
                    <div key={act.value}>
                      <div className="text-sm font-semibold mb-1.5">{act.emoji} {act.label}</div>
                      <div className="grid grid-cols-7 gap-1">
                        {DAYS.map((d, i) => {
                          const selected = activities.some(a => a.type === act.value && a.day === DAY_VALUES[i]);
                          return (
                            <button key={d} onClick={() => toggleActivity(act.value, DAY_VALUES[i])} className={cn(
                              'py-1.5 rounded-lg border text-xs font-semibold transition-all',
                              selected ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 hover:border-primary/40 text-muted-foreground'
                            )}>{d}</button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                  Tap days for each activity. Skip entirely if you only run.
                </p>
              </div>
            )}

            {/* Step 7 — Summary & Generate */}
            {step === 7 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">You're all set!</h1>
                  <p className="text-muted-foreground mt-1">Here's your training plan summary</p>
                </div>

                <div className="rounded-2xl bg-card border p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Goal</span>
                    <span className="font-semibold">
                      {selectedRace ? selectedRace.name : goalType === 'just_improve' ? 'General improvement' : `${raceDistance.replace('_', ' ')} ${goalType}`}
                    </span>
                  </div>
                  {raceDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Race date</span>
                      <span className="font-semibold">{new Date(raceDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current volume</span>
                    <span className="font-semibold">{weeklyMileage}km / {runsPerWeek} runs per week</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Plan length</span>
                    <span className="font-semibold">17 weeks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Strength</span>
                    <span className="font-semibold capitalize">{strengthPref}</span>
                  </div>
                  {activities.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Other activities</span>
                      <span className="font-semibold">{activities.length} scheduled</span>
                    </div>
                  )}
                </div>

                <Button className="w-full h-12 rounded-xl text-base font-semibold" size="lg" onClick={handleFinish} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating your plan…
                    </>
                  ) : (
                    <>
                      Generate my plan <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              {step > 0 ? (
                <Button variant="ghost" onClick={prev} className="rounded-xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : <div />}
              {step < TOTAL_STEPS - 1 && (
                <Button onClick={next} className="rounded-xl">
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, Search, Trophy, X, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { RACES, getKlassikerRaces, getRaceById, SPORT_LABELS, SPORT_EMOJI, type Race, type Sport } from '@/lib/races';

// Steps: 0=Races, 1=Fitness, 2=SportBalance(conditional), 3=Schedule, 4=Life, 5=TrainingPrefs, 6=Summary
const TOTAL_STEPS = 7;

const STEP_TITLES = [
  { title: 'What are you\ntraining for?', emoji: '🎯' },
  { title: 'Where are\nyou at?', emoji: '📊' },
  { title: 'Sport\nbalance', emoji: '⚖️' },
  { title: 'Your\nschedule', emoji: '📅' },
  { title: 'Your\nlife', emoji: '🧬' },
  { title: 'How do you\nlike to train?', emoji: '🎚️' },
  { title: 'Your plan\noverview', emoji: '🚀' },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

// Pre-selected popular race shortcuts
const QUICK_PICK_IDS = ['stockholm-marathon', 'goteborgsvarvet'];

type ExperienceLevel = 'never' | 'some' | 'regular';
type PBDistance = '10k' | 'half_marathon' | 'marathon';
type TrainingVolume = 'gradual' | 'steady' | 'progressive';
type TrainingDifficulty = 'comfortable' | 'balanced' | 'challenging';

interface SportFitness {
  sport: Sport;
  experience: ExperienceLevel;
  abilityData: Record<string, string>;
}

interface LifeActivityState {
  type: string;
  active: boolean;
  frequency: number;
  sportName: string;
  days: string[];
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_CHIPS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_CHIPS_SV = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];

function timeToSeconds(time: string): number | null {
  if (!time) return null;
  const parts = time.split(':').map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Step 1: Race goals
  const [selectedRaces, setSelectedRaces] = useState<Race[]>([]);
  const [raceQuery, setRaceQuery] = useState('');
  const [raceSearchOpen, setRaceSearchOpen] = useState(false);
  const [filteredRaces, setFilteredRaces] = useState<Race[]>([]);
  const [customRace, setCustomRace] = useState({ name: '', sport: 'running' as Sport, distance: '', date: '' });
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Step 2: Fitness per sport + PB
  const [sportFitness, setSportFitness] = useState<SportFitness[]>([]);
  const [pbDistance, setPbDistance] = useState<PBDistance | null>(null);
  const [pbTime, setPbTime] = useState('');

  // Step 3: Sport priority weights
  const [sportWeights, setSportWeights] = useState<Record<Sport, number>>({} as Record<Sport, number>);

  // Step 4: Schedule
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [sessionLength, setSessionLength] = useState('45-60');
  const [timePreference, setTimePreference] = useState('any');

  // Step 5: Life activities
  const [lifeActivities, setLifeActivities] = useState<LifeActivityState[]>([
    { type: 'gym', active: false, frequency: 2, sportName: '', days: [] },
    { type: 'team_sport', active: false, frequency: 1, sportName: '', days: [] },
    { type: 'demanding_work', active: false, frequency: 0, sportName: '', days: [] },
    { type: 'regular_travel', active: false, frequency: 0, sportName: '', days: [] },
    { type: 'recovery_priority', active: false, frequency: 0, sportName: '', days: [] },
  ]);

  // Step 6: Training preferences
  const [trainingVolume, setTrainingVolume] = useState<TrainingVolume>('steady');
  const [trainingDifficulty, setTrainingDifficulty] = useState<TrainingDifficulty>('balanced');

  useEffect(() => {
    async function loadProgress() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      if (profile?.onboarding_completed) { router.push('/today'); return; }
      if (profile?.onboarding_step) setStep(profile.onboarding_step);
    }
    loadProgress();
  }, []);

  // Derive unique sports from selected races
  const selectedSports = [...new Set(selectedRaces.map(r => r.sport))];
  const isMultiSport = selectedSports.length > 1;
  const primaryIsRunning = selectedRaces.length > 0 && selectedRaces[0].sport === 'running';

  // Initialize sport fitness when races change
  useEffect(() => {
    setSportFitness(prev => {
      const newFitness: SportFitness[] = selectedSports.map(sport => {
        const existing = prev.find(sf => sf.sport === sport);
        return existing || { sport, experience: 'some' as ExperienceLevel, abilityData: {} };
      });
      return newFitness;
    });

    if (selectedSports.length > 0) {
      setSportWeights(prev => {
        const equalWeight = Math.floor(100 / selectedSports.length);
        const weights: Record<string, number> = {};
        selectedSports.forEach((sport, i) => {
          weights[sport] = prev[sport] || (i === 0 ? 100 - equalWeight * (selectedSports.length - 1) : equalWeight);
        });
        return weights as Record<Sport, number>;
      });
    }
  }, [selectedRaces.length]);

  // Race search
  const searchRaces = useCallback((query: string) => {
    if (!query || query.length < 2) {
      setFilteredRaces(RACES.slice(0, 10));
      return;
    }
    const q = query.toLowerCase();
    const results = RACES.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.country.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    ).slice(0, 15);
    setFilteredRaces(results);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchRaces(raceQuery), 200);
    return () => clearTimeout(timer);
  }, [raceQuery, searchRaces]);

  function selectKlassiker() {
    setSelectedRaces(getKlassikerRaces());
  }

  function selectQuickPick(id: string) {
    const race = getRaceById(id);
    if (race && !selectedRaces.find(r => r.id === id)) {
      setSelectedRaces(prev => [...prev, race]);
    }
  }

  function toggleRace(race: Race) {
    setSelectedRaces(prev =>
      prev.find(r => r.id === race.id)
        ? prev.filter(r => r.id !== race.id)
        : [...prev, race]
    );
  }

  function addCustomRace() {
    if (!customRace.name || !customRace.date) return;
    const custom: Race = {
      id: `custom-${Date.now()}`,
      name: customRace.name,
      sport: customRace.sport,
      country: 'Custom',
      month: new Date(customRace.date).getMonth() + 1,
      distanceKm: parseFloat(customRace.distance) || 0,
      klassiker: false,
      difficulty: 'intermediate',
      description: '',
      descriptionSv: '',
    };
    setSelectedRaces(prev => [...prev, custom]);
    setCustomRace({ name: '', sport: 'running', distance: '', date: '' });
    setShowCustomForm(false);
  }

  function updateSportFitness(sport: Sport, field: string, value: string) {
    setSportFitness(prev => prev.map(sf =>
      sf.sport === sport
        ? field === 'experience'
          ? { ...sf, experience: value as ExperienceLevel }
          : { ...sf, abilityData: { ...sf.abilityData, [field]: value } }
        : sf
    ));
  }

  function updateSportWeight(sport: Sport, value: number) {
    const others = selectedSports.filter(s => s !== sport);
    const remaining = 100 - value;
    const otherTotal = others.reduce((sum, s) => sum + (sportWeights[s] || 0), 0);
    const newWeights = { ...sportWeights, [sport]: value };
    if (otherTotal > 0) {
      others.forEach(s => {
        newWeights[s] = Math.round(((sportWeights[s] || 0) / otherTotal) * remaining);
      });
    } else {
      const perOther = Math.floor(remaining / others.length);
      others.forEach(s => { newWeights[s] = perOther; });
    }
    setSportWeights(newWeights);
  }

  function toggleDay(day: number) {
    setAvailableDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  }

  function toggleLifeActivity(type: string) {
    setLifeActivities(prev => prev.map(la =>
      la.type === type ? { ...la, active: !la.active } : la
    ));
  }

  function updateLifeActivity(type: string, field: string, value: string | number) {
    setLifeActivities(prev => prev.map(la =>
      la.type === type ? { ...la, [field]: value } : la
    ));
  }

  function toggleLifeActivityDay(type: string, day: string) {
    setLifeActivities(prev => prev.map(la =>
      la.type === type
        ? { ...la, days: la.days.includes(day) ? la.days.filter(d => d !== day) : [...la.days, day] }
        : la
    ));
  }

  async function saveProgress(newStep: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_profiles').update({ onboarding_step: newStep }).eq('id', user.id);
  }

  // Map race distance to goal race_distance
  function raceToGoalDistance(race: Race): string {
    const km = race.distanceKm;
    if (km <= 5) return '5k';
    if (km <= 10) return '10k';
    if (km <= 25) return 'half_marathon';
    return 'marathon';
  }

  // Map PB distance key to baseline field name
  function pbDistanceToBaseline(dist: PBDistance): string {
    const map: Record<PBDistance, string> = {
      '10k': 'baseline_10k_seconds',
      'half_marathon': 'baseline_half_seconds',
      'marathon': 'baseline_marathon_seconds',
    };
    return map[dist];
  }

  async function handleFinish() {
    setGenerating(true);
    setError(null);
    console.log('[Onboarding] handleFinish started');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Onboarding] No authenticated user');
        setError('You need to be logged in. Redirecting...');
        setGenerating(false);
        router.push('/auth/login');
        return;
      }
      console.log('[Onboarding] User:', user.id);

      // 1. Upsert user profile — ensures the row exists even if the auto-create trigger didn't fire
      console.log('[Onboarding] Upserting profile...');
      const profileUpsert = await supabase.from('user_profiles').upsert({
        id: user.id,
        email: user.email!,
        available_days: availableDays.length > 0 ? availableDays : [1, 3, 5, 6],
        runs_per_week: daysPerWeek,
        onboarding_completed: true,
        onboarding_step: TOTAL_STEPS,
      }, { onConflict: 'id' }).select().single();
      if (profileUpsert.error) {
        console.error('[Onboarding] Profile upsert error:', profileUpsert.error);
        throw new Error(`Profile update failed: ${profileUpsert.error.message}`);
      }
      console.log('[Onboarding] Profile upserted, id:', profileUpsert.data?.id);

      // Try to update extended fields (may not exist if migration 002/003 not applied)
      console.log('[Onboarding] Updating profile (extended fields)...');
      const extUpdate = await supabase.from('user_profiles').update({
        preferred_session_length: sessionLength,
        time_preference: timePreference,
      }).eq('id', user.id);
      if (extUpdate.error) {
        console.warn('[Onboarding] Extended profile fields not saved (columns may not exist yet):', extUpdate.error.message);
      } else {
        console.log('[Onboarding] Extended profile updated');
      }

      // 2. Save user_races
      console.log('[Onboarding] Saving races...');
      for (const race of selectedRaces) {
        const raceInsert = race.id.startsWith('custom-')
          ? await supabase.from('user_races').insert({
              user_id: user.id,
              custom_name: race.name,
              custom_sport: race.sport,
              custom_distance_km: race.distanceKm,
              target_date: customRace.date || null,
              is_custom: true,
            })
          : await supabase.from('user_races').insert({
              user_id: user.id,
              race_id: race.id,
              target_date: null,
              is_custom: false,
            });
        if (raceInsert.error) console.warn('[Onboarding] Race insert warning:', raceInsert.error);
      }
      console.log('[Onboarding] Races saved:', selectedRaces.length);

      // 3. Save user_sports
      console.log('[Onboarding] Saving sports...');
      for (const sf of sportFitness) {
        const sportInsert = await supabase.from('user_sports').insert({
          user_id: user.id,
          sport: sf.sport,
          experience_level: sf.experience,
          priority_weight: sportWeights[sf.sport] || 25,
          current_ability_data: {
            ...sf.abilityData,
            training_volume: trainingVolume,
            training_difficulty: trainingDifficulty,
          },
        });
        if (sportInsert.error) console.warn('[Onboarding] Sport insert warning:', sportInsert.error);
      }
      console.log('[Onboarding] Sports saved:', sportFitness.length);

      // 4. Save life_activities
      console.log('[Onboarding] Saving life activities...');
      for (const la of lifeActivities) {
        if (!la.active) continue;
        const details: Record<string, unknown> = {};
        if (la.days.length > 0) details.days = la.days;
        if (la.type === 'regular_travel') details.regularTravel = true;
        await supabase.from('life_activities').insert({
          user_id: user.id,
          activity_type: la.type,
          frequency: la.frequency,
          sport_name: la.sportName || null,
          impact_level: 'medium',
          details,
        });
      }

      // 5. Create a goals row so plan-generator works
      //    Bridge from the first selected race to the legacy Goal format
      console.log('[Onboarding] Creating goal...');
      const primaryRace = selectedRaces[0];
      const goalDistance = primaryRace ? raceToGoalDistance(primaryRace) : 'half_marathon';

      const baselineFields: Record<string, number | null> = {
        baseline_10k_seconds: null,
        baseline_half_seconds: null,
        baseline_marathon_seconds: null,
      };
      if (pbDistance && pbTime) {
        const seconds = timeToSeconds(pbTime);
        if (seconds) {
          baselineFields[pbDistanceToBaseline(pbDistance)] = seconds;
        }
      }

      // Deactivate any existing active goals (handles onboarding retry)
      await supabase.from('goals').update({ active: false }).eq('user_id', user.id).eq('active', true);

      const goalInsert = await supabase.from('goals').insert({
        user_id: user.id,
        type: 'race',
        race_distance: goalDistance,
        race_date: null,
        plan_weeks: 17,
        active: true,
        ...baselineFields,
      }).select().single();
      if (goalInsert.error) {
        console.error('[Onboarding] Goal insert error:', goalInsert.error);
        throw new Error(`Goal creation failed: ${goalInsert.error.message}`);
      }
      console.log('[Onboarding] Goal created, id:', goalInsert.data?.id, 'distance:', goalDistance);

      // 6. Generate plan
      console.log('[Onboarding] Calling plan generation API...');
      const planRes = await fetch('/api/plan/generate', { method: 'POST' });
      const planData = await planRes.json();
      console.log('[Onboarding] Plan generation response:', planRes.status, planData);

      if (!planRes.ok) {
        throw new Error(`Plan generation failed: ${planData.error || planRes.statusText}`);
      }

      console.log('[Onboarding] Success! Navigating to /today');
      setGenerating(false);
      router.push('/today');
      router.refresh();
    } catch (err) {
      console.error('[Onboarding] Error in handleFinish:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setGenerating(false);
    }
  }

  function next() {
    let newStep = step + 1;
    // Skip step 2 (sport balance) if only one sport
    if (newStep === 2 && !isMultiSport) newStep = 3;
    newStep = Math.min(newStep, TOTAL_STEPS - 1);
    setStep(newStep);
    saveProgress(newStep);
  }

  function prev() {
    let newStep = step - 1;
    if (newStep === 2 && !isMultiSport) newStep = 1;
    setStep(Math.max(0, newStep));
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  // Estimates for summary
  const weeksUntilFirstRace = selectedRaces.length > 0
    ? Math.max(4, Math.round((new Date(2027, selectedRaces[0].month - 1, 1).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : 17;
  const estimatedHours = Math.round(daysPerWeek * (sessionLength === '30-45' ? 0.6 : sessionLength === '45-60' ? 0.85 : sessionLength === '60-90' ? 1.25 : 1.75) * 10) / 10;

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side — branded gradient panel */}
      <div className="hidden md:flex md:w-1/2 lg:w-[45%] bg-gradient-to-br from-primary to-purple-700 items-center justify-center p-12 relative">
        <div className="text-white text-center">
          <div className="text-7xl mb-6">{STEP_TITLES[step]?.emoji}</div>
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight whitespace-pre-line">{STEP_TITLES[step]?.title}</h2>
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
        {/* Mobile progress */}
        <div className="md:hidden p-4 pb-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-semibold">Step {step + 1} of {TOTAL_STEPS}</span>
            <span className="text-xs text-primary font-semibold">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="md:hidden h-24 relative mx-4 mt-4 rounded-2xl overflow-hidden bg-gradient-to-r from-primary to-purple-700 flex items-center justify-center gap-3">
          <span className="text-3xl">{STEP_TITLES[step]?.emoji}</span>
          <span className="text-white font-extrabold text-lg">{STEP_TITLES[step]?.title.replace('\n', ' ')}</span>
        </div>

        <div className="flex-1 flex items-start justify-center px-4 py-6 md:py-12 md:px-12 lg:px-16">
          <div className="w-full max-w-md">

            {/* ============ Step 0 — Race Goal ============ */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">What are you training for?</h1>
                  <p className="text-muted-foreground mt-1">Pick from the race library or add your own. You can select multiple.</p>
                </div>

                {/* Klassiker bundle */}
                <button
                  onClick={selectKlassiker}
                  className={cn(
                    'w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4',
                    selectedRaces.length === 4 && selectedRaces.every(r => r.klassiker)
                      ? 'border-primary bg-primary/10'
                      : 'border-dashed border-primary/40 hover:border-primary hover:bg-primary/5'
                  )}
                >
                  <Sparkles className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <div className="font-bold text-sm">Svensk Klassiker</div>
                    <div className="text-xs text-muted-foreground">All 4: Vasaloppet, Vätternrundan, Vansbrosimningen, Lidingöloppet</div>
                  </div>
                </button>

                {/* Quick-pick popular races */}
                <div className="flex gap-2">
                  {QUICK_PICK_IDS.map(id => {
                    const race = getRaceById(id);
                    if (!race) return null;
                    const isSelected = selectedRaces.some(r => r.id === id);
                    return (
                      <button
                        key={id}
                        onClick={() => isSelected ? toggleRace(race) : selectQuickPick(id)}
                        className={cn(
                          'flex-1 text-left p-3 rounded-xl border transition-all flex items-center gap-2',
                          isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                        )}
                      >
                        <span className="text-lg">{SPORT_EMOJI[race.sport]}</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-xs truncate">{race.name}</div>
                          <div className="text-[10px] text-muted-foreground">{race.distanceKm}km</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected races */}
                {selectedRaces.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Selected races</Label>
                    {selectedRaces.map(race => (
                      <div key={race.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                        <span className="text-lg">{SPORT_EMOJI[race.sport]}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{race.name}</p>
                          <p className="text-xs text-muted-foreground">{race.distanceKm}km · {SPORT_LABELS[race.sport].en}</p>
                        </div>
                        <button onClick={() => toggleRace(race)} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Race search */}
                <div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={raceQuery}
                      onChange={e => { setRaceQuery(e.target.value); setRaceSearchOpen(true); }}
                      onFocus={() => { setRaceSearchOpen(true); searchRaces(raceQuery); }}
                      placeholder="Search races..."
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>

                  {raceSearchOpen && (
                    <div className="mt-2 rounded-xl border bg-card shadow-lg max-h-52 overflow-y-auto">
                      {filteredRaces.length === 0 ? (
                        <div className="p-3 text-center text-sm text-muted-foreground">No races found</div>
                      ) : (
                        filteredRaces.filter(r => !selectedRaces.find(s => s.id === r.id)).map(race => (
                          <button
                            key={race.id}
                            onClick={() => { toggleRace(race); setRaceSearchOpen(false); setRaceQuery(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted/50 transition-colors border-b last:border-0 flex items-center gap-3"
                          >
                            <span>{SPORT_EMOJI[race.sport]}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{race.name}</p>
                              <p className="text-xs text-muted-foreground">{race.country} · {race.distanceKm}km</p>
                            </div>
                            {race.klassiker && <Badge variant="secondary" className="text-[10px]">Klassiker</Badge>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Custom race entry */}
                {!showCustomForm ? (
                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline"
                  >
                    <Plus className="h-4 w-4" /> Add a custom race
                  </button>
                ) : (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <Input value={customRace.name} onChange={e => setCustomRace(p => ({ ...p, name: e.target.value }))} placeholder="Race name" className="h-10 rounded-xl" />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={customRace.sport}
                          onChange={e => setCustomRace(p => ({ ...p, sport: e.target.value as Sport }))}
                          className="h-10 rounded-xl border bg-background px-3 text-sm"
                        >
                          {Object.entries(SPORT_LABELS).filter(([k]) => k !== 'other').map(([k, v]) => (
                            <option key={k} value={k}>{v.en}</option>
                          ))}
                        </select>
                        <Input value={customRace.distance} onChange={e => setCustomRace(p => ({ ...p, distance: e.target.value }))} placeholder="Distance (km)" type="number" className="h-10 rounded-xl" />
                      </div>
                      <Input type="date" value={customRace.date} onChange={e => setCustomRace(p => ({ ...p, date: e.target.value }))} className="h-10 rounded-xl" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={addCustomRace} className="rounded-xl">Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowCustomForm(false)} className="rounded-xl">Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* ============ Step 1 — Current Fitness + PB ============ */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Where are you at?</h1>
                  <p className="text-muted-foreground mt-1">No wrong answers. We adjust everything to your level.</p>
                </div>

                {sportFitness.map(sf => (
                  <div key={sf.sport} className="space-y-3 p-4 rounded-2xl border">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{SPORT_EMOJI[sf.sport]}</span>
                      <span className="font-bold text-sm">{SPORT_LABELS[sf.sport].en}</span>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">Have you done this before?</Label>
                      <div className="grid grid-cols-3 gap-2 mt-1.5">
                        {([['never', 'Never'], ['some', 'Some experience'], ['regular', 'Done it regularly']] as const).map(([val, label]) => (
                          <button
                            key={val}
                            onClick={() => updateSportFitness(sf.sport, 'experience', val)}
                            className={cn(
                              'py-2 rounded-xl border text-xs font-semibold transition-all',
                              sf.experience === val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                            )}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    {sf.sport === 'cycling' && sf.experience !== 'never' && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">Weekly km</Label>
                        <Input
                          value={sf.abilityData['weekly_km'] || ''}
                          onChange={e => updateSportFitness(sf.sport, 'weekly_km', e.target.value)}
                          placeholder="50"
                          type="number"
                          className="mt-1 h-10 rounded-xl"
                        />
                      </div>
                    )}

                    {sf.sport === 'xc_skiing' && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">Have you skied before?</Label>
                        <div className="grid grid-cols-2 gap-2 mt-1.5">
                          {[['yes', 'Yes'], ['no', 'No']].map(([val, label]) => (
                            <button
                              key={val}
                              onClick={() => updateSportFitness(sf.sport, 'skied_before', val)}
                              className={cn(
                                'py-2 rounded-xl border text-xs font-semibold transition-all',
                                sf.abilityData['skied_before'] === val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                              )}
                            >{label}</button>
                          ))}
                        </div>
                      </div>
                    )}

                    {sf.sport === 'swimming' && sf.experience !== 'never' && (
                      <div>
                        <Label className="text-xs font-semibold text-muted-foreground">How far can you swim continuously? (meters)</Label>
                        <Input
                          value={sf.abilityData['continuous_meters'] || ''}
                          onChange={e => updateSportFitness(sf.sport, 'continuous_meters', e.target.value)}
                          placeholder="500"
                          type="number"
                          className="mt-1 h-10 rounded-xl"
                        />
                      </div>
                    )}
                  </div>
                ))}

                {/* Personal Best / Recent Time */}
                <div className="space-y-3 p-4 rounded-2xl border border-dashed">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-semibold">Do you have a recent race time?</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Optional — helps us calibrate your training paces</p>
                    </div>
                    {pbDistance && (
                      <button
                        onClick={() => { setPbDistance(null); setPbTime(''); }}
                        className="text-xs text-primary font-semibold hover:underline"
                      >
                        Skip
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {([['10k', '10K'], ['half_marathon', 'Half-marathon'], ['marathon', 'Marathon']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => { setPbDistance(val); setPbTime(''); }}
                        className={cn(
                          'py-2 rounded-xl border text-xs font-semibold transition-all',
                          pbDistance === val ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                        )}
                      >{label}</button>
                    ))}
                  </div>

                  {pbDistance && (
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground">
                        Your {pbDistance === '10k' ? '10K' : pbDistance === 'half_marathon' ? 'Half-marathon' : 'Marathon'} time
                        {' '}({pbDistance === '10k' ? 'MM:SS' : 'HH:MM:SS'})
                      </Label>
                      <Input
                        value={pbTime}
                        onChange={e => setPbTime(e.target.value)}
                        placeholder={pbDistance === '10k' ? '52:00' : pbDistance === 'half_marathon' ? '1:55:00' : '4:10:00'}
                        className="mt-1 h-10 rounded-xl"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============ Step 2 — Sport Balance (only if multi-sport) ============ */}
            {step === 2 && isMultiSport && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sport balance</h1>
                  <p className="text-muted-foreground mt-1">How do you want to split your training week?</p>
                </div>

                <div className="space-y-4">
                  {selectedSports.map(sport => (
                    <div key={sport} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span>{SPORT_EMOJI[sport]}</span>
                          <span className="text-sm font-semibold">{SPORT_LABELS[sport].en}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{sportWeights[sport] || 0}%</span>
                      </div>
                      <Slider
                        value={[sportWeights[sport] || 0]}
                        onValueChange={(val) => updateSportWeight(sport, Array.isArray(val) ? val[0] : val)}
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground bg-muted/50 rounded-xl p-3">
                  These weights guide how your weekly training volume is distributed. The AI adjusts priority automatically as each race approaches.
                </p>
              </div>
            )}

            {/* ============ Step 3 — Schedule ============ */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your schedule</h1>
                  <p className="text-muted-foreground mt-1">How does your week look?</p>
                </div>

                <div>
                  <Label className="text-sm font-semibold">
                    {primaryIsRunning ? 'How many days per week do you want to run?' : 'How many training days per week?'}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    {[3, 4, 5, 6].map(n => (
                      <button key={n} onClick={() => setDaysPerWeek(n)} className={cn(
                        'flex-1 py-3 rounded-xl border text-lg font-semibold transition-all',
                        daysPerWeek === n ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">
                    {primaryIsRunning ? 'Pick your preferred running days' : 'Pick your preferred training days'}
                  </Label>
                  <div className="grid grid-cols-7 gap-1.5">
                    {DAYS.map((d, i) => (
                      <button key={d} onClick={() => toggleDay(DAY_VALUES[i])} className={cn(
                        'py-3 rounded-xl border text-sm font-semibold transition-all',
                        availableDays.includes(DAY_VALUES[i]) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{d}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Preferred session length</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {[
                      { v: '30-45', l: '30–45 min' },
                      { v: '45-60', l: '45–60 min' },
                      { v: '60-90', l: '60–90 min' },
                      { v: '90+', l: '90 min+' },
                    ].map(opt => (
                      <button key={opt.v} onClick={() => setSessionLength(opt.v)} className={cn(
                        'py-2.5 rounded-xl border text-sm font-semibold transition-all',
                        sessionLength === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{opt.l}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold">When do you prefer to train?</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { v: 'morning', l: '🌅 Morning' },
                      { v: 'evening', l: '🌙 Evening' },
                      { v: 'any', l: 'No preference' },
                    ].map(opt => (
                      <button key={opt.v} onClick={() => setTimePreference(opt.v)} className={cn(
                        'py-2.5 rounded-xl border text-sm font-semibold transition-all',
                        timePreference === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                      )}>{opt.l}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============ Step 4 — Life Activities ============ */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your life</h1>
                  <p className="text-muted-foreground mt-1">What else is part of your weekly routine?</p>
                </div>

                <div className="space-y-3">
                  {[
                    { type: 'gym', emoji: '🏋️', label: 'Gym / strength training', desc: 'Reduces intensity before and after gym days' },
                    { type: 'team_sport', emoji: '⚽', label: 'Team sport', desc: 'We schedule around your team commitments' },
                    { type: 'demanding_work', emoji: '💼', label: 'Demanding work schedule', desc: 'Lighter weekday sessions, more on weekends' },
                    { type: 'regular_travel', emoji: '✈️', label: 'Regular travel', desc: 'Flexible plan for weeks when you travel' },
                    { type: 'recovery_priority', emoji: '😴', label: 'I prioritize recovery', desc: 'More rest days and lighter recovery weeks' },
                  ].map(item => {
                    const la = lifeActivities.find(l => l.type === item.type)!;
                    return (
                      <div key={item.type}>
                        <button
                          onClick={() => toggleLifeActivity(item.type)}
                          className={cn(
                            'w-full text-left p-4 rounded-xl border transition-all',
                            la.active ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{item.emoji}</span>
                            <div>
                              <div className="font-semibold text-sm">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.desc}</div>
                            </div>
                          </div>
                        </button>

                        {/* Gym follow-up: frequency + day picker */}
                        {la.active && item.type === 'gym' && (
                          <div className="mt-2 ml-12 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <Label className="text-xs text-muted-foreground">How many days per week?</Label>
                              <div className="flex gap-1.5 mt-1">
                                {[1, 2, 3, 4, 5].map(n => (
                                  <button key={n} onClick={() => updateLifeActivity('gym', 'frequency', n)} className={cn(
                                    'w-8 h-8 rounded-lg border text-xs font-bold',
                                    la.frequency === n ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                                  )}>{n}</button>
                                ))}
                              </div>
                            </div>
                            {la.frequency > 0 && (
                              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label className="text-xs text-muted-foreground">
                                  Which days do you typically train strength?
                                </Label>
                                {la.days.length !== la.frequency && (
                                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                    You picked {la.frequency} {la.frequency === 1 ? 'day' : 'days'}, select {la.frequency} below
                                  </p>
                                )}
                                <div className="flex gap-1 mt-1.5">
                                  {DAY_KEYS.map((dayKey, i) => (
                                    <button
                                      key={dayKey}
                                      onClick={() => toggleLifeActivityDay('gym', dayKey)}
                                      className={cn(
                                        'flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all',
                                        la.days.includes(dayKey)
                                          ? 'border-primary bg-primary/15 text-primary'
                                          : 'border-border/50 text-muted-foreground hover:border-primary/40'
                                      )}
                                    >
                                      {DAY_CHIPS_EN[i]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Team sport follow-up: sport name + frequency + day picker */}
                        {la.active && item.type === 'team_sport' && (
                          <div className="mt-2 ml-12 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div>
                              <Label className="text-xs text-muted-foreground">Which sport?</Label>
                              <Input
                                value={la.sportName}
                                onChange={e => updateLifeActivity('team_sport', 'sportName', e.target.value)}
                                placeholder="e.g. Football, Hockey..."
                                className="h-9 rounded-xl mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">How often per week?</Label>
                              <div className="flex gap-1.5 mt-1">
                                {[1, 2, 3].map(n => (
                                  <button key={n} onClick={() => updateLifeActivity('team_sport', 'frequency', n)} className={cn(
                                    'w-8 h-8 rounded-lg border text-xs font-bold',
                                    la.frequency === n ? 'border-primary bg-primary/10 text-primary' : 'border-border'
                                  )}>{n}</button>
                                ))}
                              </div>
                            </div>
                            {la.frequency > 0 && (
                              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                <Label className="text-xs text-muted-foreground">
                                  Which days do you usually play?
                                </Label>
                                {la.days.length !== la.frequency && (
                                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                    You picked {la.frequency} {la.frequency === 1 ? 'session' : 'sessions'}, select {la.frequency} below
                                  </p>
                                )}
                                <div className="flex gap-1 mt-1.5">
                                  {DAY_KEYS.map((dayKey, i) => (
                                    <button
                                      key={dayKey}
                                      onClick={() => toggleLifeActivityDay('team_sport', dayKey)}
                                      className={cn(
                                        'flex-1 py-1.5 rounded-lg border text-[10px] font-bold transition-all',
                                        la.days.includes(dayKey)
                                          ? 'border-primary bg-primary/15 text-primary'
                                          : 'border-border/50 text-muted-foreground hover:border-primary/40'
                                      )}
                                    >
                                      {DAY_CHIPS_EN[i]}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ============ Step 5 — Training Preferences ============ */}
            {step === 5 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">How do you like to train?</h1>
                  <p className="text-muted-foreground mt-1">This helps us calibrate intensity and weekly load.</p>
                </div>

                {/* Training volume */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Training volume</Label>
                  {([
                    { v: 'gradual' as const, emoji: '🐢', label: 'Gradual', desc: 'Build slowly, prioritize consistency' },
                    { v: 'steady' as const, emoji: '📈', label: 'Steady', desc: 'Moderate week-on-week progression' },
                    { v: 'progressive' as const, emoji: '🚀', label: 'Progressive', desc: 'Push the volume, faster build-up' },
                  ]).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setTrainingVolume(opt.v)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4',
                        trainingVolume === opt.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Difficulty */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Difficulty</Label>
                  {([
                    { v: 'comfortable' as const, emoji: '😌', label: 'Comfortable', desc: 'Stay in control, avoid red-lining' },
                    { v: 'balanced' as const, emoji: '⚖️', label: 'Balanced', desc: 'Mix of easy and hard efforts' },
                    { v: 'challenging' as const, emoji: '🔥', label: 'Challenging', desc: 'Push limits, embrace discomfort' },
                  ]).map(opt => (
                    <button
                      key={opt.v}
                      onClick={() => setTrainingDifficulty(opt.v)}
                      className={cn(
                        'w-full text-left p-4 rounded-xl border transition-all flex items-center gap-4',
                        trainingDifficulty === opt.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ============ Step 6 — Plan Summary & Generate ============ */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Your plan overview</h1>
                  <p className="text-muted-foreground mt-1">Here's what we've built for you</p>
                </div>

                <div className="rounded-2xl bg-card border p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Races</span>
                    <span className="font-semibold text-right max-w-[60%] truncate">{selectedRaces.map(r => r.name).join(', ') || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Weeks until first race</span>
                    <span className="font-semibold">{weeksUntilFirstRace}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sessions per week</span>
                    <span className="font-semibold">{daysPerWeek}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Estimated weekly hours</span>
                    <span className="font-semibold">~{estimatedHours}h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Volume approach</span>
                    <span className="font-semibold capitalize">{trainingVolume}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-semibold capitalize">{trainingDifficulty}</span>
                  </div>
                  {isMultiSport && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sports</span>
                      <span className="font-semibold">{selectedSports.map(s => SPORT_EMOJI[s]).join(' ')}</span>
                    </div>
                  )}
                  {pbDistance && pbTime && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recent race time</span>
                      <span className="font-semibold">{pbDistance === '10k' ? '10K' : pbDistance === 'half_marathon' ? 'Half-marathon' : 'Marathon'}: {pbTime}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Trophy className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Your AI coach is ready</p>
                      <p className="text-xs text-muted-foreground mt-1">Every Sunday I'll check in with a recap of your week and propose the next one. You're always in control — accept, tweak, or override.</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive font-medium">{error}</p>
                  </div>
                )}

                <Button className="w-full h-12 rounded-xl text-base font-semibold" size="lg" onClick={handleFinish} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Building your plan...
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
                <Button onClick={next} disabled={step === 0 && selectedRaces.length === 0} className="rounded-xl">
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

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { LogOut, Palette, Link2, RefreshCw, User, ChevronRight, Loader2, Globe, ClipboardList } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import { SPORT_LABELS, SPORT_EMOJI, getRaceById, type Sport } from '@/lib/races';
import type { UserProfile, UserRace, UserSport, LifeActivity } from '@/types/database';

interface TrainingSummary {
  races: { name: string; sport: Sport; distanceKm: number }[];
  sports: { sport: Sport; experience: string; weight: number }[];
  lifeActivities: { type: string; frequency: number }[];
  daysPerWeek: number | null;
  sessionLength: string | null;
  timePreference: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [summary, setSummary] = useState<TrainingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { language, setLanguage, t } = useLanguage();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    const [profileRes, racesRes, sportsRes, activitiesRes] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('user_sports').select('*').eq('user_id', user.id),
      supabase.from('life_activities').select('*').eq('user_id', user.id).eq('active', true),
    ]);

    setProfile(profileRes.data);

    // Build summary
    const races = (racesRes.data || []).map((ur: UserRace) => {
      if (ur.is_custom) {
        return { name: ur.custom_name || 'Custom', sport: (ur.custom_sport || 'running') as Sport, distanceKm: ur.custom_distance_km || 0 };
      }
      const race = ur.race_id ? getRaceById(ur.race_id) : null;
      return race
        ? { name: race.name, sport: race.sport, distanceKm: race.distanceKm }
        : { name: ur.race_id || 'Unknown', sport: 'running' as Sport, distanceKm: 0 };
    });

    const sports = (sportsRes.data || []).map((us: UserSport) => ({
      sport: us.sport as Sport,
      experience: us.experience_level,
      weight: us.priority_weight,
    }));

    const lifeActivities = (activitiesRes.data || []).map((la: LifeActivity) => ({
      type: la.activity_type,
      frequency: la.frequency,
    }));

    setSummary({
      races,
      sports,
      lifeActivities,
      daysPerWeek: profileRes.data?.runs_per_week || null,
      sessionLength: profileRes.data?.preferred_session_length || null,
      timePreference: profileRes.data?.time_preference || null,
    });

    setLoading(false);
  }

  async function handleDarkModeChange(mode: 'light' | 'dark') {
    if (!profile) return;
    setProfile({ ...profile, dark_mode: mode });
    await supabase.from('user_profiles').update({ dark_mode: mode }).eq('id', profile.id);
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  function handleRedoOnboarding() {
    setShowConfirm(true);
  }

  async function confirmRedoOnboarding() {
    setShowConfirm(false);
    if (!profile) return;

    // Reset onboarding state so the wizard starts fresh but with pre-filled data
    await supabase.from('user_profiles').update({
      onboarding_completed: false,
      onboarding_step: 0,
    }).eq('id', profile.id);

    router.push('/onboarding');
  }

  const sv = language === 'sv';

  const LIFE_ACTIVITY_LABELS: Record<string, { en: string; sv: string }> = {
    gym: { en: 'Gym', sv: 'Gym' },
    team_sport: { en: 'Team sport', sv: 'Lagsport' },
    demanding_work: { en: 'Demanding work', sv: 'Krävande jobb' },
    regular_travel: { en: 'Regular travel', sv: 'Reser regelbundet' },
    recovery_priority: { en: 'Recovery priority', sv: 'Vila prioriterat' },
  };

  const EXPERIENCE_LABELS: Record<string, { en: string; sv: string }> = {
    never: { en: 'Beginner', sv: 'Nybörjare' },
    some: { en: 'Some experience', sv: 'Viss erfarenhet' },
    regular: { en: 'Experienced', sv: 'Erfaren' },
  };

  if (loading || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">{sv ? 'Laddar...' : 'Loading...'}</div></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24 space-y-4">
      <h1 className="text-2xl font-bold">{sv ? 'Profil' : 'Profile'}</h1>

      {/* Profile info */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> {sv ? 'Om dig' : 'About you'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{sv ? 'Namn' : 'Name'}</span><span>{profile.full_name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{profile.email}</span></div>
          {profile.age && <div className="flex justify-between"><span className="text-muted-foreground">{sv ? 'Ålder' : 'Age'}</span><span>{profile.age}</span></div>}
        </CardContent>
      </Card>

      {/* Training plan summary */}
      {summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> {sv ? 'Din träningsplan' : 'Your training plan'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {summary.races.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{sv ? 'Lopp' : 'Races'}</span>
                <span className="text-right max-w-[60%]">
                  {summary.races.map(r => `${SPORT_EMOJI[r.sport]} ${r.name}`).join(', ')}
                </span>
              </div>
            )}
            {summary.sports.length > 0 && summary.sports.map(s => (
              <div key={s.sport} className="flex justify-between">
                <span className="text-muted-foreground">{SPORT_LABELS[s.sport]?.[language] || s.sport}</span>
                <span>{EXPERIENCE_LABELS[s.experience]?.[language] || s.experience} · {s.weight}%</span>
              </div>
            ))}
            {summary.daysPerWeek && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{sv ? 'Dagar per vecka' : 'Days per week'}</span>
                <span>{summary.daysPerWeek}</span>
              </div>
            )}
            {summary.sessionLength && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{sv ? 'Passlängd' : 'Session length'}</span>
                <span>{summary.sessionLength} min</span>
              </div>
            )}
            {summary.timePreference && summary.timePreference !== 'any' && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{sv ? 'Föredrar' : 'Prefers'}</span>
                <span className="capitalize">{summary.timePreference === 'morning' ? (sv ? 'Morgon' : 'Morning') : (sv ? 'Kväll' : 'Evening')}</span>
              </div>
            )}
            {summary.lifeActivities.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{sv ? 'Övriga aktiviteter' : 'Life activities'}</span>
                <span>{summary.lifeActivities.map(la => LIFE_ACTIVITY_LABELS[la.type]?.[language] || la.type).join(', ')}</span>
              </div>
            )}

            <Separator className="my-2" />

            <Button variant="outline" className="w-full" onClick={handleRedoOnboarding}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {sv ? 'Uppdatera din plan' : 'Update your plan'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {sv ? 'Gå igenom onboardingen igen för att uppdatera dina mål och inställningar.' : 'Re-run onboarding to update your goals and preferences.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Language */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Globe className="h-4 w-4" /> {sv ? 'Språk' : 'Language'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={language === 'sv' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('sv')}
              className="flex-1"
            >
              🇸🇪 Svenska
            </Button>
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setLanguage('en')}
              className="flex-1"
            >
              🇬🇧 English
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> {sv ? 'Utseende' : 'Appearance'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['light', 'dark'] as const).map(mode => (
              <Button key={mode} variant={(profile.dark_mode === mode || (profile.dark_mode === 'system' && mode === 'dark')) ? 'default' : 'outline'} size="sm" onClick={() => handleDarkModeChange(mode)} className="flex-1 capitalize">
                {mode === 'light' ? (sv ? 'Ljust' : 'Light') : (sv ? 'Mörkt' : 'Dark')}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strava */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> Strava</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.strava_connected ? (
            <div className="flex items-center justify-between">
              <Badge className="bg-orange-500">{sv ? 'Ansluten' : 'Connected'}</Badge>
              <span className="text-xs text-muted-foreground">Athlete ID: {profile.strava_athlete_id}</span>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api/strava/connect'}>
              {sv ? 'Anslut Strava' : 'Connect Strava'}
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> {sv ? 'Logga ut' : 'Sign out'}
      </Button>

      {/* Confirm redo dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sv ? 'Uppdatera din plan?' : 'Update your plan?'}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {sv
              ? 'Du kommer gå igenom onboardingen igen. När du är klar ersätts din nuvarande plan med en ny baserad på dina uppdaterade svar.'
              : 'This will take you through onboarding again. When you finish, your current plan will be replaced with a new one based on your updated answers.'}
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowConfirm(false)}>{sv ? 'Avbryt' : 'Cancel'}</Button>
            <Button onClick={confirmRedoOnboarding}>{sv ? 'Fortsätt' : 'Continue'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

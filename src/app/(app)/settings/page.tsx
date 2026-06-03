'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LogOut, Palette, Link2, RefreshCw, User } from 'lucide-react';
import type { UserProfile } from '@/types/database';

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }
      const { data } = await supabase.from('user_profiles').select('*').eq('id', user.id).single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleDarkModeChange(mode: 'system' | 'light' | 'dark') {
    if (!profile) return;
    setProfile({ ...profile, dark_mode: mode });
    await supabase.from('user_profiles').update({ dark_mode: mode }).eq('id', profile.id);
    if (mode === 'dark') document.documentElement.classList.add('dark');
    else if (mode === 'light') document.documentElement.classList.remove('dark');
    else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  async function handleRegeneratePlan() {
    setRegenerating(true);
    await fetch('/api/plan/generate', { method: 'POST' });
    setRegenerating(false);
  }

  if (loading || !profile) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading…</div></div>;
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{profile.full_name || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{profile.email}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Age</span><span>{profile.age || '—'}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Weekly mileage</span><span>{profile.current_weekly_mileage_km}km</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Runs/week</span><span>{profile.runs_per_week}</span></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as const).map(mode => (
              <Button key={mode} variant={profile.dark_mode === mode ? 'default' : 'outline'} size="sm" onClick={() => handleDarkModeChange(mode)} className="flex-1 capitalize">{mode}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Link2 className="h-4 w-4" /> Strava</CardTitle>
        </CardHeader>
        <CardContent>
          {profile.strava_connected ? (
            <div className="flex items-center justify-between">
              <Badge className="bg-orange-500">Connected</Badge>
              <span className="text-xs text-muted-foreground">Athlete ID: {profile.strava_athlete_id}</span>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/api/strava/connect'}>
              Connect Strava
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleRegeneratePlan} disabled={regenerating}>
            {regenerating ? 'Regenerating…' : 'Regenerate training plan'}
          </Button>
          <p className="text-xs text-muted-foreground mt-2">This will replace your current plan with a fresh one based on your profile.</p>
        </CardContent>
      </Card>

      <Separator />

      <Button variant="destructive" className="w-full" onClick={handleLogout}>
        <LogOut className="h-4 w-4 mr-2" /> Sign out
      </Button>
    </div>
  );
}

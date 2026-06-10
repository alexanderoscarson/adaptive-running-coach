'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, Calendar, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RACES, SPORT_EMOJI, SPORT_LABELS, searchRaces as searchLibrary, type Race, type Sport } from '@/lib/races';
import { useLanguage } from '@/lib/language-context';

interface UserRaceRow {
  id: string;
  race_id: string | null;
  custom_name: string | null;
  custom_sport: string | null;
  custom_distance_km: number | null;
  target_date: string | null;
  is_custom: boolean;
}

interface GoalRow {
  id: string;
  race_distance: string | null;
  race_date: string | null;
}

export default function RacesPage() {
  const supabase = createClient();
  const [userRaces, setUserRaces] = useState<UserRaceRow[]>([]);
  const [goalFallback, setGoalFallback] = useState<GoalRow | null>(null);
  const [query, setQuery] = useState('');
  const [sportFilter, setSportFilter] = useState<Sport | ''>('');
  const [showLibrary, setShowLibrary] = useState(false);
  const { language } = useLanguage();
  const sv = language === 'sv';

  useEffect(() => {
    loadUserRaces();
  }, []);

  async function loadUserRaces() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const [racesRes, goalRes] = await Promise.all([
      supabase.from('user_races').select('*').eq('user_id', user.id).eq('active', true),
      supabase.from('goals').select('id, race_distance, race_date').eq('user_id', user.id).eq('active', true).order('created_at', { ascending: false }).limit(1).single(),
    ]);
    if (racesRes.data && racesRes.data.length > 0) {
      setUserRaces(racesRes.data);
    } else if (goalRes.data?.race_distance) {
      // Fallback: show the goal as a race even if user_races is empty (FK failure)
      setGoalFallback(goalRes.data);
    }
  }

  async function addRace(race: Race) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('user_races').insert({
      user_id: user.id,
      race_id: race.id,
      is_custom: false,
    });
    loadUserRaces();
  }

  async function removeRace(id: string) {
    await supabase.from('user_races').update({ active: false }).eq('id', id);
    loadUserRaces();
  }

  function getRaceDetails(ur: UserRaceRow): { name: string; sport: Sport; distance: number; emoji: string } {
    // Try library lookup first
    if (ur.race_id) {
      const race = RACES.find(r => r.id === ur.race_id);
      if (race) return { name: race.name, sport: race.sport, distance: race.distanceKm, emoji: SPORT_EMOJI[race.sport] };
    }
    // Fallback to custom fields (always populated since onboarding fix)
    const sport = (ur.custom_sport || 'running') as Sport;
    return { name: ur.custom_name || 'Unknown race', sport, distance: ur.custom_distance_km || 0, emoji: SPORT_EMOJI[sport] || '🏃' };
  }

  const libraryResults = searchLibrary(query, sportFilter || undefined);
  const userRaceIds = new Set(userRaces.map(ur => ur.race_id));

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{sv ? 'Lopp' : 'Races'}</h1>
        <p className="text-muted-foreground mt-1">{sv ? 'Dina mål och loppbiblioteket' : 'Your goal races and the race library'}</p>
      </div>

      {/* User's races */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{sv ? 'Dina lopp' : 'Your races'}</h2>
        {userRaces.length === 0 && !goalFallback ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{sv ? 'Inga lopp ännu. Bläddra i biblioteket nedan.' : 'No races yet. Browse the library below to add one.'}</p>
            </CardContent>
          </Card>
        ) : userRaces.length === 0 && goalFallback ? (
          /* Show goal as fallback race card */
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <span className="text-2xl">🏃</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {({ '5k': '5K', '10k': '10K', 'half_marathon': 'Half Marathon', 'marathon': 'Marathon' } as Record<string, string>)[goalFallback.race_distance || ''] || goalFallback.race_distance || 'Race'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {({ '5k': 5, '10k': 10, 'half_marathon': 21.1, 'marathon': 42.2 } as Record<string, number>)[goalFallback.race_distance || ''] || 0}km · Running
                  {goalFallback.race_date && <> · <Calendar className="inline h-3 w-3 mx-0.5" />{goalFallback.race_date}</>}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          userRaces.map(ur => {
            const details = getRaceDetails(ur);
            return (
              <Card key={ur.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">{details.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{details.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {details.distance}km · {SPORT_LABELS[details.sport][language]}
                      {ur.target_date && <> · <Calendar className="inline h-3 w-3 mx-0.5" />{ur.target_date}</>}
                    </p>
                  </div>
                  <button onClick={() => removeRace(ur.id)} className="text-muted-foreground hover:text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Race library */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{sv ? 'Loppbibliotek' : 'Race library'}</h2>
          <Button size="sm" variant="outline" onClick={() => setShowLibrary(!showLibrary)} className="rounded-xl text-xs">
            {showLibrary ? (sv ? 'Dölj' : 'Hide') : (sv ? 'Bläddra' : 'Browse')}
          </Button>
        </div>

        {showLibrary && (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={sv ? 'Sök lopp...' : 'Search races...'}
                  className="pl-10 h-10 rounded-xl"
                />
              </div>
              <select
                value={sportFilter}
                onChange={e => setSportFilter(e.target.value as Sport | '')}
                className="h-10 rounded-xl border bg-background px-3 text-sm"
              >
                <option value="">{sv ? 'Alla sporter' : 'All sports'}</option>
                {Object.entries(SPORT_LABELS).filter(([k]) => k !== 'other').map(([k, v]) => (
                  <option key={k} value={k}>{v[language]}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 max-h-96 overflow-y-auto">
              {libraryResults.map(race => {
                const alreadyAdded = userRaceIds.has(race.id);
                return (
                  <button
                    key={race.id}
                    onClick={() => !alreadyAdded && addRace(race)}
                    disabled={alreadyAdded}
                    className={cn(
                      'w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center gap-3',
                      alreadyAdded ? 'opacity-50 cursor-not-allowed bg-muted/30' : 'hover:bg-muted/50 hover:border-primary/30'
                    )}
                  >
                    <span>{SPORT_EMOJI[race.sport]}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{race.name}</p>
                      <p className="text-xs text-muted-foreground">{race.country} · {race.distanceKm}km · {SPORT_LABELS[race.sport][language]}</p>
                    </div>
                    {race.klassiker && <Badge variant="secondary" className="text-[10px]">Klassiker</Badge>}
                    {alreadyAdded && <Badge variant="outline" className="text-[10px]">{sv ? 'Tillagd' : 'Added'}</Badge>}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

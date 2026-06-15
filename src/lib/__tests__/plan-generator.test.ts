import { describe, it, expect } from 'vitest';
import { generatePlan, getPhaseDistribution } from '@/lib/plan-generator';
import type { UserProfile, Goal, Constraint, LifeActivity } from '@/types/database';

function mockProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'test-user',
    email: 'test@test.com',
    full_name: 'Test Runner',
    age: 30,
    gender: 'male',
    max_hr: 190,
    resting_hr: 55,
    current_weekly_mileage_km: 35,
    runs_per_week: 4,
    available_days: [1, 3, 5, 6],
    preferred_long_run_day: 6,
    strength_preference: 'none',
    coach_mode: 'suggest',
    onboarding_completed: true,
    onboarding_step: 10,
    dark_mode: 'system',
    preferred_session_length: '45-60',
    time_preference: 'morning',
    language: 'en',
    strava_connected: false,
    strava_athlete_id: null,
    strava_access_token: null,
    strava_refresh_token: null,
    strava_token_expires_at: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    ...overrides,
  };
}

function mockGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'test-goal',
    user_id: 'test-user',
    type: 'race',
    race_distance: 'half_marathon',
    target_time_seconds: null,
    race_date: '2025-06-01',
    baseline_5k_seconds: null,
    baseline_10k_seconds: 2700,
    baseline_half_seconds: null,
    baseline_marathon_seconds: null,
    plan_weeks: 17,
    active: true,
    created_at: '2024-01-01',
    ...overrides,
  };
}

const emptyConstraints: Constraint[] = [];
const emptyActivities: LifeActivity[] = [];

describe('Plan Generator', () => {
  describe('VARIETY: quality sessions differ across build phase', () => {
    it('produces at least 4 distinct quality-session titles in build phase', () => {
      const plan = generatePlan(mockProfile(), mockGoal(), emptyConstraints, emptyActivities);

      const buildWeeks = plan.filter(w => w.phase === 'build' && !w.isRecovery);
      const qualityTitles = new Set<string>();
      for (const week of buildWeeks) {
        for (const session of week.sessions) {
          if (session.type === 'tempo' || session.type === 'intervals') {
            qualityTitles.add(session.title);
          }
        }
      }

      expect(qualityTitles.size).toBeGreaterThanOrEqual(4);
    });

    it('long runs vary in build/peak phases', () => {
      const plan = generatePlan(mockProfile(), mockGoal(), emptyConstraints, emptyActivities);

      const advancedWeeks = plan.filter(
        w => (w.phase === 'build' || w.phase === 'peak') && !w.isRecovery
      );
      const longRunTitles = new Set<string>();
      for (const week of advancedWeeks) {
        for (const session of week.sessions) {
          if (session.type === 'long') {
            longRunTitles.add(session.title);
          }
        }
      }

      expect(longRunTitles.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('SAWTOOTH: volume progression within phases', () => {
    it('has strictly increasing loading weeks within a build cycle, followed by recovery drop', () => {
      const plan = generatePlan(mockProfile(), mockGoal(), emptyConstraints, emptyActivities);

      const buildWeeks = plan.filter(w => w.phase === 'build');
      if (buildWeeks.length < 4) return;

      let foundSawtooth = false;
      for (let i = 0; i <= buildWeeks.length - 4; i++) {
        const w0 = buildWeeks[i];
        const w1 = buildWeeks[i + 1];
        const w2 = buildWeeks[i + 2];
        const w3 = buildWeeks[i + 3];

        if (!w0.isRecovery && !w1.isRecovery && !w2.isRecovery && w3.isRecovery) {
          if (w0.totalDistanceKm < w1.totalDistanceKm &&
              w1.totalDistanceKm < w2.totalDistanceKm &&
              w3.totalDistanceKm < w2.totalDistanceKm) {
            foundSawtooth = true;
            break;
          }
        }
      }

      expect(foundSawtooth).toBe(true);
    });
  });

  describe('GUARDRAIL: no excessive week-over-week increases', () => {
    it('week-over-week increase never exceeds 11% outside recovery rebounds', () => {
      const plan = generatePlan(mockProfile(), mockGoal(), emptyConstraints, emptyActivities);

      for (let i = 1; i < plan.length; i++) {
        const prev = plan[i - 1];
        const curr = plan[i];
        if (prev.isRecovery || prev.totalDistanceKm === 0) continue;
        if (curr.phase === 'race') continue;

        const increase = (curr.totalDistanceKm - prev.totalDistanceKm) / prev.totalDistanceKm;
        expect(increase).toBeLessThanOrEqual(0.11);
      }
    });
  });

  describe('RACE-AWARE PHASES: different distributions by race distance', () => {
    it('marathon has more base weeks than 5k for same plan length', () => {
      const fiveKPhases = getPhaseDistribution(12, '5k');
      const marathonPhases = getPhaseDistribution(12, 'marathon');

      const fiveKBase = fiveKPhases.find(p => p.phase === 'base')!.weeks;
      const marathonBase = marathonPhases.find(p => p.phase === 'base')!.weeks;

      expect(marathonBase).toBeGreaterThan(fiveKBase);
    });

    it('5k and marathon produce different phase distributions', () => {
      const fiveKPhases = getPhaseDistribution(12, '5k');
      const marathonPhases = getPhaseDistribution(12, 'marathon');

      const fiveKWeeks = fiveKPhases.map(p => p.weeks);
      const marathonWeeks = marathonPhases.map(p => p.weeks);

      expect(fiveKWeeks).not.toEqual(marathonWeeks);
    });
  });

  describe('REGRESSION: basic plan structure', () => {
    it('generates the correct number of weeks', () => {
      const plan = generatePlan(mockProfile(), mockGoal({ plan_weeks: 17 }), emptyConstraints, emptyActivities);
      expect(plan).toHaveLength(17);
    });

    it('each week has at least one session', () => {
      const plan = generatePlan(mockProfile(), mockGoal(), emptyConstraints, emptyActivities);
      for (const week of plan) {
        expect(week.sessions.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('run count per week never exceeds runs_per_week (except race week)', () => {
      const profile = mockProfile({ runs_per_week: 4 });
      const plan = generatePlan(profile, mockGoal(), emptyConstraints, emptyActivities);

      const runTypes = ['easy', 'long', 'tempo', 'intervals', 'hills', 'recovery', 'race'];
      for (const week of plan) {
        const runCount = week.sessions.filter(s => runTypes.includes(s.type)).length;
        if (week.phase === 'race') continue;
        expect(runCount).toBeLessThanOrEqual(4);
      }
    });

    it('generates plans for different race distances without errors', () => {
      for (const dist of ['5k', '10k', 'half_marathon', 'marathon'] as const) {
        const plan = generatePlan(
          mockProfile(),
          mockGoal({ race_distance: dist, plan_weeks: 12 }),
          emptyConstraints,
          emptyActivities,
        );
        expect(plan).toHaveLength(12);
      }
    });
  });
});

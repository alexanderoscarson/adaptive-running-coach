import { describe, it, expect } from 'vitest';
import {
  validatePlanProgression,
  validateSessionVariety,
  containsInstructionLeak,
  generateCoachIntro,
  type ValidatableWeek,
  type ValidatableSession,
} from './plan-validation';

// ─── Fixtures ───────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<ValidatableSession> = {}): ValidatableSession {
  return {
    type: 'easy',
    title: 'Easy Run',
    description: 'Easy run at conversational pace.',
    distanceKm: 5,
    dayOfWeek: 1,
    ...overrides,
  };
}

function makeWeek(overrides: Partial<ValidatableWeek> & { weekNumber: number }): ValidatableWeek {
  return {
    phase: 'base',
    totalDistanceKm: 20,
    isRecovery: false,
    sessions: [
      makeSession({ type: 'easy', distanceKm: 5, dayOfWeek: 1 }),
      makeSession({ type: 'long', title: 'Long Run', distanceKm: 10, dayOfWeek: 6 }),
      makeSession({ type: 'easy', distanceKm: 5, dayOfWeek: 3 }),
    ],
    ...overrides,
  };
}

// ─── validatePlanProgression ────────────────────────────────────────────────

describe('validatePlanProgression', () => {
  it('clamps a week that exceeds the prior week by >10%', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 20 }),
      makeWeek({ weekNumber: 2, totalDistanceKm: 25 }), // 25% increase → should clamp
    ];

    const corrections = validatePlanProgression(plan);

    expect(corrections).toHaveLength(1);
    expect(corrections[0].weekNumber).toBe(2);
    expect(corrections[0].originalKm).toBe(25);
    expect(corrections[0].correctedKm).toBe(22); // 20 * 1.10 = 22.0
    expect(plan[1].totalDistanceKm).toBe(22);
  });

  it('passes a compliant plan through unchanged', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 20 }),
      makeWeek({ weekNumber: 2, totalDistanceKm: 21 }), // 5% increase — fine
      makeWeek({ weekNumber: 3, totalDistanceKm: 23 }), // 9.5% increase — fine
    ];

    const corrections = validatePlanProgression(plan);

    expect(corrections).toHaveLength(0);
    expect(plan[1].totalDistanceKm).toBe(21);
    expect(plan[2].totalDistanceKm).toBe(23);
  });

  it('clamps the specific week 4=16km → week 5=32km case to 17.6km', () => {
    // Build a fixture where week 4 = 16km is reachable within the 10% rule
    // so the week 5 clamp is computed against 16km
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 13.2 }),
      makeWeek({ weekNumber: 2, totalDistanceKm: 14.5 }),
      makeWeek({ weekNumber: 3, totalDistanceKm: 15 }),
      makeWeek({
        weekNumber: 4,
        totalDistanceKm: 16,
        sessions: [
          makeSession({ type: 'easy', distanceKm: 4, dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', distanceKm: 8, dayOfWeek: 6 }),
          makeSession({ type: 'easy', distanceKm: 4, dayOfWeek: 3 }),
        ],
      }),
      makeWeek({
        weekNumber: 5,
        totalDistanceKm: 32,
        sessions: [
          makeSession({ type: 'easy', distanceKm: 8, dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', distanceKm: 16, dayOfWeek: 6 }),
          makeSession({ type: 'easy', distanceKm: 8, dayOfWeek: 3 }),
        ],
      }),
    ];

    const corrections = validatePlanProgression(plan);

    const week5Correction = corrections.find(c => c.weekNumber === 5);
    expect(week5Correction).toBeDefined();
    expect(week5Correction!.originalKm).toBe(32);
    // 16 * 1.10 = 17.6
    expect(week5Correction!.correctedKm).toBe(17.6);
    expect(plan[4].totalDistanceKm).toBe(17.6);
  });

  it('rescales session distances proportionally when clamping, summing to the corrected total within rounding tolerance', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 20 }),
      makeWeek({
        weekNumber: 2,
        totalDistanceKm: 30, // 50% increase → clamp to 22
        sessions: [
          makeSession({ type: 'easy', distanceKm: 6, dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', distanceKm: 15, dayOfWeek: 6 }),
          makeSession({ type: 'tempo', title: 'Tempo Run', distanceKm: 9, dayOfWeek: 3 }),
        ],
      }),
    ];

    validatePlanProgression(plan);

    const sessionSum = plan[1].sessions
      .filter(s => s.distanceKm != null)
      .reduce((sum, s) => sum + s.distanceKm!, 0);

    // Allow 0.5km rounding tolerance
    expect(Math.abs(sessionSum - plan[1].totalDistanceKm)).toBeLessThan(0.5);
  });

  it('allows a recovery week to drop ~30% below the prior week without flagging', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 30 }),
      makeWeek({ weekNumber: 2, totalDistanceKm: 21, isRecovery: true }), // 30% drop — should NOT be flagged
      makeWeek({ weekNumber: 3, totalDistanceKm: 33 }), // 10% over week 1 (reference) = 33
    ];

    const corrections = validatePlanProgression(plan);

    expect(corrections).toHaveLength(0);
  });

  it('handles a single-week plan without throwing', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 20 }),
    ];

    const corrections = validatePlanProgression(plan);
    expect(corrections).toHaveLength(0);
  });

  it('handles a week with zero/empty sessions without throwing', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({ weekNumber: 1, totalDistanceKm: 20 }),
      makeWeek({ weekNumber: 2, totalDistanceKm: 0, sessions: [] }),
      makeWeek({ weekNumber: 3, totalDistanceKm: 15, sessions: [] }),
    ];

    expect(() => validatePlanProgression(plan)).not.toThrow();
  });
});

// ─── validateSessionVariety ─────────────────────────────────────────────────

describe('validateSessionVariety', () => {
  it('flags a Build week containing only Easy Run labels', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 5,
        phase: 'build',
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 1 }),
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 3 }),
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 5 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures.length).toBeGreaterThanOrEqual(1);
    expect(failures[0].weekNumber).toBe(5);
    expect(failures[0].phase).toBe('build');
  });

  it('flags a Peak week containing only Easy Run labels', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 10,
        phase: 'peak',
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 1 }),
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 3 }),
          makeSession({ type: 'recovery', title: 'Recovery Run', dayOfWeek: 5 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures.length).toBeGreaterThanOrEqual(1);
  });

  it('passes a Build week with appropriate type variety', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 5,
        phase: 'build',
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', dayOfWeek: 6 }),
          makeSession({ type: 'tempo', title: 'Tempo Run', dayOfWeek: 3 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures).toHaveLength(0);
  });

  it('passes a Base week with easy + long variety', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 2,
        phase: 'base',
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', dayOfWeek: 6 }),
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 3 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures).toHaveLength(0);
  });

  it('ensures each session has a non-empty type and description', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 3,
        phase: 'build',
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', description: '', dayOfWeek: 1 }),
          makeSession({ type: 'long', title: 'Long Run', dayOfWeek: 6 }),
          makeSession({ type: 'tempo', title: 'Tempo Run', dayOfWeek: 3 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures.length).toBeGreaterThanOrEqual(1);
    expect(failures.some(f => f.reason.includes('missing type or description'))).toBe(true);
  });

  it('skips recovery weeks from variety checks', () => {
    const plan: ValidatableWeek[] = [
      makeWeek({
        weekNumber: 4,
        phase: 'build',
        isRecovery: true,
        sessions: [
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 1 }),
          makeSession({ type: 'easy', title: 'Easy Run', dayOfWeek: 3 }),
        ],
      }),
    ];

    const failures = validateSessionVariety(plan);
    expect(failures).toHaveLength(0);
  });
});

// ─── containsInstructionLeak ────────────────────────────────────────────────

describe('containsInstructionLeak', () => {
  it('detects zone percentage tables in text', () => {
    expect(containsInstructionLeak(
      'Z1 (Recovery) < 80% threshold, Z2 (Easy) 80–88%'
    )).toBe(true);
  });

  it('detects "non-negotiable" distribution language', () => {
    expect(containsInstructionLeak(
      'This 80/20 distribution is non-negotiable.'
    )).toBe(true);
  });

  it('detects "The athlete has selected" language', () => {
    expect(containsInstructionLeak(
      'The athlete has selected exactly 3 run sessions per week.'
    )).toBe(true);
  });

  it('detects "5-second increments" instruction', () => {
    expect(containsInstructionLeak(
      'All paces in whole 5-second increments'
    )).toBe(true);
  });

  it('detects periodized structure instructions', () => {
    expect(containsInstructionLeak(
      'following a periodized structure: Base phase (aerobic foundation)'
    )).toBe(true);
  });

  it('passes clean user-facing text', () => {
    expect(containsInstructionLeak(
      "Here's your 17-week plan for Lidingoloppet. You'll run 3 times per week with paces built around 5:45/km."
    )).toBe(false);
  });

  it('passes normal coaching language', () => {
    expect(containsInstructionLeak(
      'The plan builds gradually from easy aerobic running toward race-specific intensity closer to race day.'
    )).toBe(false);
  });
});

// ─── generateCoachIntro ─────────────────────────────────────────────────────

describe('generateCoachIntro', () => {
  it('generates a clean English intro without instruction leaks', () => {
    const intro = generateCoachIntro({
      raceName: 'Lidingoloppet',
      totalWeeks: 17,
      runsPerWeek: 3,
      thresholdPace: '5:45',
      activityClause: "I've spread your sessions across the week to balance training and recovery.",
    });

    expect(intro).toContain('Lidingoloppet');
    expect(intro).toContain('17-week');
    expect(intro).toContain('3 times per week');
    expect(containsInstructionLeak(intro)).toBe(false);
  });

  it('generates a Swedish intro when language is sv', () => {
    const intro = generateCoachIntro({
      raceName: 'Lidingoloppet',
      totalWeeks: 17,
      runsPerWeek: 3,
      thresholdPace: '5:45',
      activityClause: 'Jag har spritt dina pass over veckan.',
      language: 'sv',
    });

    expect(intro).toContain('Lidingoloppet');
    expect(intro).toContain('17-veckors');
    expect(containsInstructionLeak(intro)).toBe(false);
  });
});

import { create } from 'zustand';
import type { UserProfile, Goal, Session, PlanIntent, Constraint, CoachMessage, CoachMode } from '@/types/database';

interface AppState {
  user: UserProfile | null;
  goal: Goal | null;
  planIntents: PlanIntent[];
  todaySessions: Session[];
  weekSessions: Session[];
  constraints: Constraint[];
  coachMessages: CoachMessage[];
  coachMode: CoachMode;
  currentWeek: number;
  loading: boolean;
  adaptationBanner: { message: string; sessionId: string; auditId: string } | null;

  setUser: (user: UserProfile | null) => void;
  setGoal: (goal: Goal | null) => void;
  setPlanIntents: (intents: PlanIntent[]) => void;
  setTodaySessions: (sessions: Session[]) => void;
  setWeekSessions: (sessions: Session[]) => void;
  setConstraints: (constraints: Constraint[]) => void;
  setCoachMessages: (messages: CoachMessage[]) => void;
  addCoachMessage: (message: CoachMessage) => void;
  setCoachMode: (mode: CoachMode) => void;
  setCurrentWeek: (week: number) => void;
  setLoading: (loading: boolean) => void;
  setAdaptationBanner: (banner: AppState['adaptationBanner']) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  goal: null,
  planIntents: [],
  todaySessions: [],
  weekSessions: [],
  constraints: [],
  coachMessages: [],
  coachMode: 'suggest',
  currentWeek: 1,
  loading: true,
  adaptationBanner: null,

  setUser: (user) => set({ user }),
  setGoal: (goal) => set({ goal }),
  setPlanIntents: (planIntents) => set({ planIntents }),
  setTodaySessions: (todaySessions) => set({ todaySessions }),
  setWeekSessions: (weekSessions) => set({ weekSessions }),
  setConstraints: (constraints) => set({ constraints }),
  setCoachMessages: (coachMessages) => set({ coachMessages }),
  addCoachMessage: (message) =>
    set((state) => ({ coachMessages: [...state.coachMessages, message] })),
  setCoachMode: (coachMode) => set({ coachMode }),
  setCurrentWeek: (currentWeek) => set({ currentWeek }),
  setLoading: (loading) => set({ loading }),
  setAdaptationBanner: (adaptationBanner) => set({ adaptationBanner }),
}));

export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type GoalType = 'race' | 'target_time' | 'just_improve';
export type RaceDistance = '5k' | '10k' | 'half_marathon' | 'marathon';
export type PlanPhase = 'base' | 'build' | 'peak' | 'taper' | 'race';
export type SessionType = 'easy' | 'long' | 'tempo' | 'intervals' | 'hills' | 'recovery' | 'race' | 'strength' | 'cross_training' | 'rest';
export type SessionStatus = 'planned' | 'completed' | 'skipped' | 'adapted';
export type ConstraintType = 'recurring_activity' | 'one_off' | 'vacation' | 'injury';
export type VacationMode = 'rest' | 'travel_light' | 'active';
export type CoachMode = 'suggest' | 'auto_adapt';
export type WeekState = 'planned' | 'current' | 'completed' | 'adapted' | 'vacation' | 'recovery';
export type Sport = 'running' | 'cycling' | 'xc_skiing' | 'swimming' | 'triathlon' | 'swimrun' | 'other';
export type ExperienceLevel = 'never' | 'some' | 'regular';
export type LifeActivityType = 'gym' | 'team_sport' | 'demanding_work' | 'regular_travel' | 'recovery_priority';
export type CheckinStatus = 'pending' | 'responded' | 'accepted' | 'tweaked' | 'overridden';
export type FeelingScore = 1 | 2 | 3 | 4 | 5;

export type RecurringActivity =
  | 'tennis' | 'padel' | 'cycling' | 'swimming' | 'hiking'
  | 'skiing' | 'climbing' | 'generic_cardio' | 'generic_strength';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  age: number | null;
  gender: Gender | null;
  max_hr: number | null;
  resting_hr: number | null;
  current_weekly_mileage_km: number | null;
  runs_per_week: number | null;
  available_days: number[];
  preferred_long_run_day: number | null;
  strength_preference: 'none' | 'light' | 'moderate' | 'heavy' | null;
  coach_mode: CoachMode;
  onboarding_completed: boolean;
  onboarding_step: number;
  dark_mode: 'system' | 'light' | 'dark';
  preferred_session_length: '30-45' | '45-60' | '60-90' | '90+' | null;
  time_preference: 'morning' | 'evening' | 'any' | null;
  language: 'en' | 'sv';
  strava_connected: boolean;
  strava_athlete_id: string | null;
  strava_access_token: string | null;
  strava_refresh_token: string | null;
  strava_token_expires_at: number | null;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  type: GoalType;
  race_distance: RaceDistance | null;
  target_time_seconds: number | null;
  race_date: string | null;
  baseline_5k_seconds: number | null;
  baseline_10k_seconds: number | null;
  baseline_half_seconds: number | null;
  baseline_marathon_seconds: number | null;
  plan_weeks: number;
  active: boolean;
  created_at: string;
}

export interface UserRace {
  id: string;
  user_id: string;
  race_id: string | null;
  custom_name: string | null;
  custom_sport: Sport | null;
  custom_distance_km: number | null;
  target_date: string | null;
  is_custom: boolean;
  active: boolean;
  created_at: string;
}

export interface UserSport {
  id: string;
  user_id: string;
  sport: Sport;
  experience_level: ExperienceLevel;
  priority_weight: number;
  current_ability_data: Record<string, unknown>;
  created_at: string;
}

export interface LifeActivity {
  id: string;
  user_id: string;
  activity_type: LifeActivityType;
  frequency: number;
  sport_name: string | null;
  impact_level: 'low' | 'medium' | 'high';
  details: Record<string, unknown>;
  active: boolean;
  created_at: string;
}

export interface WeeklyCheckin {
  id: string;
  user_id: string;
  week_start: string;
  feeling_score: FeelingScore | null;
  coach_message: string | null;
  user_response: string | null;
  plan_adjustments: Record<string, unknown>;
  status: CheckinStatus;
  created_at: string;
}

export interface Constraint {
  id: string;
  user_id: string;
  type: ConstraintType;
  activity_type: RecurringActivity | null;
  day_of_week: number | null;
  start_date: string | null;
  end_date: string | null;
  vacation_mode: VacationMode | null;
  injury_description: string | null;
  injury_severity: 'minor' | 'moderate' | 'severe' | null;
  load_impact: 'low' | 'medium' | 'high';
  details: Record<string, unknown> | null;
  active: boolean;
  created_at: string;
}

export interface PlanIntent {
  id: string;
  user_id: string;
  goal_id: string;
  week_number: number;
  phase: PlanPhase;
  week_state: WeekState;
  total_distance_km: number;
  long_run_km: number;
  quality_sessions: number;
  description: string;
  is_recovery: boolean;
  adaptation_reason: string | null;
  starts_on: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  plan_intent_id: string;
  week_number: number;
  day_of_week: number;
  session_date: string;
  sport: Sport;
  type: SessionType;
  title: string;
  description: string;
  distance_km: number | null;
  target_pace_min_km: number | null;
  target_hr_zone: number | null;
  duration_minutes: number | null;
  structure: SessionStructure;
  status: SessionStatus;
  order_in_day: number;
  adaptation_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionStructure {
  blocks: SessionBlock[];
}

export interface SessionBlock {
  type: 'warmup' | 'main' | 'cooldown' | 'interval' | 'recovery';
  description: string;
  distance_km?: number;
  duration_minutes?: number;
  target_pace_min_km?: number;
  target_hr_zone?: number;
  repeats?: number;
}

export interface SessionLog {
  id: string;
  session_id: string;
  user_id: string;
  actual_distance_km: number | null;
  actual_duration_seconds: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_pace_min_km: number | null;
  rpe: number | null;
  notes: string | null;
  strava_activity_id: string | null;
  completed_at: string;
  created_at: string;
}

export interface CoachMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  action_type: 'none' | 'proposal' | 'applied' | 'skipped' | 'tweaked';
  action_data: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditEntry {
  id: string;
  user_id: string;
  action: string;
  reason: string;
  details: Record<string, unknown>;
  coach_message_id: string | null;
  undone: boolean;
  undo_data: Record<string, unknown> | null;
  created_at: string;
}

// Mirrors supabase/migrations/0021_sport_redesign.sql.

export type ConflictPolicy = 'skip_existing' | 'overwrite_existing' | 'append';
export type ScheduledStatus = 'planned' | 'in_progress' | 'completed' | 'skipped' | 'cancelled';
export type ScheduledSourceType = 'manual' | 'template' | 'block' | 'series' | 'copied' | 'history';
export type BlockStatus = 'planned' | 'active' | 'completed' | 'cancelled';
export type RecurrenceType = 'weekly';
export type SetType = 'working' | 'warmup' | 'dropset';
export type ProgressionType =
  | 'none' | 'manual' | 'linear' | 'percentage' | 'double_progression' | 'rpe_rir' | 'deload' | 'custom';
export type SessionStatus = 'in_progress' | 'completed' | 'cancelled';
export type MetricType =
  | 'one_rep_max_estimated' | 'max_weight' | 'max_reps' | 'max_volume'
  | 'best_5k_time' | 'best_10k_time' | 'longest_distance' | 'custom';
/** Scope for edits/deletes that touch a recurring block/series occurrence (spec §3.4/§7.7/§17.4/§17.5). */
export type EditScope = 'this' | 'thisAndFuture' | 'all';

export interface Sport {
  id: string;
  user_id: string;
  name: string;
  icon_key: string | null;
  color_token: string | null;
  sort_order: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Exercise {
  id: string;
  user_id: string;
  sport_id: string | null;
  name: string;
  category: string | null;
  primary_muscle_group: string | null;
  secondary_muscle_groups: string[] | null;
  equipment: string | null;
  notes: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  sport_id: string | null;
  name: string;
  subtitle: string | null;
  description: string | null;
  estimated_duration_min: number | null;
  color_token: string | null;
  sort_order: number;
  is_favorite: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutTemplateExercise {
  id: string;
  user_id: string;
  template_id: string;
  exercise_id: string | null;
  name_snapshot: string;
  order_index: number;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkoutTemplateSet {
  id: string;
  user_id: string;
  template_exercise_id: string;
  set_index: number;
  set_type: SetType;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight_kg: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  tempo: string | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** A template with its exercises and sets hydrated — the shape the template editor/picker works with. */
export interface WorkoutTemplateFull extends WorkoutTemplate {
  exercises: (WorkoutTemplateExercise & { sets: WorkoutTemplateSet[] })[];
}

export interface TrainingBlock {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  status: BlockStatus;
  conflict_policy: ConflictPolicy;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TrainingBlockDayAssignment {
  id: string;
  user_id: string;
  block_id: string;
  weekday: number; // 1 = Monday .. 7 = Sunday
  order_index: number;
  template_id: string | null;
  sport_id: string | null;
  manual_title: string | null;
  planned_duration_min: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TrainingPlanSeries {
  id: string;
  user_id: string;
  name: string;
  source_type: 'template' | 'manual';
  template_id: string | null;
  sport_id: string | null;
  manual_title: string | null;
  start_date: string;
  end_date: string;
  recurrence_type: RecurrenceType;
  recurrence_interval: number;
  days_of_week: number[];
  planned_duration_min: number | null;
  conflict_policy: ConflictPolicy;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ScheduledWorkout {
  id: string;
  user_id: string;
  scheduled_date: string;
  order_index: number;
  sport_id: string | null;
  template_id: string | null;
  block_id: string | null;
  block_assignment_id: string | null;
  series_id: string | null;
  source_type: ScheduledSourceType;
  title: string;
  subtitle: string | null;
  planned_duration_min: number | null;
  color_token: string | null;
  status: ScheduledStatus;
  is_override: boolean;
  original_scheduled_date: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ProgressionRule {
  id: string;
  user_id: string;
  template_id: string | null;
  block_id: string | null;
  exercise_id: string | null;
  progression_type: ProgressionType;
  duration_weeks: number | null;
  params: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** `params` shape for progression_type === 'linear'. */
export interface LinearProgressionParams {
  starting_weight_kg: number;
  weekly_increment_kg: number;
  sets: number;
  reps: number;
  deload_every_weeks?: number;
  deload_percent?: number;
}

export interface ProgressionTarget {
  id: string;
  user_id: string;
  progression_rule_id: string | null;
  template_id: string | null;
  block_id: string | null;
  exercise_id: string | null;
  week_number: number;
  set_index: number | null;
  target_weight_kg: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TrainingSession {
  id: string;
  user_id: string;
  scheduled_workout_id: string | null;
  template_id: string | null;
  sport_id: string | null;
  title: string;
  started_at: string | null;
  ended_at: string | null;
  duration_min: number | null;
  status: SessionStatus;
  total_volume_kg: number | null;
  total_distance_km: number | null;
  avg_pace_sec_per_km: number | null;
  notes: string | null;
  perceived_effort: number | null;
  energy_before: number | null;
  energy_during: number | null;
  motivation: number | null;
  soreness: number | null;
  wellbeing: number | null;
  sleep_hours: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SessionExercise {
  id: string;
  user_id: string;
  session_id: string;
  exercise_id: string | null;
  name_snapshot: string;
  order_index: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SessionSet {
  id: string;
  user_id: string;
  session_exercise_id: string;
  set_index: number;
  set_type: SetType;
  target_weight_kg: number | null;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_rir: number | null;
  target_rpe: number | null;
  actual_weight_kg: number | null;
  actual_reps: number | null;
  actual_rir: number | null;
  actual_rpe: number | null;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  rest_started_at: string | null;
  rest_duration_seconds: number | null;
  rest_completed: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** A session with its exercises/sets hydrated — the shape the active-session screen works with. */
export interface TrainingSessionFull extends TrainingSession {
  exercises: (SessionExercise & { sets: SessionSet[] })[];
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  sport_id: string | null;
  exercise_id: string | null;
  session_id: string | null;
  title: string;
  metric_type: MetricType;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  occurred_on: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ── input payloads ──────────────────────────────────────────

export interface NewManualWorkoutInput {
  scheduled_date: string;
  sport_id?: string | null;
  title: string;
  subtitle?: string | null;
  planned_duration_min?: number | null;
  notes?: string | null;
  color_token?: string | null;
  order_index?: number;
}

export interface NewWorkoutFromTemplateInput {
  template_id: string;
  sport_id?: string | null;
  start_date: string;
  weekdays?: number[]; // empty/omitted = single occurrence on start_date
  recurrence: 'once' | 'weekly' | 'biweekly' | 'every_n_weeks';
  recurrence_interval?: number;
  duration_weeks?: number;
  end_date?: string;
  conflict_policy: ConflictPolicy;
}

export interface NewTrainingBlockInput {
  name: string;
  description?: string | null;
  start_date: string;
  duration_weeks: number;
  conflict_policy: ConflictPolicy;
  days: {
    weekday: number;
    is_active: boolean;
    assignments: { template_id?: string | null; sport_id?: string | null; manual_title?: string | null; planned_duration_min?: number | null }[];
  }[];
  progression?: {
    exercise_id: string;
    exercise_name: string;
    progression_type: ProgressionType;
    params: LinearProgressionParams | Record<string, unknown>;
    /** User-edited per-week cells (always present — the drawer pre-fills these from the computed table for 'linear'). */
    rows: { week: number; weight: number | null; reps: number | null; isDeload: boolean }[];
  }[];
}

// ── training cycles (macrocycle wrapping one or more blocks as "phases") ──

export type CycleStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived';
export type CycleGoal =
  | 'hipertrofia' | 'sila' | 'redukcja' | 'wytrzymalosc' | 'rehabilitacja' | 'mobilnosc' | 'powrot_po_przerwie' | 'custom';
export type CycleWeekType = 'standard' | 'deload' | 'test' | 'special';

export interface TrainingCycle {
  id: string;
  user_id: string;
  name: string;
  goal: CycleGoal | string;
  status: CycleStatus;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  intensity: string | null;
  trainings_per_week: number | null;
  active_sport_ids: string[];
  notes: string | null;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
}

/** A mezocykl — wraps one existing training_block (all its scheduling/progression lives there). */
export interface TrainingCyclePhase {
  id: string;
  user_id: string;
  cycle_id: string;
  block_id: string | null;
  name: string;
  goal: string | null;
  order_index: number;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** A mikrocykl — tags one calendar week of the cycle with a type/goal. */
export interface TrainingCycleWeek {
  id: string;
  user_id: string;
  cycle_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  week_type: CycleWeekType;
  goal: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewCycleInput {
  name: string;
  goal: CycleGoal | string;
  start_date: string;
  duration_weeks: number;
  intensity?: string | null;
  trainings_per_week?: number | null;
  active_sport_ids?: string[];
  notes?: string | null;
}

export interface CycleProgress {
  plannedCount: number;
  completedCount: number;
  skippedCount: number;
  totalVolumeKg: number;
  completionPercent: number;
}

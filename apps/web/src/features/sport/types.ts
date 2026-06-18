export interface Workout {
  id: string;
  user_id: string;
  date: string;
  name: string;
  type: string | null;
  status: 'planned' | 'active' | 'done';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  workout_id: string | null;
  exercise_id: string | null;
  exercise_name: string;
  weight: number;
  reps: number;
  set_no: number;
  rir: number | null;
  rpe: number | null;
  notes: string | null;
  created_at: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  lean_mass: number | null;
  circumferences: Record<string, number> | null;
  created_at: string;
}

export interface ReadinessDaily {
  id: string;
  user_id: string;
  date: string;
  sleep_h: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  soreness: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewWorkoutInput {
  date?: string;
  name: string;
  type?: string | null;
  status?: 'planned' | 'active' | 'done';
}

export interface NewWorkoutSetInput {
  workout_id?: string | null;
  exercise_id?: string | null;
  exercise_name: string;
  weight: number;
  reps: number;
  set_no?: number;
  rir?: number | null;
  rpe?: number | null;
  notes?: string | null;
}

export interface NewBodyMeasurementInput {
  date?: string;
  weight?: number | null;
  body_fat?: number | null;
  lean_mass?: number | null;
}

export interface ReadinessPatch {
  sleep_h?: number | null;
  hrv_ms?: number | null;
  resting_hr?: number | null;
  soreness?: number | null;
}

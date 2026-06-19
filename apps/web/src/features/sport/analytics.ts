/**
 * Pure helpers over Sport local-store data (sessions/templates/feelings).
 * Kept separate from SportScreen.tsx so the views stay focused on rendering.
 */
import type { WorkoutSession, WorkoutSet, WorkoutTemplate, FeelingEntry } from '@/store/localStore';
import { findExercise, type SportKey, type MuscleKey } from './catalog';
import { muscleSetFromExercises, type HighlightLevel } from './BodyMap';

export function volFromSets(sets: WorkoutSet[]): number {
  return sets.filter((s) => s.completed).reduce((a, s) => a + s.weight * s.reps, 0);
}

export function sessionVolume(session: WorkoutSession): number {
  return session.exercises.reduce((a, e) => a + volFromSets(e.sets), 0);
}

export function sessionSetCount(session: WorkoutSession): number {
  return session.exercises.reduce((a, e) => a + e.sets.filter((s) => s.completed).length, 0);
}

export interface TemplateStats { duration: number; exerciseCount: number; setCount: number; volumeKg: number; }

/** Planned/estimated stats for a template — ignores `completed`, since it hasn't been performed yet. */
export function templateStats(t: WorkoutTemplate): TemplateStats {
  return {
    duration: t.estimatedDuration,
    exerciseCount: t.exercises.length,
    setCount: t.exercises.reduce((a, e) => a + e.sets.length, 0),
    volumeKg: t.exercises.reduce((a, e) => a + e.sets.reduce((b, s) => b + s.weight * s.reps, 0), 0),
  };
}

export interface WeekStats { count: number; minutes: number; volumeKg: number; sets: number; }

function statsForWindow(sessions: WorkoutSession[], startMs: number, endMs: number): WeekStats {
  const windowed = sessions.filter((s) => { const t = new Date(s.date).getTime(); return t >= startMs && t < endMs; });
  return {
    count: windowed.length,
    minutes: windowed.reduce((a, s) => a + (s.duration ?? 0), 0),
    volumeKg: windowed.reduce((a, s) => a + sessionVolume(s), 0),
    sets: windowed.reduce((a, s) => a + sessionSetCount(s), 0),
  };
}

export interface WeekOverWeek { current: WeekStats; previous: WeekStats; deltaPct: Record<keyof WeekStats, number | null>; }

export function weekOverWeek(sessions: WorkoutSession[]): WeekOverWeek {
  const now = Date.now();
  const current = statsForWindow(sessions, now - 7 * 86400000, now);
  const previous = statsForWindow(sessions, now - 14 * 86400000, now - 7 * 86400000);
  function pct(c: number, p: number): number | null {
    if (p > 0) return Math.round(((c - p) / p) * 100);
    return c > 0 ? 100 : null;
  }
  return {
    current, previous,
    deltaPct: {
      count: pct(current.count, previous.count),
      minutes: pct(current.minutes, previous.minutes),
      volumeKg: pct(current.volumeKg, previous.volumeKg),
      sets: pct(current.sets, previous.sets),
    },
  };
}

export function filterBySport(sessions: WorkoutSession[], sport: SportKey | 'Wszystko'): WorkoutSession[] {
  if (sport === 'Wszystko') return sessions;
  return sessions.filter((s) => s.sportType === sport);
}

export function sessionsInLastNDays(sessions: WorkoutSession[], days: number, from = new Date()): WorkoutSession[] {
  const cutoff = from.getTime() - days * 86400000;
  return sessions.filter((s) => new Date(s.date).getTime() >= cutoff);
}

export interface WeekSummary {
  count: number; totalMinutes: number; totalVolumeKg: number; totalKm: number;
  activeDays: number; bySport: Record<string, number>;
}

export function weekSummary(sessions: WorkoutSession[], sports: SportKey[]): WeekSummary {
  const week = sessionsInLastNDays(sessions, 7);
  const bySport: Record<string, number> = {};
  for (const s of sports) bySport[s] = 0;
  for (const s of week) bySport[s.sportType] = (bySport[s.sportType] ?? 0) + 1;
  return {
    count: week.length,
    totalMinutes: week.reduce((a, s) => a + (s.duration ?? 0), 0),
    totalVolumeKg: week.reduce((a, s) => a + sessionVolume(s), 0),
    totalKm: week.reduce((a, s) => a + (s.distanceKm ?? 0), 0),
    activeDays: new Set(week.map((s) => s.date)).size,
    bySport,
  };
}

export function templateMuscles(template: WorkoutTemplate | undefined | null): Partial<Record<MuscleKey, HighlightLevel>> {
  if (!template) return {};
  const defs = template.exercises.map((e) => findExercise(e.exerciseId)).filter((e): e is NonNullable<typeof e> => !!e);
  return muscleSetFromExercises(defs);
}

export interface PersonalRecord { exerciseName: string; weight: number; reps: number; date: string; }

export function computePRs(sessions: WorkoutSession[], limit = 5): PersonalRecord[] {
  const best = new Map<string, PersonalRecord>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!set.completed || set.weight <= 0) continue;
        const current = best.get(ex.exerciseName);
        if (!current || set.weight > current.weight) {
          best.set(ex.exerciseName, { exerciseName: ex.exerciseName, weight: set.weight, reps: set.reps, date: session.date });
        }
      }
    }
  }
  return [...best.values()].sort((a, b) => b.weight - a.weight).slice(0, limit);
}

export interface ExerciseVolume { exerciseName: string; volume: number; }

export function topExercisesByVolume(sessions: WorkoutSession[], limit = 5): ExerciseVolume[] {
  const totals = new Map<string, number>();
  for (const session of sessions) {
    for (const ex of session.exercises) {
      totals.set(ex.exerciseName, (totals.get(ex.exerciseName) ?? 0) + volFromSets(ex.sets));
    }
  }
  return [...totals.entries()]
    .map(([exerciseName, volume]) => ({ exerciseName, volume }))
    .filter((e) => e.volume > 0)
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
}

export function muscleSetCounts(sessions: WorkoutSession[]): Partial<Record<MuscleKey, number>> {
  const out: Partial<Record<MuscleKey, number>> = {};
  for (const session of sessions) {
    for (const ex of session.exercises) {
      const def = findExercise(ex.exerciseId);
      if (!def) continue;
      const setCount = ex.sets.filter((s) => s.completed).length;
      if (setCount === 0) continue;
      for (const m of def.primaryMuscles) out[m] = (out[m] ?? 0) + setCount;
    }
  }
  return out;
}

export function streakDays(sessions: WorkoutSession[]): number {
  const dates = new Set(sessions.map((s) => s.date));
  let streak = 0;
  const cursor = new Date();
  // allow the streak to "count" even if today has no session yet, starting from yesterday
  if (!dates.has(cursor.toISOString().split('T')[0])) cursor.setDate(cursor.getDate() - 1);
  while (dates.has(cursor.toISOString().split('T')[0])) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DayBucket { date: string; count: number; volume: number; }

export function dailyBuckets(sessions: WorkoutSession[], days: number): DayBucket[] {
  const map = new Map<string, DayBucket>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    map.set(key, { date: key, count: 0, volume: 0 });
  }
  for (const s of sessions) {
    const bucket = map.get(s.date);
    if (bucket) { bucket.count += 1; bucket.volume += sessionVolume(s); }
  }
  return [...map.values()];
}

export interface RunningStats {
  kmWeek: number; kmMonth: number; avgPace: number | null; longestKm: number; sessionCount: number;
}

export function runningStats(sessions: WorkoutSession[]): RunningStats {
  const runs = sessions.filter((s) => s.sportType === 'Bieganie');
  const week = sessionsInLastNDays(runs, 7);
  const month = sessionsInLastNDays(runs, 30);
  const paces = runs.map((r) => r.avgPaceMinPerKm).filter((p): p is number => p != null);
  return {
    kmWeek: week.reduce((a, r) => a + (r.distanceKm ?? 0), 0),
    kmMonth: month.reduce((a, r) => a + (r.distanceKm ?? 0), 0),
    avgPace: paces.length ? paces.reduce((a, p) => a + p, 0) / paces.length : null,
    longestKm: runs.reduce((a, r) => Math.max(a, r.distanceKm ?? 0), 0),
    sessionCount: runs.length,
  };
}

export function byCategoryCount(sessions: WorkoutSession[], templates: WorkoutTemplate[]): Record<string, number> {
  const tplCategory = new Map(templates.map((t) => [t.id, t.category ?? t.name]));
  const out: Record<string, number> = {};
  for (const s of sessions) {
    const cat = (s.templateId && tplCategory.get(s.templateId)) || s.templateName || 'Inne';
    out[cat] = (out[cat] ?? 0) + 1;
  }
  return out;
}

export function mostFrequentExercises(sessions: WorkoutSession[], limit = 5): { exerciseName: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sessions) for (const ex of s.exercises) counts.set(ex.exerciseName, (counts.get(ex.exerciseName) ?? 0) + 1);
  return [...counts.entries()].map(([exerciseName, count]) => ({ exerciseName, count })).sort((a, b) => b.count - a.count).slice(0, limit);
}

export function generateInsights(
  sessions: WorkoutSession[], feelings: FeelingEntry[], sports: SportKey[],
): string[] {
  const insights: string[] = [];
  const thisWeek = weekSummary(sessions, sports);
  const lastWeek = weekSummary(
    sessions.filter((s) => {
      const diff = (Date.now() - new Date(s.date).getTime()) / 86400000;
      return diff > 7 && diff <= 14;
    }),
    sports,
  );

  if (thisWeek.totalVolumeKg > 0 && lastWeek.totalVolumeKg > 0) {
    const change = (thisWeek.totalVolumeKg - lastWeek.totalVolumeKg) / lastWeek.totalVolumeKg;
    if (change > 0.25) insights.push(`Objętość tygodniowa wzrosła o ${Math.round(change * 100)}% względem zeszłego tygodnia — pilnuj regeneracji, by nie wpaść w przeciążenie.`);
    else if (change < -0.3) insights.push(`Objętość tygodniowa spadła o ${Math.round(Math.abs(change) * 100)}% — jeśli to nie zaplanowany deload, sprawdź co stoi na drodze.`);
  }

  if ((thisWeek.bySport['Siłownia'] ?? 0) >= 3 && (thisWeek.bySport['Mobilność'] ?? 0) === 0) {
    insights.push('Brakuje mobilności w tym tygodniu — rozważ krótką sesję rozciągania barków/bioder.');
  }
  if ((thisWeek.bySport['Bieganie'] ?? 0) >= 2 && (thisWeek.bySport['Rehabilitacja'] ?? 0) === 0) {
    insights.push('Sporo biegania bez sesji prehabilitacyjnej — warto dodać wzmacnianie stawu skokowego/kolana.');
  }

  const recentPain = feelings.filter((f) => f.pain != null).slice(0, 3).map((f) => f.pain);
  if (recentPain.length >= 2 && recentPain[0] > recentPain[recentPain.length - 1] + 1) {
    insights.push('Poziom bólu w ostatnich wpisach odczuć rośnie — rozważ dzień regeneracji lub konsultację.');
  }

  if (thisWeek.activeDays === 0) insights.push('Brak aktywności w tym tygodniu — najmniejszy krok też się liczy.');

  if (insights.length === 0) insights.push('Brak wyraźnych odchyleń — trzymaj obecne tempo.');
  return insights;
}

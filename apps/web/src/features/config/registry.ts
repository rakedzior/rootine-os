/* ============================================================
   ROOTINE OS — module & feature registry
   Single source of truth for the 9 modules and every configurable
   widget (stable `feature_key`). The DB stores per-user visibility
   and ordering; this registry defines the defaults and the catalog.
   ============================================================ */

export type ModuleKey =
  | 'start'
  | 'sport'
  | 'diet'
  | 'finance'
  | 'goals'
  | 'office'
  | 'travel'
  | 'notes'
  | 'work';

export interface ModuleDef {
  key: ModuleKey;
  /** Route path (start = "/"). */
  path: string;
  /** Label shown in the nav (Polish, matches prototype). */
  label: string;
  /** Default order in nav. */
  order: number;
}

export const MODULES: ModuleDef[] = [
  { key: 'start', path: '/', label: 'Start', order: 0 },
  { key: 'sport', path: '/sport', label: 'Sport', order: 1 },
  { key: 'diet', path: '/diet', label: 'Dieta', order: 2 },
  { key: 'finance', path: '/finance', label: 'Finanse', order: 3 },
  { key: 'goals', path: '/goals', label: 'Cele', order: 4 },
  { key: 'office', path: '/office', label: 'Biuro', order: 5 },
  { key: 'travel', path: '/travel', label: 'Podróże', order: 6 },
  { key: 'notes', path: '/notes', label: 'Notatki', order: 7 },
  { key: 'work', path: '/work', label: 'Praca', order: 8 },
];

/** Stable feature keys, grouped by module. `<module>.<feature>`.
 *  Frontend renders a widget only if its key is visible for the user. */
export const FEATURES: Record<ModuleKey, { key: string; label: string }[]> = {
  start: [
    { key: 'start.weather_time', label: 'Pogoda i czas' },
    { key: 'start.finance_pulse', label: 'Puls finansów' },
    { key: 'start.nutrition_summary', label: 'Podsumowanie kalorii' },
    { key: 'start.today_tasks', label: 'Dzisiejsze zadania' },
    { key: 'start.calendar', label: 'Kalendarz miesięczny' },
    { key: 'start.habits', label: 'Nawyki' },
    { key: 'start.today_workout', label: 'Dzisiejszy trening' },
    { key: 'start.goal_progress', label: 'Postępy w celach' },
  ],
  sport: [
    { key: 'sport.readiness', label: 'Gotowość i regeneracja' },
    { key: 'sport.body_measurements', label: 'Pomiary ciała' },
    { key: 'sport.today_workout', label: 'Dzisiejszy trening' },
    { key: 'sport.workout_logger', label: 'Logger serii' },
    { key: 'sport.week_plan', label: 'Plan tygodnia' },
    { key: 'sport.load_progression', label: 'Progresja obciążeń / 1RM' },
    { key: 'sport.training_load', label: 'Obciążenie treningowe' },
    { key: 'sport.session_history', label: 'Historia sesji' },
    { key: 'sport.running', label: 'Bieganie (Strava)' },
    { key: 'sport.rehab_mobility', label: 'Rehabilitacja i mobilność' },
  ],
  diet: [
    { key: 'diet.macros', label: 'Makroskładniki' },
    { key: 'diet.meals', label: 'Posiłki' },
    { key: 'diet.food_items', label: 'Produkty' },
    { key: 'diet.calorie_balance', label: 'Bilans kaloryczny' },
    { key: 'diet.daily_targets', label: 'Dzienne cele' },
  ],
  finance: [
    { key: 'finance.balance', label: 'Saldo' },
    { key: 'finance.budgets', label: 'Budżety' },
    { key: 'finance.recurring', label: 'Wydatki cykliczne' },
    { key: 'finance.one_off', label: 'Wydatki jednorazowe' },
    { key: 'finance.categories', label: 'Kategorie' },
  ],
  goals: [
    { key: 'goals.momentum', label: 'Momentum' },
    { key: 'goals.keystone_habits', label: 'Nawyki kluczowe' },
    { key: 'goals.roadmap', label: 'Roadmapa / Gantt 2026' },
    { key: 'goals.tasks', label: 'Zadania' },
    { key: 'goals.learning_paths', label: 'Ścieżki nauki' },
    { key: 'goals.milestones', label: 'Kamienie milowe' },
  ],
  office: [
    { key: 'office.documents_vault', label: 'Dokumenty i sejf' },
    { key: 'office.insurance', label: 'Ubezpieczenia' },
    { key: 'office.vehicles', label: 'Auto: przegląd, OC/AC, serwis' },
    { key: 'office.b2b_settlements', label: 'Rozliczenia B2B / ZUS / PIT / VAT' },
    { key: 'office.employment', label: 'Umowa UoP' },
    { key: 'office.vacations', label: 'Urlopy' },
  ],
  travel: [
    { key: 'travel.next_trip', label: 'Najbliższy wyjazd' },
    { key: 'travel.documents', label: 'Dokumenty podróżne' },
    { key: 'travel.budget', label: 'Budżet' },
    { key: 'travel.packing', label: 'Lista pakowania' },
    { key: 'travel.attractions', label: 'Plan atrakcji' },
    { key: 'travel.flights', label: 'Loty' },
    { key: 'travel.lodging', label: 'Nocleg' },
    { key: 'travel.transport', label: 'Transport' },
    { key: 'travel.bucket_list', label: 'Bucket list' },
  ],
  notes: [
    { key: 'notes.quick_capture', label: 'Szybki zapis' },
    { key: 'notes.collections', label: 'Kolekcje' },
    { key: 'notes.journal', label: 'Dziennik' },
    { key: 'notes.recent', label: 'Ostatnio edytowane' },
  ],
  work: [
    { key: 'work.kanban', label: 'Kanban projektów' },
    { key: 'work.companies', label: 'Firmy / klienci' },
    { key: 'work.projects', label: 'Projekty' },
    { key: 'work.tasks', label: 'Zadania' },
    { key: 'work.subtasks', label: 'Subtaski' },
    { key: 'work.task_notes', label: 'Notatki do zadań' },
    { key: 'work.statuses', label: 'Statusy' },
    { key: 'work.deadlines', label: 'Najbliższe terminy' },
  ],
};

/** Flat list of every feature_key — used to seed defaults and validate. */
export const ALL_FEATURE_KEYS: string[] = Object.values(FEATURES)
  .flat()
  .map((f) => f.key);

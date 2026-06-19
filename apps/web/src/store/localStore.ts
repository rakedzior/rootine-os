/**
 * Local Zustand store — handles modules not yet backed by Supabase:
 * Sport templates/sessions/exercises, Office, Travel, Work, Notes, Finance local, Goals local.
 * Structure mirrors the Supabase schema so migration is drop-in.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── TYPES ──────────────────────────────────────────────────

export type Priority = 'low' | 'mid' | 'high';
export type TaskStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked';

// — SPORT —
export interface SportExercise {
  id: string; createdAt: string;
  name: string; sportType: string; muscleGroup: string;
  equipment: string; notes: string;
}
export interface WorkoutSet {
  setNumber: number; reps: number; weight: number;
  restTime: number; rir: number; completed: boolean; notes: string;
}
export interface WorkoutExercise {
  exerciseId: string; exerciseName: string; sets: WorkoutSet[];
}
export interface WorkoutTemplate {
  id: string; createdAt: string; updatedAt: string;
  name: string; sportType: string; description: string;
  exercises: WorkoutExercise[]; estimatedDuration: number; isActive: boolean;
}
export interface WorkoutSession {
  id: string; createdAt: string; updatedAt: string;
  templateId?: string; templateName?: string;
  sportType: string; date: string;
  startTime?: string; endTime?: string; duration?: number;
  exercises: WorkoutExercise[];
  painAfterTraining?: number; notesAfterTraining?: string;
  painNextDay?: number; notesNextDay?: string;
  status: 'active' | 'completed';
}

// — OFFICE —
export interface OfficeTask {
  id: string; createdAt: string; updatedAt: string;
  title: string; dueDate?: string; priority: Priority;
  institution: string; category: string; status: TaskStatus;
  notes: string; isArchived: boolean;
}
export interface OfficeDocument {
  id: string; createdAt: string;
  name: string; category: string; documentNumber?: string;
  issueDate?: string; expiryDate?: string;
  reminderEnabled: boolean; notes: string; isArchived: boolean;
}
export interface Car {
  id: string; createdAt: string;
  name: string; plateNumber: string; mileage: number;
  insuranceExpiry?: string; inspectionDate?: string;
  oilChangeDate?: string; tireChangeDate?: string;
}
export interface Insurance {
  id: string; createdAt: string;
  name: string; type: string; insurer: string;
  expiryDate: string; premium: number; frequency: string; notes: string;
}
export interface VacationEntry {
  id: string; createdAt: string;
  startDate: string; endDate: string; days: number;
  type: string; status: string; notes: string;
}
export interface VacationBalance {
  yearlyLimit: number; usedDays: number; plannedDays: number;
}
export interface JdgMonth {
  id: string; month: string;
  invoiceIssued: boolean; documentsSent: boolean;
  accountingPaid: boolean; zusPaid: boolean;
  pitPaid: boolean; vatPaid: boolean; notes: string;
}

// — TRAVEL —
export interface Trip {
  id: string; createdAt: string; updatedAt: string;
  title: string; country: string; city?: string;
  startDate: string; endDate: string;
  status: 'planned' | 'active' | 'completed' | 'archived';
  coverEmoji: string; notes: string; budget?: number; isArchived: boolean;
}
export interface PackingTemplate {
  id: string; name: string; description: string;
  items: { id: string; name: string; category: string; quantity: number; packed: boolean }[];
}
export interface WishlistPlace {
  id: string; country: string; city?: string; priority: number; notes: string; visited: boolean;
}

// — WORK —
export interface WorkContext {
  id: string; createdAt: string;
  name: string; company?: string; active: boolean;
}
export interface WorkProject {
  id: string; createdAt: string; updatedAt: string;
  workContextId: string; name: string; description: string;
  status: TaskStatus; deadline?: string; progress: number; notes: string;
}
export interface WorkTask {
  id: string; createdAt: string; updatedAt: string;
  workContextId: string; projectId?: string; parentTaskId?: string;
  title: string; description: string; status: TaskStatus;
  priority: Priority; dueDate?: string; dueTime?: string;
  notes: string; subtasks: WorkTask[];
}

// — NOTES —
export type NoteType = 'sticky' | 'full' | 'checklist';
export interface ChecklistItem { id: string; text: string; done: boolean; }
export interface Note {
  id: string; createdAt: string; updatedAt: string;
  title: string; content: string; type: NoteType;
  color: string; category: string; tags: string[];
  pinned: boolean; archived: boolean;
  checklistItems?: ChecklistItem[];
}

// — FINANCE (local) —
export interface Account {
  id: string; createdAt: string;
  name: string; type: string; balance: number;
  currency: string; institution?: string; archived: boolean;
  color: string;
}
export interface RecurringExpense {
  id: string; createdAt: string;
  name: string; amount: number; category: string;
  dueDay: number; frequency: string; reminderEnabled: boolean;
}
export interface BudgetCategory {
  id: string; name: string; plannedAmount: number; actualAmount: number; month: string; color: string;
}
export interface SavingsGoal {
  id: string; createdAt: string;
  name: string; targetAmount: number; currentAmount: number;
  deadline?: string; notes: string; emoji: string;
}
export interface FinancialReminder {
  id: string; title: string; amount?: number;
  dueDate: string; category: string; completed: boolean;
}

// — GOALS (local) —
export type GoalType = 'simple' | 'project';
export interface GoalTask {
  id: string; goalId: string; parentTaskId?: string;
  title: string; description: string; dueDate?: string;
  priority?: Priority; status: TaskStatus; progress: number;
  subtasks: GoalTask[];
}
export interface Milestone { id: string; goalId: string; title: string; dueDate?: string; progress: number; completed: boolean; }
export interface Goal {
  id: string; createdAt: string; updatedAt: string;
  title: string; description: string; type: GoalType;
  category: string; priority?: Priority; deadline?: string;
  progress: number; streak?: number; tasks: GoalTask[];
  milestones: Milestone[]; archived: boolean; emoji: string;
}

// — ACTIVE SESSION —

// — DIET —
export interface FoodItem {
  id: string; name: string; unit: string;
  per100g: { kcal: number; protein: number; carbs: number; fat: number };
}
export interface MealEntry {
  id: string; date: string; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string; amount: number; unit: string;
  kcal: number; protein: number; carbs: number; fat: number;
}
export interface WaterLog { date: string; ml: number; }
export interface DietGoals { kcal: number; protein: number; carbs: number; fat: number; water: number; }

export interface ActiveSession {
  templateId?: string; templateName: string; sportType: string;
  startTime: string; currentExerciseIndex: number;
  exercises: WorkoutExercise[];
  timerSeconds: number; timerRunning: boolean;
}

// ─── STORE ──────────────────────────────────────────────────

interface LocalStore {
  // Sport
  exercises: SportExercise[];
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  activeSession: ActiveSession | null;

  // Office
  officeTasks: OfficeTask[];
  officeDocuments: OfficeDocument[];
  cars: Car[];
  insurances: Insurance[];
  vacations: VacationEntry[];
  vacationBalance: VacationBalance;
  jdgMonths: JdgMonth[];

  // Travel
  trips: Trip[];
  packingTemplates: PackingTemplate[];
  wishlist: WishlistPlace[];

  // Work
  workContexts: WorkContext[];
  workProjects: WorkProject[];
  workTasks: WorkTask[];
  activeWorkContextId: string;

  // Notes
  notes: Note[];

  // Finance
  accounts: Account[];
  recurringExpenses: RecurringExpense[];
  budgetCategories: BudgetCategory[];
  savingsGoals: SavingsGoal[];
  financialReminders: FinancialReminder[];

  // Goals
  goals: Goal[];

  // Diet
  mealEntries: MealEntry[];
  waterLogs: WaterLog[];
  dietGoals: DietGoals;
  foodItems: FoodItem[];


  // ACTIONS — Sport
  addExercise: (e: Omit<SportExercise, 'id' | 'createdAt'>) => void;
  addTemplate: (t: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTemplate: (id: string, patch: Partial<WorkoutTemplate>) => void;
  deleteTemplate: (id: string) => void;
  startSession: (s: Omit<ActiveSession, 'startTime' | 'timerSeconds' | 'timerRunning'>) => void;
  updateActiveSession: (patch: Partial<ActiveSession>) => void;
  completeSession: (notes?: string, pain?: number) => void;
  cancelSession: () => void;

  // ACTIONS — Office
  addOfficeTask: (t: Omit<OfficeTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateOfficeTask: (id: string, patch: Partial<OfficeTask>) => void;
  deleteOfficeTask: (id: string) => void;
  addOfficeDocument: (d: Omit<OfficeDocument, 'id' | 'createdAt'>) => void;
  updateOfficeDocument: (id: string, patch: Partial<OfficeDocument>) => void;
  deleteOfficeDocument: (id: string) => void;
  updateJdgMonth: (id: string, patch: Partial<JdgMonth>) => void;
  addInsurance: (i: Omit<Insurance, 'id' | 'createdAt'>) => void;
  deleteInsurance: (id: string) => void;
  addVacation: (v: Omit<VacationEntry, 'id' | 'createdAt'>) => void;
  deleteVacation: (id: string) => void;

  // ACTIONS — Travel
  addTrip: (t: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTrip: (id: string, patch: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  addWishlistPlace: (p: Omit<WishlistPlace, 'id'>) => void;
  deleteWishlistPlace: (id: string) => void;

  // ACTIONS — Work
  addWorkContext: (c: Omit<WorkContext, 'id' | 'createdAt'>) => void;
  setActiveWorkContext: (id: string) => void;
  addWorkProject: (p: Omit<WorkProject, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateWorkProject: (id: string, patch: Partial<WorkProject>) => void;
  deleteWorkProject: (id: string) => void;
  addWorkTask: (t: Omit<WorkTask, 'id' | 'createdAt' | 'updatedAt' | 'subtasks'>) => void;
  updateWorkTask: (id: string, patch: Partial<WorkTask>) => void;
  deleteWorkTask: (id: string) => void;

  // ACTIONS — Notes
  addNote: (n: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // ACTIONS — Finance
  addAccount: (a: Omit<Account, 'id' | 'createdAt'>) => void;
  updateAccount: (id: string, patch: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  addSavingsGoal: (g: Omit<SavingsGoal, 'id' | 'createdAt'>) => void;
  updateSavingsGoal: (id: string, patch: Partial<SavingsGoal>) => void;
  addRecurringExpense: (e: Omit<RecurringExpense, 'id' | 'createdAt'>) => void;
  updateRecurringExpense: (id: string, patch: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  toggleFinancialReminder: (id: string) => void;


  // ACTIONS — Diet
  addMealEntry: (e: Omit<MealEntry, 'id'>) => void;
  deleteMealEntry: (id: string) => void;
  logWater: (date: string, ml: number) => void;
  updateDietGoals: (g: Partial<DietGoals>) => void;

  // ACTIONS — Goals
  addGoal: (g: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'milestones'>) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addGoalTask: (goalId: string, t: Omit<GoalTask, 'id' | 'goalId' | 'subtasks' | 'progress'>) => void;
  updateGoalTask: (goalId: string, taskId: string, patch: Partial<GoalTask>) => void;
}

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function now(): string { return new Date().toISOString(); }

// ─── MOCK DATA ──────────────────────────────────────────────

const MOCK_EXERCISES: SportExercise[] = [
  { id: 'ex1', createdAt: now(), name: 'Wyciskanie sztangi', sportType: 'Siłownia', muscleGroup: 'Klatka piersiowa', equipment: 'Sztanga', notes: '' },
  { id: 'ex2', createdAt: now(), name: 'Wyciskanie hantli', sportType: 'Siłownia', muscleGroup: 'Klatka piersiowa', equipment: 'Hantle', notes: '' },
  { id: 'ex3', createdAt: now(), name: 'Rozpiętki', sportType: 'Siłownia', muscleGroup: 'Klatka piersiowa', equipment: 'Hantle', notes: '' },
  { id: 'ex4', createdAt: now(), name: 'Podciąganie nachwytem', sportType: 'Siłownia', muscleGroup: 'Plecy', equipment: 'Drążek', notes: '' },
  { id: 'ex5', createdAt: now(), name: 'Wiosłowanie sztangą', sportType: 'Siłownia', muscleGroup: 'Plecy', equipment: 'Sztanga', notes: '' },
  { id: 'ex6', createdAt: now(), name: 'Uginanie sztangi', sportType: 'Siłownia', muscleGroup: 'Biceps', equipment: 'Sztanga', notes: '' },
  { id: 'ex7', createdAt: now(), name: 'Przysiad ze sztangą', sportType: 'Siłownia', muscleGroup: 'Nogi', equipment: 'Sztanga', notes: '' },
  { id: 'ex8', createdAt: now(), name: 'Wyciskanie żołnierskie', sportType: 'Siłownia', muscleGroup: 'Barki', equipment: 'Sztanga', notes: '' },
];

const MOCK_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'tpl1', createdAt: now(), updatedAt: now(),
    name: 'Push A — Klatka i barki', sportType: 'Siłownia',
    description: 'Trening pchający skupiony na klatce piersiowej i barkach.',
    estimatedDuration: 70, isActive: true,
    exercises: [
      { exerciseId: 'ex1', exerciseName: 'Wyciskanie sztangi', sets: [
        { setNumber: 1, reps: 8, weight: 100, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 8, weight: 100, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 6, weight: 110, restTime: 150, rir: 1, completed: false, notes: '' },
        { setNumber: 4, reps: 6, weight: 110, restTime: 150, rir: 1, completed: false, notes: '' },
        { setNumber: 5, reps: 8, weight: 90,  restTime: 120, rir: 2, completed: false, notes: '' },
      ]},
      { exerciseId: 'ex2', exerciseName: 'Wyciskanie hantli', sets: [
        { setNumber: 1, reps: 10, weight: 32, restTime: 90, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 10, weight: 32, restTime: 90, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 10, weight: 32, restTime: 90, rir: 2, completed: false, notes: '' },
      ]},
      { exerciseId: 'ex3', exerciseName: 'Rozpiętki', sets: [
        { setNumber: 1, reps: 12, weight: 22, restTime: 60, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 12, weight: 22, restTime: 60, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 12, weight: 22, restTime: 60, rir: 2, completed: false, notes: '' },
      ]},
      { exerciseId: 'ex8', exerciseName: 'Wyciskanie żołnierskie', sets: [
        { setNumber: 1, reps: 8, weight: 60, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 8, weight: 60, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 8, weight: 60, restTime: 120, rir: 2, completed: false, notes: '' },
      ]},
    ],
  },
  {
    id: 'tpl2', createdAt: now(), updatedAt: now(),
    name: 'Pull B — Plecy i biceps', sportType: 'Siłownia',
    description: 'Trening ciągnący: plecy, biceps.',
    estimatedDuration: 65, isActive: true,
    exercises: [
      { exerciseId: 'ex4', exerciseName: 'Podciąganie nachwytem', sets: [
        { setNumber: 1, reps: 6, weight: 0, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 6, weight: 0, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 6, weight: 0, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 4, reps: 6, weight: 0, restTime: 120, rir: 2, completed: false, notes: '' },
      ]},
      { exerciseId: 'ex5', exerciseName: 'Wiosłowanie sztangą', sets: [
        { setNumber: 1, reps: 8, weight: 80, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 8, weight: 80, restTime: 120, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 8, weight: 80, restTime: 120, rir: 2, completed: false, notes: '' },
      ]},
      { exerciseId: 'ex6', exerciseName: 'Uginanie sztangi', sets: [
        { setNumber: 1, reps: 10, weight: 40, restTime: 90, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 10, weight: 40, restTime: 90, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 10, weight: 40, restTime: 90, rir: 2, completed: false, notes: '' },
      ]},
    ],
  },
  {
    id: 'tpl3', createdAt: now(), updatedAt: now(),
    name: 'Nogi A — Uda i pośladki', sportType: 'Siłownia',
    description: '', estimatedDuration: 80, isActive: true,
    exercises: [
      { exerciseId: 'ex7', exerciseName: 'Przysiad ze sztangą', sets: [
        { setNumber: 1, reps: 8, weight: 120, restTime: 180, rir: 2, completed: false, notes: '' },
        { setNumber: 2, reps: 8, weight: 120, restTime: 180, rir: 2, completed: false, notes: '' },
        { setNumber: 3, reps: 8, weight: 120, restTime: 180, rir: 2, completed: false, notes: '' },
        { setNumber: 4, reps: 6, weight: 130, restTime: 180, rir: 1, completed: false, notes: '' },
      ]},
    ],
  },
];

const MOCK_SESSIONS: WorkoutSession[] = [
  {
    id: 'sess1', createdAt: now(), updatedAt: now(),
    templateId: 'tpl2', templateName: 'Pull B — Plecy i biceps',
    sportType: 'Siłownia', date: '2026-06-18',
    startTime: '18:30', endTime: '20:05', duration: 95,
    exercises: MOCK_TEMPLATES[1].exercises.map(e => ({
      ...e, sets: e.sets.map(s => ({ ...s, completed: true }))
    })),
    painAfterTraining: 2, notesAfterTraining: 'Świetny trening, dobra pompa.',
    painNextDay: 3, notesNextDay: 'Lekkie zakwasy w plecach.',
    status: 'completed',
  },
];

const MOCK_OFFICE_TASKS: OfficeTask[] = [
  { id: 'ot1', createdAt: now(), updatedAt: now(), title: 'Złożyć PIT za 2025', dueDate: '2026-06-20', priority: 'high', institution: 'Urząd Skarbowy', category: 'Podatki', status: 'todo', notes: '', isArchived: false },
  { id: 'ot2', createdAt: now(), updatedAt: now(), title: 'Wymiana oleju w aucie', dueDate: '2026-07-15', priority: 'mid', institution: 'Warsztat ABC', category: 'Auto', status: 'todo', notes: '', isArchived: false },
  { id: 'ot3', createdAt: now(), updatedAt: now(), title: 'Odnowić dowód osobisty', dueDate: '2026-06-28', priority: 'high', institution: 'Urząd Miasta', category: 'Dokumenty', status: 'todo', notes: '', isArchived: false },
  { id: 'ot4', createdAt: now(), updatedAt: now(), title: 'ZUS — opłata za maj', dueDate: '2026-06-10', priority: 'high', institution: 'ZUS', category: 'JDG', status: 'done', notes: '', isArchived: false },
  { id: 'ot5', createdAt: now(), updatedAt: now(), title: 'Ubezpieczenie mieszkania', dueDate: '2026-07-05', priority: 'low', institution: 'PZU', category: 'Ubezpieczenia', status: 'todo', notes: '', isArchived: false },
];
const MOCK_OFFICE_DOCS: OfficeDocument[] = [
  { id: 'od1', createdAt: now(), name: 'Dowód osobisty', category: 'Dokumenty', documentNumber: 'ABC12345', issueDate: '2016-03-12', expiryDate: '2026-07-28', reminderEnabled: true, notes: '', isArchived: false },
  { id: 'od2', createdAt: now(), name: 'Paszport', category: 'Dokumenty', documentNumber: 'XY9988776', issueDate: '2020-05-10', expiryDate: '2030-05-10', reminderEnabled: false, notes: '', isArchived: false },
  { id: 'od3', createdAt: now(), name: 'Prawo jazdy', category: 'Dokumenty', documentNumber: 'DL445566', issueDate: '2014-11-20', expiryDate: '2029-11-20', reminderEnabled: false, notes: '', isArchived: false },
];
const MOCK_CARS: Car[] = [
  { id: 'car1', createdAt: now(), name: 'BMW 320d', plateNumber: 'KR 12345', mileage: 138450, insuranceExpiry: '2026-12-15', inspectionDate: '2027-03-10', oilChangeDate: '2026-09-10', tireChangeDate: '2026-10-15' },
];
const MOCK_JDG: JdgMonth[] = [
  { id: 'jdg1', month: '2026-06', invoiceIssued: true, documentsSent: false, accountingPaid: false, zusPaid: false, pitPaid: false, vatPaid: false, notes: '' },
  { id: 'jdg2', month: '2026-05', invoiceIssued: true, documentsSent: true, accountingPaid: true, zusPaid: true, pitPaid: true, vatPaid: true, notes: '' },
  { id: 'jdg3', month: '2026-04', invoiceIssued: true, documentsSent: true, accountingPaid: true, zusPaid: true, pitPaid: true, vatPaid: true, notes: '' },
];

const MOCK_TRIPS: Trip[] = [
  { id: 'tr1', createdAt: now(), updatedAt: now(), title: 'Bali, Indonezja', country: 'Indonezja', city: 'Bali', startDate: '2026-07-13', endDate: '2026-08-05', status: 'planned', coverEmoji: '🏝️', notes: '', budget: 9500, isArchived: false },
  { id: 'tr2', createdAt: now(), updatedAt: now(), title: 'Rzym, Włochy', country: 'Włochy', city: 'Rzym', startDate: '2026-09-15', endDate: '2026-09-22', status: 'planned', coverEmoji: '🏛️', notes: '', budget: 4000, isArchived: false },
  { id: 'tr3', createdAt: now(), updatedAt: now(), title: 'Tokio, Japonia', country: 'Japonia', city: 'Tokio', startDate: '2026-10-09', endDate: '2026-10-23', status: 'planned', coverEmoji: '🗾', notes: '', budget: 12000, isArchived: false },
];
const MOCK_WISHLIST: WishlistPlace[] = [
  { id: 'wl1', country: 'Peru', city: 'Cusco', priority: 9, notes: 'Machu Picchu', visited: false },
  { id: 'wl2', country: 'Nowa Zelandia', priority: 8, notes: 'South Island', visited: false },
  { id: 'wl3', country: 'Islandia', priority: 7, notes: 'Zorza polarna', visited: false },
  { id: 'wl4', country: 'Grecja', city: 'Santorini', priority: 6, notes: '', visited: true },
];

const MOCK_WORK_CONTEXTS: WorkContext[] = [
  { id: 'wc1', createdAt: now(), name: 'Praca 1 — Firma ABC', company: 'Firma ABC Sp. z o.o.', active: true },
  { id: 'wc2', createdAt: now(), name: 'Praca 2 — Freelance', company: '', active: true },
];
const MOCK_WORK_PROJECTS: WorkProject[] = [
  { id: 'wp1', createdAt: now(), updatedAt: now(), workContextId: 'wc1', name: 'Projekt Alpha', description: 'Nowy system CRM', status: 'active', deadline: '2026-07-31', progress: 70, notes: '' },
  { id: 'wp2', createdAt: now(), updatedAt: now(), workContextId: 'wc1', name: 'Projekt Beta', description: 'Migracja bazy danych', status: 'active', deadline: '2026-08-15', progress: 40, notes: '' },
  { id: 'wp3', createdAt: now(), updatedAt: now(), workContextId: 'wc1', name: 'Project Marketing', description: 'Kampania Q3', status: 'active', deadline: '2026-09-01', progress: 25, notes: '' },
];
const MOCK_WORK_TASKS: WorkTask[] = [
  { id: 'wt1', createdAt: now(), updatedAt: now(), workContextId: 'wc1', projectId: 'wp1', title: 'Przygotować raport sprzedażowy', description: '', status: 'todo', priority: 'high', dueDate: new Date().toISOString().split('T')[0], dueTime: '09:00', notes: '', subtasks: [] },
  { id: 'wt2', createdAt: now(), updatedAt: now(), workContextId: 'wc1', projectId: 'wp1', title: 'Spotkanie z klientem', description: '', status: 'todo', priority: 'mid', dueDate: new Date().toISOString().split('T')[0], dueTime: '11:00', notes: '', subtasks: [] },
  { id: 'wt3', createdAt: now(), updatedAt: now(), workContextId: 'wc1', projectId: 'wp3', title: 'Przegląd kampanii Google Ads', description: '', status: 'active', priority: 'mid', dueDate: new Date().toISOString().split('T')[0], dueTime: '14:00', notes: '', subtasks: [] },
  { id: 'wt4', createdAt: now(), updatedAt: now(), workContextId: 'wc1', projectId: 'wp1', title: 'Poprawki do prezentacji', description: '', status: 'waiting', priority: 'low', dueDate: new Date().toISOString().split('T')[0], dueTime: '15:00', notes: '', subtasks: [] },
  { id: 'wt5', createdAt: now(), updatedAt: now(), workContextId: 'wc1', title: 'Odpowiedź na maile', description: '', status: 'todo', priority: 'low', dueDate: new Date().toISOString().split('T')[0], dueTime: '16:30', notes: '', subtasks: [] },
];

const NOTE_COLORS = ['#FEF9C3', '#DCFCE7', '#DBEAFE', '#FCE7F3', '#F3E8FF', '#FED7AA', '#CFFAFE'];
const MOCK_NOTES: Note[] = [
  { id: 'n1', createdAt: now(), updatedAt: now(), title: 'Pamiętać o treningu nóg', content: 'Zrobić przysiad, martwy ciąg, wyciskanie nogami na maszynie 💪', type: 'sticky', color: NOTE_COLORS[1], category: 'Sport', tags: ['trening'], pinned: true, archived: false },
  { id: 'n2', createdAt: now(), updatedAt: now(), title: 'Zakwestionować kolegę w sprawie faktury', content: 'Faktura za marzec nadal nieopłacona — sprawdzić status przed 20 czerwca', type: 'sticky', color: NOTE_COLORS[0], category: 'Praca', tags: ['finanse', 'praca'], pinned: true, archived: false },
  { id: 'n3', createdAt: now(), updatedAt: now(), title: 'Pomysł na projekt: Aplikacja do medytacji', content: 'Timer + dziennik nastrojów + streak. Technologie: React Native + Supabase.', type: 'sticky', color: NOTE_COLORS[4], category: 'Pomysły', tags: ['projekt', 'aplikacja'], pinned: false, archived: false },
  { id: 'n4', createdAt: now(), updatedAt: now(), title: 'Kupić prezent dla Mamy', content: '10 urodziny — może kurs online albo SPA?', type: 'sticky', color: NOTE_COLORS[3], category: 'Osobiste', tags: ['zakupy'], pinned: true, archived: false },
  { id: 'n5', createdAt: now(), updatedAt: now(), title: 'Lista zakupów', content: '', type: 'checklist', color: NOTE_COLORS[2], category: 'Osobiste', tags: ['zakupy'], pinned: false, archived: false, checklistItems: [
    { id: 'ci1', text: 'Jajka', done: false },
    { id: 'ci2', text: 'Bananmy', done: false },
    { id: 'ci3', text: 'Płatki owsiane', done: true },
    { id: 'ci4', text: 'Warzywa', done: false },
    { id: 'ci5', text: 'Oliwa z oliwek', done: false },
  ]},
  { id: 'n6', createdAt: now(), updatedAt: now(), title: 'Pomysły na wakacje', content: 'Barcelona, Santorini, Azory — sprawdzić ceny w lipcu', type: 'sticky', color: NOTE_COLORS[5], category: 'Podróże', tags: ['wakacje', 'podróże'], pinned: false, archived: false },
];

const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', createdAt: now(), name: 'Konto główne', type: 'główne', balance: 12452, currency: 'PLN', institution: 'Bank Millennium', archived: false, color: '#EF4444' },
  { id: 'acc2', createdAt: now(), name: 'Konto oszczędnościowe', type: 'oszczędnościowe', balance: 15390, currency: 'PLN', institution: 'Alior Bank', archived: false, color: '#3B82F6' },
  { id: 'acc3', createdAt: now(), name: 'Konto walutowe (EUR)', type: 'walutowe', balance: 1250, currency: 'EUR', institution: 'mBank', archived: false, color: '#1A1A18' },
  { id: 'acc4', createdAt: now(), name: 'Gotówka', type: 'gotówka', balance: 1320, currency: 'PLN', institution: 'Portfel', archived: false, color: '#22C55E' },
  { id: 'acc5', createdAt: now(), name: 'Konto wspólne', type: 'główne', balance: 8760, currency: 'PLN', institution: 'PKO BP', archived: false, color: '#8B5CF6' },
];
const MOCK_RECURRING: RecurringExpense[] = [
  { id: 're1', createdAt: now(), name: 'Czynsz', amount: 850, category: 'Mieszkanie', dueDay: 8, frequency: 'monthly', reminderEnabled: true },
  { id: 're2', createdAt: now(), name: 'Prąd', amount: 120, category: 'Mieszkanie', dueDay: 15, frequency: 'monthly', reminderEnabled: false },
  { id: 're3', createdAt: now(), name: 'Internet', amount: 59.9, category: 'Dom', dueDay: 10, frequency: 'monthly', reminderEnabled: false },
  { id: 're4', createdAt: now(), name: 'Abonament telefon', amount: 59.99, category: 'Rozrywka', dueDay: 10, frequency: 'monthly', reminderEnabled: true },
  { id: 're5', createdAt: now(), name: 'Netflix', amount: 49.99, category: 'Rozrywka', dueDay: 14, frequency: 'monthly', reminderEnabled: false },
  { id: 're6', createdAt: now(), name: 'Siłownia', amount: 128, category: 'Zdrowie', dueDay: 20, frequency: 'monthly', reminderEnabled: false },
];
const MOCK_BUDGET: BudgetCategory[] = [
  { id: 'bc1', name: 'Mieszkanie', plannedAmount: 1200, actualAmount: 1200, month: '2026-06', color: '#3B82F6' },
  { id: 'bc2', name: 'Transport', plannedAmount: 600, actualAmount: 410, month: '2026-06', color: '#F59E0B' },
  { id: 'bc3', name: 'Jedzenie', plannedAmount: 450, actualAmount: 530, month: '2026-06', color: '#22C55E' },
  { id: 'bc4', name: 'Rozrywka', plannedAmount: 300, actualAmount: 210, month: '2026-06', color: '#8B5CF6' },
  { id: 'bc5', name: 'Zdrowie', plannedAmount: 200, actualAmount: 150, month: '2026-06', color: '#EF4444' },
  { id: 'bc6', name: 'Inne', plannedAmount: 250, actualAmount: 130, month: '2026-06', color: '#6B7280' },
];
const MOCK_SAVINGS: SavingsGoal[] = [
  { id: 'sg1', createdAt: now(), name: 'Poduszka finansowa', targetAmount: 30000, currentAmount: 23400, deadline: undefined, notes: '6 miesięcy kosztów', emoji: '🛡️' },
  { id: 'sg2', createdAt: now(), name: 'Wakacje 2026', targetAmount: 8000, currentAmount: 4200, deadline: '2026-07-01', notes: 'Bali + Japonia', emoji: '🏖️' },
  { id: 'sg3', createdAt: now(), name: 'Nowy samochód', targetAmount: 50000, currentAmount: 12300, deadline: '2027-12-31', notes: '', emoji: '🚗' },
];
const MOCK_FIN_REMINDERS: FinancialReminder[] = [
  { id: 'fr1', title: 'Czynsz', amount: 850, dueDate: '2026-06-08', category: 'Mieszkanie', completed: true },
  { id: 'fr2', title: 'Abonament telefon', amount: 59.99, dueDate: '2026-06-10', category: 'Rozrywka', completed: false },
  { id: 'fr3', title: 'Ubezpieczenie OC', amount: 420, dueDate: '2026-06-20', category: 'Auto', completed: false },
  { id: 'fr4', title: 'Księgowość', amount: 250, dueDate: '2026-06-25', category: 'JDG', completed: false },
  { id: 'fr5', title: 'Spotify', amount: 19.99, dueDate: '2026-07-01', category: 'Rozrywka', completed: false },
];

const MOCK_GOALS: Goal[] = [
  {
    id: 'g1', createdAt: now(), updatedAt: now(),
    title: 'Nauka hiszpańskiego', description: 'Mów płynnie po hiszpańsku bez barier.',
    type: 'project', category: 'Edukacja', priority: 'high',
    deadline: '2026-12-31', progress: 72, streak: 11,
    emoji: '🇪🇸', archived: false,
    tasks: [
      { id: 'gt1', goalId: 'g1', title: '30 min Duolingo', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'mid', status: 'done', progress: 100, subtasks: [] },
      { id: 'gt2', goalId: 'g1', title: 'Nowe słówka (20)', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'mid', status: 'todo', progress: 0, subtasks: [] },
      { id: 'gt3', goalId: 'g1', title: 'Ćwiczenia gramatyczne', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'low', status: 'todo', progress: 0, subtasks: [] },
    ],
    milestones: [
      { id: 'm1', goalId: 'g1', title: 'Poziom A2', dueDate: '2026-06-15', progress: 75, completed: true },
      { id: 'm2', goalId: 'g1', title: 'Poziom B1', dueDate: '2026-09-30', progress: 20, completed: false },
    ],
  },
  {
    id: 'g2', createdAt: now(), updatedAt: now(),
    title: 'Przeczytać 12 książek w 2026', description: '',
    type: 'simple', category: 'Rozwój osobisty', priority: 'mid',
    deadline: '2026-12-31', progress: 42, streak: 0,
    emoji: '📚', archived: false,
    tasks: [
      { id: 'gt4', goalId: 'g2', title: 'Czytanie 30 min', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'low', status: 'todo', progress: 0, subtasks: [] },
    ],
    milestones: [],
  },
  {
    id: 'g3', createdAt: now(), updatedAt: now(),
    title: 'Nie palić', description: '',
    type: 'simple', category: 'Zdrowie', priority: 'high',
    progress: 100, streak: 24,
    emoji: '🚭', archived: false,
    tasks: [],
    milestones: [],
  },
  {
    id: 'g4', createdAt: now(), updatedAt: now(),
    title: 'Data Engineering Path', description: 'Zdobyć certyfikat AWS Solutions Architect',
    type: 'project', category: 'Edukacja', priority: 'high',
    deadline: '2026-09-30', progress: 15, streak: 0,
    emoji: '☁️', archived: false,
    tasks: [
      { id: 'gt5', goalId: 'g4', title: 'Kurs AWS na Udemy — moduł 3', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'mid', status: 'active', progress: 30, subtasks: [] },
      { id: 'gt6', goalId: 'g4', title: 'Powtórka notatek z EC2', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'low', status: 'todo', progress: 0, subtasks: [] },
      { id: 'gt7', goalId: 'g4', title: 'Rozwiązać quiz z S3', description: '', dueDate: new Date().toISOString().split('T')[0], priority: 'low', status: 'todo', progress: 0, subtasks: [] },
    ],
    milestones: [
      { id: 'm3', goalId: 'g4', title: 'Certyfikat AWS Solutions Architect', dueDate: '2026-09-30', progress: 15, completed: false },
    ],
  },
];

// ─── STORE IMPLEMENTATION ────────────────────────────────────


const MOCK_FOOD_ITEMS: FoodItem[] = [
  { id: 'f1', name: 'Pierś z kurczaka', unit: 'g', per100g: { kcal: 165, protein: 31, carbs: 0, fat: 3.6 } },
  { id: 'f2', name: 'Ryż biały (ugotowany)', unit: 'g', per100g: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
  { id: 'f3', name: 'Jajko', unit: 'szt', per100g: { kcal: 155, protein: 13, carbs: 1.1, fat: 11 } },
  { id: 'f4', name: 'Owsianka', unit: 'g', per100g: { kcal: 389, protein: 17, carbs: 66, fat: 7 } },
  { id: 'f5', name: 'Banan', unit: 'szt', per100g: { kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 } },
  { id: 'f6', name: 'Twaróg chudy', unit: 'g', per100g: { kcal: 72, protein: 12, carbs: 3, fat: 1 } },
];
const today = new Date().toISOString().split('T')[0];
const MOCK_MEAL_ENTRIES: MealEntry[] = [
  { id: 'm1', date: today, meal: 'breakfast', foodName: 'Owsianka', amount: 80, unit: 'g', kcal: 311, protein: 14, carbs: 53, fat: 6 },
  { id: 'm2', date: today, meal: 'breakfast', foodName: 'Banan', amount: 120, unit: 'g', kcal: 107, protein: 1.3, carbs: 27.6, fat: 0.4 },
  { id: 'm3', date: today, meal: 'lunch', foodName: 'Pierś z kurczaka', amount: 200, unit: 'g', kcal: 330, protein: 62, carbs: 0, fat: 7.2 },
  { id: 'm4', date: today, meal: 'lunch', foodName: 'Ryż biały (ugotowany)', amount: 150, unit: 'g', kcal: 195, protein: 4, carbs: 42, fat: 0.5 },
];
const MOCK_WATER_LOGS: WaterLog[] = [{ date: today, ml: 1200 }];
const MOCK_DIET_GOALS: DietGoals = { kcal: 2400, protein: 150, carbs: 270, fat: 70, water: 3000 };

export const useLocalStore = create<LocalStore>()(
  persist(
    (set, get) => ({
      // initial state
      exercises: MOCK_EXERCISES,
      templates: MOCK_TEMPLATES,
      sessions: MOCK_SESSIONS,
      activeSession: null,
      officeTasks: MOCK_OFFICE_TASKS,
      officeDocuments: MOCK_OFFICE_DOCS,
      cars: MOCK_CARS,
      insurances: [],
      vacations: [],
      vacationBalance: { yearlyLimit: 26, usedDays: 8, plannedDays: 18 },
      jdgMonths: MOCK_JDG,
      trips: MOCK_TRIPS,
      packingTemplates: [],
      wishlist: MOCK_WISHLIST,
      workContexts: MOCK_WORK_CONTEXTS,
      workProjects: MOCK_WORK_PROJECTS,
      workTasks: MOCK_WORK_TASKS,
      activeWorkContextId: 'wc1',
      notes: MOCK_NOTES,
      accounts: MOCK_ACCOUNTS,
      recurringExpenses: MOCK_RECURRING,
      budgetCategories: MOCK_BUDGET,
      savingsGoals: MOCK_SAVINGS,
      financialReminders: MOCK_FIN_REMINDERS,
      goals: MOCK_GOALS,
      mealEntries: MOCK_MEAL_ENTRIES,
      waterLogs: MOCK_WATER_LOGS,
      dietGoals: MOCK_DIET_GOALS,
      foodItems: MOCK_FOOD_ITEMS,

      // Sport actions
      addExercise: (e) => set(s => ({ exercises: [...s.exercises, { ...e, id: uid(), createdAt: now() }] })),
      addTemplate: (t) => set(s => ({ templates: [...s.templates, { ...t, id: uid(), createdAt: now(), updatedAt: now() }] })),
      updateTemplate: (id, patch) => set(s => ({ templates: s.templates.map(t => t.id === id ? { ...t, ...patch, updatedAt: now() } : t) })),
      deleteTemplate: (id) => set(s => ({ templates: s.templates.filter(t => t.id !== id) })),
      startSession: (s) => set({ activeSession: { ...s, startTime: now(), timerSeconds: 0, timerRunning: false } }),
      updateActiveSession: (patch) => set(s => ({ activeSession: s.activeSession ? { ...s.activeSession, ...patch } : null })),
      completeSession: (notes, pain) => {
        const s = get().activeSession;
        if (!s) return;
        const session: WorkoutSession = {
          id: uid(), createdAt: now(), updatedAt: now(),
          templateId: s.templateId, templateName: s.templateName,
          sportType: s.sportType, date: new Date().toISOString().split('T')[0],
          startTime: s.startTime, endTime: now(),
          duration: Math.round(s.timerSeconds / 60),
          exercises: s.exercises,
          notesAfterTraining: notes, painAfterTraining: pain,
          status: 'completed',
        };
        set(st => ({ sessions: [session, ...st.sessions], activeSession: null }));
      },
      cancelSession: () => set({ activeSession: null }),

      // Office actions
      addOfficeTask: (t) => set(s => ({ officeTasks: [{ ...t, id: uid(), createdAt: now(), updatedAt: now() }, ...s.officeTasks] })),
      updateOfficeTask: (id, patch) => set(s => ({ officeTasks: s.officeTasks.map(t => t.id === id ? { ...t, ...patch, updatedAt: now() } : t) })),
      deleteOfficeTask: (id) => set(s => ({ officeTasks: s.officeTasks.filter(t => t.id !== id) })),
      addOfficeDocument: (d) => set(s => ({ officeDocuments: [{ ...d, id: uid(), createdAt: now() }, ...s.officeDocuments] })),
      updateOfficeDocument: (id, patch) => set(s => ({ officeDocuments: s.officeDocuments.map(d => d.id === id ? { ...d, ...patch } : d) })),
      deleteOfficeDocument: (id) => set(s => ({ officeDocuments: s.officeDocuments.filter(d => d.id !== id) })),
      updateJdgMonth: (id, patch) => set(s => ({ jdgMonths: s.jdgMonths.map(j => j.id === id ? { ...j, ...patch } : j) })),
      addInsurance: (i) => set(s => ({ insurances: [...s.insurances, { ...i, id: uid(), createdAt: now() }] })),
      deleteInsurance: (id) => set(s => ({ insurances: s.insurances.filter(i => i.id !== id) })),
      addVacation: (v) => set(s => ({ vacations: [...s.vacations, { ...v, id: uid(), createdAt: now() }] })),
      deleteVacation: (id) => set(s => ({ vacations: s.vacations.filter(v => v.id !== id) })),

      // Travel actions
      addTrip: (t) => set(s => ({ trips: [{ ...t, id: uid(), createdAt: now(), updatedAt: now() }, ...s.trips] })),
      updateTrip: (id, patch) => set(s => ({ trips: s.trips.map(t => t.id === id ? { ...t, ...patch, updatedAt: now() } : t) })),
      deleteTrip: (id) => set(s => ({ trips: s.trips.filter(t => t.id !== id) })),
      addWishlistPlace: (p) => set(s => ({ wishlist: [...s.wishlist, { ...p, id: uid() }] })),
      deleteWishlistPlace: (id) => set(s => ({ wishlist: s.wishlist.filter(p => p.id !== id) })),

      // Work actions
      addWorkContext: (c) => set(s => ({ workContexts: [...s.workContexts, { ...c, id: uid(), createdAt: now() }] })),
      setActiveWorkContext: (id) => set({ activeWorkContextId: id }),
      addWorkProject: (p) => set(s => ({ workProjects: [{ ...p, id: uid(), createdAt: now(), updatedAt: now() }, ...s.workProjects] })),
      updateWorkProject: (id, patch) => set(s => ({ workProjects: s.workProjects.map(p => p.id === id ? { ...p, ...patch, updatedAt: now() } : p) })),
      deleteWorkProject: (id) => set(s => ({ workProjects: s.workProjects.filter(p => p.id !== id) })),
      addWorkTask: (t) => set(s => ({ workTasks: [{ ...t, id: uid(), createdAt: now(), updatedAt: now(), subtasks: [] }, ...s.workTasks] })),
      updateWorkTask: (id, patch) => set(s => ({ workTasks: s.workTasks.map(t => t.id === id ? { ...t, ...patch, updatedAt: now() } : t) })),
      deleteWorkTask: (id) => set(s => ({ workTasks: s.workTasks.filter(t => t.id !== id) })),

      // Notes actions
      addNote: (n) => set(s => ({ notes: [{ ...n, id: uid(), createdAt: now(), updatedAt: now() }, ...s.notes] })),
      updateNote: (id, patch) => set(s => ({ notes: s.notes.map(n => n.id === id ? { ...n, ...patch, updatedAt: now() } : n) })),
      deleteNote: (id) => set(s => ({ notes: s.notes.filter(n => n.id !== id) })),

      // Diet actions
    addMealEntry: (e) => set(s => ({ mealEntries: [...s.mealEntries, { ...e, id: uid() }] })),
    deleteMealEntry: (id) => set(s => ({ mealEntries: s.mealEntries.filter(e => e.id !== id) })),
    logWater: (date, ml) => set(s => {
      const existing = s.waterLogs.find(w => w.date === date);
      if (existing) return { waterLogs: s.waterLogs.map(w => w.date === date ? { ...w, ml: w.ml + ml } : w) };
      return { waterLogs: [...s.waterLogs, { date, ml }] };
    }),
    updateDietGoals: (g) => set(s => ({ dietGoals: { ...s.dietGoals, ...g } })),

    // Finance actions
      addAccount: (a) => set(s => ({ accounts: [...s.accounts, { ...a, id: uid(), createdAt: now() }] })),
      updateAccount: (id, patch) => set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, ...patch } : a) })),
      deleteAccount: (id) => set(s => ({ accounts: s.accounts.map(a => a.id === id ? { ...a, archived: true } : a) })),
      addSavingsGoal: (g) => set(s => ({ savingsGoals: [...s.savingsGoals, { ...g, id: uid(), createdAt: now() }] })),
      updateSavingsGoal: (id, patch) => set(s => ({ savingsGoals: s.savingsGoals.map(g => g.id === id ? { ...g, ...patch } : g) })),
      addRecurringExpense: (e) => set(s => ({ recurringExpenses: [...s.recurringExpenses, { ...e, id: uid(), createdAt: now() }] })),
      updateRecurringExpense: (id, patch) => set(s => ({ recurringExpenses: s.recurringExpenses.map(e => e.id === id ? { ...e, ...patch } : e) })),
      deleteRecurringExpense: (id) => set(s => ({ recurringExpenses: s.recurringExpenses.filter(e => e.id !== id) })),
      toggleFinancialReminder: (id) => set(s => ({ financialReminders: s.financialReminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r) })),

      // Goals actions
      addGoal: (g) => set(s => ({ goals: [{ ...g, id: uid(), createdAt: now(), updatedAt: now(), tasks: [], milestones: [] }, ...s.goals] })),
      updateGoal: (id, patch) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, ...patch, updatedAt: now() } : g) })),
      deleteGoal: (id) => set(s => ({ goals: s.goals.map(g => g.id === id ? { ...g, archived: true } : g) })),
      addGoalTask: (goalId, t) => set(s => ({
        goals: s.goals.map(g => g.id === goalId
          ? { ...g, tasks: [...g.tasks, { ...t, id: uid(), goalId, subtasks: [], progress: 0 }] }
          : g)
      })),
      updateGoalTask: (goalId, taskId, patch) => set(s => ({
        goals: s.goals.map(g => g.id === goalId
          ? { ...g, tasks: g.tasks.map(t => t.id === taskId ? { ...t, ...patch } : t) }
          : g)
      })),
    }),
    { name: 'rootine-local-store' }
  )
);

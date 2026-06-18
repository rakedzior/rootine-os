export type WorkTaskStatus = 'todo' | 'doing' | 'done';
export type CompanyType = 'client' | 'own';
export type ProjectStatus = 'active' | 'paused' | 'done' | 'archived';

export interface WorkCompany {
  id: string;
  user_id: string;
  name: string;
  type: CompanyType;
  created_at: string;
  updated_at: string;
}

export interface WorkProject {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface WorkTask {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  status: WorkTaskStatus;
  due_date: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkTaskNote {
  id: string;
  user_id: string;
  task_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface WorkSubtask {
  id: string;
  user_id: string;
  task_id: string | null;
  title: string;
  done: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewWorkTaskInput {
  project_id?: string | null;
  title: string;
  status?: WorkTaskStatus;
  due_date?: string | null;
}

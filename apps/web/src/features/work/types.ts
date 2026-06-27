export type WorkTaskStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked';
export type WorkPriority = 'low' | 'mid' | 'high';
export type CompanyType = 'client' | 'own';
export type ProjectStatus = 'todo' | 'active' | 'waiting' | 'done' | 'blocked' | 'paused' | 'archived';

export interface WorkLink {
  label: string;
  url: string;
}

export interface WorkCompany {
  id: string;
  user_id: string;
  name: string;
  type: CompanyType;
  company: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkProject {
  id: string;
  user_id: string;
  company_id: string | null;
  name: string;
  description: string;
  status: ProjectStatus;
  deadline: string | null;
  progress: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface WorkTask {
  id: string;
  user_id: string;
  company_id: string | null;
  project_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string;
  status: WorkTaskStatus;
  priority: WorkPriority;
  due_date: string | null;
  due_time: string | null;
  notes: string;
  links: WorkLink[];
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
  company_id?: string | null;
  project_id?: string | null;
  parent_task_id?: string | null;
  title: string;
  description?: string;
  status?: WorkTaskStatus;
  priority?: WorkPriority;
  due_date?: string | null;
  due_time?: string | null;
  notes?: string;
  links?: WorkLink[];
}

export interface NewWorkProjectInput {
  company_id?: string | null;
  name: string;
  description?: string;
  status?: ProjectStatus;
  deadline?: string | null;
  progress?: number;
  notes?: string;
}

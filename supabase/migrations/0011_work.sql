-- 0011_work.sql — Praca: work_companies, work_projects, work_tasks, work_task_notes, work_subtasks

-- ── work_companies ────────────────────────────────────────────────────────────
create table if not exists work_companies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  type        text not null default 'client', -- client | own
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table work_companies enable row level security;
create policy "wc_select" on work_companies for select using (auth.uid() = user_id);
create policy "wc_insert" on work_companies for insert with check (auth.uid() = user_id);
create policy "wc_update" on work_companies for update using (auth.uid() = user_id);
create policy "wc_delete" on work_companies for delete using (auth.uid() = user_id);
create index if not exists work_companies_user_idx on work_companies(user_id);
create trigger set_work_companies_updated_at before update on work_companies
  for each row execute procedure set_updated_at();

-- ── work_projects ─────────────────────────────────────────────────────────────
create table if not exists work_projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  company_id  uuid references work_companies on delete set null,
  name        text not null,
  status      text not null default 'active', -- active | paused | done | archived
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table work_projects enable row level security;
create policy "wp_select" on work_projects for select using (auth.uid() = user_id);
create policy "wp_insert" on work_projects for insert with check (auth.uid() = user_id);
create policy "wp_update" on work_projects for update using (auth.uid() = user_id);
create policy "wp_delete" on work_projects for delete using (auth.uid() = user_id);
create index if not exists work_projects_user_idx on work_projects(user_id);
create index if not exists work_projects_company_idx on work_projects(company_id);
create trigger set_work_projects_updated_at before update on work_projects
  for each row execute procedure set_updated_at();

-- ── work_tasks ────────────────────────────────────────────────────────────────
create table if not exists work_tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  project_id  uuid references work_projects on delete set null,
  title       text not null,
  status      text not null default 'todo', -- todo | doing | done
  due_date    date,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table work_tasks enable row level security;
create policy "wt_select" on work_tasks for select using (auth.uid() = user_id);
create policy "wt_insert" on work_tasks for insert with check (auth.uid() = user_id);
create policy "wt_update" on work_tasks for update using (auth.uid() = user_id);
create policy "wt_delete" on work_tasks for delete using (auth.uid() = user_id);
create index if not exists work_tasks_user_idx on work_tasks(user_id);
create index if not exists work_tasks_project_idx on work_tasks(project_id);
create trigger set_work_tasks_updated_at before update on work_tasks
  for each row execute procedure set_updated_at();

-- ── work_task_notes ───────────────────────────────────────────────────────────
create table if not exists work_task_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  task_id     uuid references work_tasks on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table work_task_notes enable row level security;
create policy "wtn_select" on work_task_notes for select using (auth.uid() = user_id);
create policy "wtn_insert" on work_task_notes for insert with check (auth.uid() = user_id);
create policy "wtn_update" on work_task_notes for update using (auth.uid() = user_id);
create policy "wtn_delete" on work_task_notes for delete using (auth.uid() = user_id);
create index if not exists work_task_notes_task_idx on work_task_notes(task_id);
create trigger set_work_task_notes_updated_at before update on work_task_notes
  for each row execute procedure set_updated_at();

-- ── work_subtasks ─────────────────────────────────────────────────────────────
create table if not exists work_subtasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  task_id     uuid references work_tasks on delete cascade,
  title       text not null,
  done        boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table work_subtasks enable row level security;
create policy "wst_select" on work_subtasks for select using (auth.uid() = user_id);
create policy "wst_insert" on work_subtasks for insert with check (auth.uid() = user_id);
create policy "wst_update" on work_subtasks for update using (auth.uid() = user_id);
create policy "wst_delete" on work_subtasks for delete using (auth.uid() = user_id);
create index if not exists work_subtasks_task_idx on work_subtasks(task_id);
create trigger set_work_subtasks_updated_at before update on work_subtasks
  for each row execute procedure set_updated_at();

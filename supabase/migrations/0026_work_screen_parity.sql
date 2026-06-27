-- ============================================================
-- 0026_work_screen_parity
-- Extends the Work schema so the existing Praca screen can move
-- from localStore to Supabase without losing UI fields.
-- ============================================================

alter table public.work_companies
  add column if not exists company text,
  add column if not exists active boolean not null default false;

create index if not exists work_companies_user_active_idx
  on public.work_companies(user_id, active);

alter table public.work_projects
  add column if not exists description text not null default '',
  add column if not exists deadline date,
  add column if not exists progress integer not null default 0,
  add column if not exists notes text not null default '';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'work_projects_progress_range') then
    alter table public.work_projects
      add constraint work_projects_progress_range check (progress between 0 and 100);
  end if;
end $$;

create index if not exists work_projects_user_deadline_idx
  on public.work_projects(user_id, deadline);

alter table public.work_tasks
  add column if not exists company_id uuid references public.work_companies on delete set null,
  add column if not exists parent_task_id uuid references public.work_tasks on delete set null,
  add column if not exists description text not null default '',
  add column if not exists priority text not null default 'mid',
  add column if not exists due_time time,
  add column if not exists notes text not null default '',
  add column if not exists links jsonb not null default '[]'::jsonb;

update public.work_tasks t
set company_id = p.company_id
from public.work_projects p
where t.project_id = p.id
  and t.company_id is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'work_tasks_priority_chk') then
    alter table public.work_tasks
      add constraint work_tasks_priority_chk check (priority in ('low', 'mid', 'high'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'work_tasks_links_array_chk') then
    alter table public.work_tasks
      add constraint work_tasks_links_array_chk check (jsonb_typeof(links) = 'array');
  end if;
end $$;

create index if not exists work_tasks_company_idx
  on public.work_tasks(company_id);

create index if not exists work_tasks_user_due_idx
  on public.work_tasks(user_id, due_date, due_time);

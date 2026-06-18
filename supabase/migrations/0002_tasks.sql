-- ============================================================
-- ROOTINE OS — 0002 Tasks (feeds Start "DZISIAJ" widget)
-- tasks + task_notes + task_checklists. RLS on every table.
-- ============================================================

-- ---------- tasks ----------
create table public.tasks (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  title          text not null default '',
  done           boolean not null default false,
  due_date       date,
  category       text,
  scheduled_time text,                 -- 'HH:MM' (free text for now)
  favorite       boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);
alter table public.tasks enable row level security;
create policy "tasks_select" on public.tasks for select using (auth.uid() = user_id);
create policy "tasks_insert" on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks_update" on public.tasks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tasks_delete" on public.tasks for delete using (auth.uid() = user_id);
create index on public.tasks (user_id);
create index on public.tasks (user_id, due_date);
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.set_updated_at();

-- ---------- task_notes ----------
create table public.task_notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  task_id     uuid not null references public.tasks (id) on delete cascade,
  body        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.task_notes enable row level security;
create policy "task_notes_select" on public.task_notes for select using (auth.uid() = user_id);
create policy "task_notes_insert" on public.task_notes for insert with check (auth.uid() = user_id);
create policy "task_notes_update" on public.task_notes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_notes_delete" on public.task_notes for delete using (auth.uid() = user_id);
create index on public.task_notes (user_id);
create index on public.task_notes (task_id);
create trigger trg_task_notes_updated before update on public.task_notes
  for each row execute function public.set_updated_at();

-- ---------- task_checklists ----------
create table public.task_checklists (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  task_id     uuid not null references public.tasks (id) on delete cascade,
  label       text not null default '',
  done        boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.task_checklists enable row level security;
create policy "task_checklists_select" on public.task_checklists for select using (auth.uid() = user_id);
create policy "task_checklists_insert" on public.task_checklists for insert with check (auth.uid() = user_id);
create policy "task_checklists_update" on public.task_checklists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "task_checklists_delete" on public.task_checklists for delete using (auth.uid() = user_id);
create index on public.task_checklists (user_id);
create index on public.task_checklists (task_id);
create trigger trg_task_checklists_updated before update on public.task_checklists
  for each row execute function public.set_updated_at();

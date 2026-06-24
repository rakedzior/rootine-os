alter table public.tasks
  add column if not exists tags text[] not null default '{}';

create index if not exists tasks_user_tags_idx
  on public.tasks using gin (tags);

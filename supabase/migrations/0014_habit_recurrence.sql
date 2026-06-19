alter table public.habits
  add column if not exists recurrence_type text not null default 'daily',
  add column if not exists weekdays int[] not null default array[1, 2, 3, 4, 5, 6, 7],
  add column if not exists start_date date not null default current_date,
  add column if not exists end_date date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'habits_recurrence_type_chk'
  ) then
    alter table public.habits
      add constraint habits_recurrence_type_chk
      check (recurrence_type in ('daily', 'weekly'));
  end if;
end $$;

create index if not exists habits_user_schedule_idx
  on public.habits (user_id, recurrence_type, start_date, end_date);

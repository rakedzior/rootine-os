# Rootine OS â€” Supabase Schema

## Purpose

This file is the source of truth for database tables, relationships, RLS assumptions and module data contracts.

Agents must update this file whenever they add or change Supabase schema.

## Global conventions

Every private user-owned table should include:

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users(id) on delete cascade
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- optional archived_at timestamptz
- optional deleted_at timestamptz
- optional status text

## RLS convention

For user-owned tables:

alter table table_name enable row level security;

create policy "Users can select own table_name"
on table_name for select
using (auth.uid() = user_id);

create policy "Users can insert own table_name"
on table_name for insert
with check (auth.uid() = user_id);

create policy "Users can update own table_name"
on table_name for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own table_name"
on table_name for delete
using (auth.uid() = user_id);

## Planned modules

### Planner / Tasks

Potential tables:

- tasks
- task_recurrence_rules
- task_instances

Core fields:

- title
- description
- date
- start_time
- end_time
- priority
- status
- source
- parent_task_id
- archived_at
- completed_at

### Habits

Potential tables:

- habits
- habit_recurrence_rules
- habit_completions
- habit_pauses

Core fields:

- name
- description
- is_active
- status
- recurrence_type
- recurrence_interval
- days_of_week
- time_of_day
- start_date
- end_date
- paused_from
- paused_until

### Notes

Potential tables:

- notes
- note_categories
- note_tags
- note_tag_links

Core fields:

- title
- body
- category_id
- pinned
- archived_at

### Documents

Potential tables:

- documents
- document_categories
- document_files

Core fields:

- title
- category
- file_path
- expiration_date
- status
- notes

### Work

Potential tables:

- work_companies
- work_projects
- work_tasks
- work_task_notes
- work_links

Core fields:

- project_id
- parent_task_id
- title
- description
- status
- priority
- due_date

### Travel

Potential tables:

- trips
- trip_itinerary_items
- trip_lodging
- trip_transport
- trip_packing_items
- trip_documents
- trip_budget_items
- trip_notes

### Sport

Potential tables:

- sport_sessions
- sport_templates
- sport_exercises
- sport_session_exercises
- sport_sets
- body_measurements

### Nutrition

Potential tables:

- nutrition_days
- food_entries
- meals
- water_entries
- body_weight_entries

### Goals

Potential tables:

- goals
- goal_milestones
- goal_progress_entries

## Agent instruction

Before adding a table, check:

1. Does a similar table already exist?
2. Does the module already have types/services?
3. Does this data need history?
4. Should delete mean archive instead?
5. What indexes are needed?
6. What RLS policies are needed?

Document final schema here after implementation.
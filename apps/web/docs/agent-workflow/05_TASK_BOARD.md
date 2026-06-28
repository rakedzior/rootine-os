# Rootine OS — Agent Task Board

## Status legend

- TODO
- IN_PROGRESS
- QA
- BLOCKED
- DONE

## Recommended implementation order

1. Orchestrator audit
2. Supabase/data foundation
3. Planner
4. Habits
5. Notes
6. Documents
7. Work
8. Travel
9. Sport
10. Nutrition
11. Goals
12. QA regression
13. Integration/refactor

## Tasks

### 001 — Repository audit

Status: TODO  
Agent: orchestrator_agent  
Goal: Identify routes, modules, mock data, interactions and implementation gaps.

### 002 — Supabase foundation

Status: TODO  
Agent: supabase_data_agent  
Goal: Create or validate shared schema, RLS, migrations and data access conventions.

### 003 — Planner implementation

Status: TODO  
Agent: planner_agent  
Goal: Implement task/calendar/quick-add/task-detail/recurrence flows.

### 004 — Habits implementation

Status: TODO  
Agent: habits_agent  
Goal: Implement habit CRUD, active state, recurrence, completion and calendar history.

### 005 — Notes implementation

Status: TODO  
Agent: notes_agent  
Goal: Implement notes CRUD, categories, tags, search and editor state.

### 006 — Documents implementation

Status: TODO  
Agent: documents_agent  
Goal: Implement documents CRUD, metadata, categories and file storage if present.

### 007 — Work implementation

Status: TODO  
Agent: work_agent  
Goal: Implement projects, tasks, nested subtasks, statuses, notes and links.

### 008 — Travel implementation

Status: TODO  
Agent: travel_agent  
Goal: Implement trips, itinerary, lodging, transport, packing, documents, budget and notes.

### 009 — Sport implementation

Status: TODO  
Agent: sport_agent  
Goal: Implement sport sessions, templates, exercises, sets, history and measurements.

### 010 — Nutrition implementation

Status: TODO  
Agent: nutrition_agent  
Goal: Implement food entries, meals, macros, water and weight/measurement tracking.

### 011 — Goals implementation

Status: TODO  
Agent: goals_agent  
Goal: Implement goals, milestones and progress.

### 012 — QA regression

Status: TODO  
Agent: qa_agent  
Goal: Verify build, lint, behavior, Supabase integration and UI consistency.

### 013 — Integration/refactor

Status: TODO  
Agent: integration_agent  
Goal: Deduplicate shared patterns after module implementation.
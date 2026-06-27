# Module Spec — Planner / Start

## Goal

Implement the main planning experience: tasks, calendar interactions, quick add, task details and recurrence.

## Required functionality

- Task list.
- Calendar day selection.
- Add task from calendar.
- Add task from quick input.
- Open task details.
- Edit task.
- Delete/archive task.
- Change status:
  - planned
  - in progress
  - completed
  - cancelled/archived if needed
- Set date.
- Set time.
- Set priority.
- Optional description.
- Recurring tasks.
- Planned / active / completed filtering if visible in UI.

## Graphite Cool Ice v3 rules

- Planner should focus on tasks, habits and calendar.
- Prefer left panel for Tasks + Habits and right panel for Calendar if current layout allows it.
- Calendar cells should use surface-calendar.
- Selected day should use subtle ice border, not full bright fill.
- Task rows should be compact and calm.
- Habit tiles should be compact and text-based, not icon-heavy.

## Important UX rules

- Calendar and task list should remain synchronized.
- Task details should not hide quick-add flow unless the UI explicitly requires it.
- If a detailed window opens from a task/calendar action, all save/cancel/delete actions must work.
- Do not redesign the existing planner layout.

## Data needs

Potential tables:

- tasks
- task_recurrence_rules
- task_instances

## Acceptance criteria

- User can create a task.
- User can edit a task.
- User can complete a task.
- User can delete/archive a task.
- User can refresh the page and still see saved tasks.
- Calendar state matches task state.
- Build/lint pass or issues are documented.
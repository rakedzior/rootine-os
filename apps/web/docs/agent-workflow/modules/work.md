# Module Spec — Work

## Goal

Implement a practical work/project/task system similar to a simplified Asana.

## Required functionality

- Companies/workspaces if UI supports them.
- Projects.
- Tasks.
- Nested subtasks.
- Task statuses.
- Deadlines.
- Notes per task.
- Links per task/project if UI supports them.
- Active selected task/project.
- Filters if visible.

## Nested subtasks

Use parent_task_id where possible.

Do not attempt infinite UI recursion if the current UI cannot support it safely.

Implement the data model in a way that can support nested subtasks.

## Graphite Cool Ice v3 rules

- Work should look professional, not colorful.
- Statuses should be chips, not large colored blocks.
- Kanban columns use surface-raised.
- Task cards use surface-elevated.
- In progress uses accent-ice.
- Done uses success.
- Blocked uses warning.
- Urgent uses hot very rarely.

## Data needs

Potential tables:

- work_companies
- work_projects
- work_tasks
- work_task_notes
- work_links

## Acceptance criteria

- User can create projects.
- User can create tasks.
- User can create subtasks.
- User can change statuses.
- User can edit/delete/archive work items.
- Data persists after refresh.
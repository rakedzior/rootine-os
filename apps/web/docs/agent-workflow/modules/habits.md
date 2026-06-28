# Module Spec — Habits

## Goal

Implement a simple, practical habit tracker with CRUD, active visibility, recurrence and completion history.

## Required functionality

- List all habits.
- Add habit.
- Edit habit.
- Delete/archive habit.
- Active/inactive checkbox.
- Pause/stop habit.
- Configure recurrence:
  - selected days of week
  - every X weeks
  - every X months
  - specific time
  - start date
  - optional end date
- Mark habit as completed.
- Show completion history on calendar after selecting a habit.
- Show active habits in the main overview if this UI exists.

## Out of scope unless already visible

- Advanced KPI analytics.
- Complex streak dashboards.
- Overloaded charts.

## Graphite Cool Ice v3 rules

- Habit tiles should be compact.
- Use graphite elevated cards.
- Completion should use status-success.
- Active or selected habit can use subtle ice border.
- Avoid large colorful habit cards.
- Avoid icon overload.

## Data needs

Potential tables:

- habits
- habit_recurrence_rules
- habit_completions
- habit_pauses

## Acceptance criteria

- User can create a habit.
- User can edit a habit.
- User can archive/delete a habit.
- User can activate/deactivate a habit.
- User can pause a habit.
- User can define recurrence.
- User can mark completion.
- Completion history persists.
- Active habits appear where expected.
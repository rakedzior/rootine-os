# Module Spec â€” Goals

## Goal

Implement goal tracking with milestones and progress.

## Required functionality

- List goals.
- Create goal.
- Edit goal.
- Archive/delete goal.
- Goal status.
- Milestones if visible.
- Progress entries if visible.
- Deadline if visible.
- Notes if visible.

## Graphite Cool Ice v3 rules

- Goals should use folder-like long-term goal structures.
- Avoid large KPI blocks.
- Progress uses subtle ice bars/rings.
- Important milestones can use accent-special.
- Avoid hot pink unless truly urgent/special.

## Data needs

Potential tables:

- goals
- goal_milestones
- goal_progress_entries

## Acceptance criteria

- User can create a goal.
- User can update progress.
- User can archive/delete.
- Data persists after refresh.
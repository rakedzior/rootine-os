# Rootine OS — Product Rules

## Core principle

Rootine OS is a practical personal operating system.

It should help the user manage life modules without feeling overloaded.

## Main modules

- Start / Planner
- Habits
- Sport
- Nutrition
- Goals
- Notes
- Office / Admin
- Work
- Travel
- Documents

## UX principles

1. The UI already exists. Preserve it.
2. Do not redesign screens unless an interaction is impossible to implement without a small UI adjustment.
3. Avoid overloaded dashboards.
4. Prefer one focused main panel and contextual details in modals, drawers or detail panels.
5. Every visible element that looks clickable must either work or be clearly disabled.
6. Keep workflows fast:
   - quick add
   - inline edit where appropriate
   - minimal required fields
   - progressive disclosure for advanced options
7. Use consistent states:
   - loading
   - empty
   - error
   - saving
   - saved
   - archived
   - paused
   - active/inactive

## Data principles

1. User data is private by default.
2. Every user-owned table should have user_id.
3. Prefer soft delete / archive over hard delete.
4. Important historical data should not disappear accidentally.
5. Keep relations explicit and queryable.
6. Avoid duplicating business logic across modules.

## Acceptance principle

A module is not finished until:

- all visible buttons work
- CRUD works
- data persists in Supabase
- empty/loading/error states exist
- the UI remains consistent with Graphite Cool Ice v3
- build/lint pass or known unrelated issues are documented
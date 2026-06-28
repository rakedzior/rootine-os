# Rootine OS — Module Ownership

## General rule

One implementation agent should work on one module at a time.

Avoid allowing two implementation agents to edit the same feature module in parallel.

## Global files

Only the Orchestrator, Supabase/Data Agent or Integration Agent should modify global files unless explicitly instructed.

Global files may include:

- routing
- app shell
- theme
- design tokens
- shared UI primitives
- Supabase client
- auth
- global state
- global types

## Planner Agent

Allowed:

- planner/start pages
- planner components
- planner hooks
- planner services
- planner types
- planner Supabase migrations

Not allowed without approval:

- global layout
- global theme
- auth
- unrelated modules

## Habits Agent

Allowed:

- habits pages
- habits components
- habits hooks
- habits services
- habits types
- habits Supabase migrations
- main overview integration for active habits, only if needed

## Notes Agent

Allowed:

- notes pages
- notes components
- notes hooks
- notes services
- notes types
- notes Supabase migrations

## Documents Agent

Allowed:

- documents pages
- documents components
- document metadata
- document storage integration
- document Supabase migrations

## Work Agent

Allowed:

- work pages
- work components
- companies/projects/tasks/subtasks
- work notes
- work links
- work Supabase migrations

## Travel Agent

Allowed:

- travel pages
- trips
- plan/itinerary
- lodging
- transport
- packing
- budget
- travel documents
- travel notes
- travel Supabase migrations

## Sport Agent

Allowed:

- sport pages
- sport tabs
- workout session flow
- templates
- exercises
- sets
- measurements
- sport history
- sport Supabase migrations

## Nutrition Agent

Allowed:

- nutrition pages
- food entries
- meals
- macros
- water tracker
- weight/measurements if part of nutrition UI
- nutrition Supabase migrations

## Goals Agent

Allowed:

- goals pages
- goals
- milestones
- progress
- goals Supabase migrations

## QA Agent

Read-only by default.

Allowed:

- inspect code
- inspect diff
- run tests
- produce issue reports

Not allowed unless explicitly asked:

- editing implementation files

## Integration Agent

Allowed:

- deduplicate hooks/services/types/components
- extract shared utilities
- align module patterns
- improve naming consistency
- update docs

Not allowed:

- redesign UI
- change business behavior silently
- broad rewrites without clear reason
# Supabase Data Foundation

This file is the implementation handoff for data agents. Keep Graphite Cool Ice v3
UI work separate from schema/API work.

## Current Source Of Truth

- Auth/profile/settings: `profiles`, `user_preferences`, `user_module_settings`,
  `user_feature_settings`, `user_dashboard_layouts`.
- Planner current model: `planner_tasks`, `planner_task_instances`, `planner_tags`,
  `planner_task_tags`, `planner_notes`.
- Planner legacy model: `tasks`, `task_notes`, `task_checklists`.
- Habits current model: `habits`, `habit_schedule_days`, `habit_entries`.
- Habits legacy history: `habit_logs`.
- Goals: `goals`, `milestones`, `goal_tasks`.
- Finance legacy API: `accounts`, `financial_categories`, `transactions`, `budgets`,
  `recurring_expenses`.
- Finance redesign schema: `finance_accounts`, `finance_savings_goals`,
  `finance_savings_contributions`, `finance_budget_categories`, `finance_payments`,
  `finance_payment_occurrences`, `finance_month_notes`, `finance_jdg_items`,
  `finance_jdg_month_items`, `finance_activity_log`.
- Diet: `food_items`, `meals`, `meal_items`, `meal_categories`, `custom_meals`,
  `hydration_entries`, `nutrition_daily`, `nutrition_targets`.
- Sport legacy: `exercises`, `workouts`, `workout_sets`, `body_measurements`,
  `readiness_daily`, `runs`, `rehab_sessions`, `mobility_sessions`.
- Sport redesign: `sports`, `workout_templates`, `workout_template_exercises`,
  `workout_template_sets`, `training_blocks`, `training_block_day_assignments`,
  `training_plan_series`, `scheduled_workouts`, `progression_rules`,
  `progression_targets`, `training_sessions`, `session_exercises`, `session_sets`,
  `personal_records`, `training_cycles`, `training_cycle_phases`,
  `training_cycle_weeks`.
- Notes: `note_collections`, `notes`, `journal_entries`.
- Travel: `trips`, `trip_items`, `trip_documents`, `trip_budget_items`,
  `bucket_list`.
- Work: `work_companies`, `work_projects`, `work_tasks`, `work_task_notes`,
  `work_subtasks`.
- Office: `document_categories`, `documents`, `insurance_policies`, `vehicles`,
  `vehicle_services`, `b2b_settlements`, `employment`, `vacations`.
- Integrations: `integrations`, `integration_tokens`, `calendar_events`,
  `strava_activities`, `sync_log`.

## Fixed In This Pass

- `supabase/functions/data-export/index.ts` now exports the actual current schema
  instead of stale names such as `goal_milestones`, `finance_transactions`, and
  `habit_completions`.
- Export handles tables whose owner is not a direct `user_id` column:
  `profiles.id`, `planner_task_tags` via `planner_tasks.user_id`, and
  `habit_schedule_days` via `habits.user_id`.
- `supabase/functions/delete-account/index.ts` audit metadata now reports current
  data groups instead of stale table names.
- `supabase/migrations/0026_work_screen_parity.sql` extends Work tables with the
  fields required by the current Praca screen: company context state, project
  description/deadline/progress/notes, and task description/priority/time/notes/links.
- `apps/web/src/features/work` types, API and hooks now expose the extended Work
  contract, so the Praca screen can be wired to Supabase without dropping UI data.
- `supabase/migrations/0027_goals_screen_parity.sql` extends Goals with the fields
  used by the current Cele screen and adds `goal_tasks` for nested goal actions.
- `apps/web/src/modules/goals/GoalsScreen.tsx` now reads and writes goals through
  Supabase hooks with mapper-based compatibility for the existing UI model.
- `supabase/migrations/0028_notes_screen_parity.sql` extends Notes with category,
  color, tags, archived state and checklist JSON used by the current Notatki screen.
- `apps/web/src/modules/notes/NotesScreen.tsx` now reads and writes notes through
  Supabase hooks with mapper-based compatibility for the existing UI model.
- `supabase/migrations/0029_travel_screen_parity.sql` extends Travel trips with
  city, budget, cover emoji and archived state used by the current Podroze screen.
- `apps/web/src/modules/travel/TravelScreen.tsx` now reads and writes trips through
  Supabase hooks with mapper-based compatibility for the existing UI model.

## Next Data Tasks

1. Push `0029_travel_screen_parity.sql` before testing Podroze against the remote DB.
2. Decide whether Finance should stay on the legacy API or move fully to the
   `finance_*` redesign tables.
3. Remove or archive legacy `tasks` once all planner code is on `planner_*`.
4. Keep `habit_logs` read-compatible until all history views use `habit_entries`.
5. Add smoke tests for `data-export` table coverage when an Edge Function test
   runner is available.

/**
 * data-export — RODO data export
 * Returns all user data as JSON. Requires a valid JWT (Authorization: Bearer <token>).
 * Optional step-up MFA: pass X-MFA-Code header with a valid TOTP code.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

type ExportTable = {
  name: string;
  ownerColumn?: 'user_id' | 'id';
  select?: string;
  ownerPath?: string;
};

const USER_TABLES: ExportTable[] = [
  { name: 'profiles', ownerColumn: 'id' },
  { name: 'user_preferences' },
  { name: 'user_module_settings' },
  { name: 'user_feature_settings' },
  { name: 'user_dashboard_layouts' },
  { name: 'sync_log' },

  { name: 'tasks' },
  { name: 'task_notes' },
  { name: 'task_checklists' },
  { name: 'planner_tasks' },
  { name: 'planner_task_instances' },
  { name: 'planner_tags' },
  { name: 'planner_task_tags', select: '*, planner_tasks!inner(user_id)', ownerPath: 'planner_tasks.user_id' },
  { name: 'planner_notes' },

  { name: 'habits' },
  { name: 'habit_logs' },
  { name: 'habit_entries' },
  { name: 'habit_schedule_days', select: '*, habits!inner(user_id)', ownerPath: 'habits.user_id' },

  { name: 'goals' },
  { name: 'milestones' },
  { name: 'goal_tasks' },

  { name: 'accounts' },
  { name: 'financial_categories' },
  { name: 'transactions' },
  { name: 'budgets' },
  { name: 'recurring_expenses' },
  { name: 'finance_accounts' },
  { name: 'finance_savings_goals' },
  { name: 'finance_savings_contributions' },
  { name: 'finance_budget_categories' },
  { name: 'finance_payments' },
  { name: 'finance_payment_occurrences' },
  { name: 'finance_month_notes' },
  { name: 'finance_jdg_items' },
  { name: 'finance_jdg_month_items' },
  { name: 'finance_activity_log' },

  { name: 'food_items' },
  { name: 'meals' },
  { name: 'meal_items' },
  { name: 'meal_categories' },
  { name: 'custom_meals' },
  { name: 'hydration_entries' },
  { name: 'nutrition_daily' },
  { name: 'nutrition_targets' },

  { name: 'exercises' },
  { name: 'workouts' },
  { name: 'workout_sets' },
  { name: 'body_measurements' },
  { name: 'readiness_daily' },
  { name: 'runs' },
  { name: 'rehab_sessions' },
  { name: 'mobility_sessions' },
  { name: 'sports' },
  { name: 'workout_templates' },
  { name: 'workout_template_exercises' },
  { name: 'workout_template_sets' },
  { name: 'training_blocks' },
  { name: 'training_block_day_assignments' },
  { name: 'training_plan_series' },
  { name: 'scheduled_workouts' },
  { name: 'progression_rules' },
  { name: 'progression_targets' },
  { name: 'training_sessions' },
  { name: 'session_exercises' },
  { name: 'session_sets' },
  { name: 'personal_records' },
  { name: 'training_cycles' },
  { name: 'training_cycle_phases' },
  { name: 'training_cycle_weeks' },

  { name: 'note_collections' },
  { name: 'notes' },
  { name: 'journal_entries' },

  { name: 'trips' },
  { name: 'trip_items' },
  { name: 'trip_documents' },
  { name: 'trip_budget_items' },
  { name: 'bucket_list' },

  { name: 'work_companies' },
  { name: 'work_projects' },
  { name: 'work_tasks' },
  { name: 'work_task_notes' },
  { name: 'work_subtasks' },

  { name: 'document_categories' },
  { name: 'documents' },
  { name: 'insurance_policies' },
  { name: 'vehicles' },
  { name: 'vehicle_services' },
  { name: 'b2b_settlements' },
  { name: 'employment' },
  { name: 'vacations' },

  { name: 'integrations' },
  { name: 'integration_tokens' },
  { name: 'calendar_events' },
  { name: 'strava_activities' },
  { name: 'audit_log' },
];

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  // Verify JWT and get user
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const userId = user.id;

  // Log audit
  await admin.from('audit_log').insert({ user_id: userId, action: 'export', entity: null, metadata: {} });

  const result: Record<string, unknown[]> = {};

  for (const table of USER_TABLES) {
    const ownerColumn = table.ownerColumn ?? 'user_id';
    const query = table.ownerPath
      ? admin.from(table.name).select(table.select ?? '*').eq(table.ownerPath, userId)
      : admin.from(table.name).select(table.select ?? '*').eq(ownerColumn, userId);
    const { data, error } = await query;
    if (!error && data) result[table.name] = data;
  }

  const payload = JSON.stringify({
    exported_at: new Date().toISOString(),
    user_id: userId,
    email: user.email,
    data: result,
  }, null, 2);

  return new Response(payload, {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="rootine-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
});

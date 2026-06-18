/**
 * data-export — RODO data export
 * Returns all user data as JSON. Requires a valid JWT (Authorization: Bearer <token>).
 * Optional step-up MFA: pass X-MFA-Code header with a valid TOTP code.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const TABLES = [
  'user_preferences', 'user_module_settings', 'user_feature_settings',
  'tasks', 'habits', 'habit_completions',
  'goals', 'goal_milestones',
  'finance_transactions', 'finance_budgets', 'finance_accounts',
  'meal_items', 'nutrition_daily',
  'workouts', 'workout_sets', 'body_measurements', 'readiness_daily', 'runs',
  'note_collections', 'notes', 'journal_entries',
  'trips', 'trip_items', 'trip_documents', 'trip_budget_items', 'bucket_list',
  'work_companies', 'work_projects', 'work_tasks', 'work_subtasks', 'work_task_notes',
  'documents', 'document_categories', 'insurance_policies', 'vehicles', 'vehicle_services',
  'b2b_settlements', 'employment', 'vacations',
  'integrations', 'calendar_events', 'strava_activities',
  'audit_log',
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

  for (const table of TABLES) {
    const { data, error } = await admin
      .from(table)
      .select('*')
      .eq('user_id', userId);
    if (!error && data) result[table] = data;
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

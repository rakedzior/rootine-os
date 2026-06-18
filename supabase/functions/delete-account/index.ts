/**
 * delete-account — RODO right to erasure
 * Deletes all user data across all tables, then removes the auth user.
 * Requires valid JWT + confirmation body: { confirm: "DELETE MY ACCOUNT" }
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

// Tables with user_id that cascade from auth.users (ON DELETE CASCADE)
// Listed here for audit logging only — cascade handles actual deletion.
const AUDIT_TABLES = ['tasks', 'habits', 'finance_transactions', 'notes', 'trips', 'documents'];

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Unauthorized', { status: 401 });

  const body = await req.json().catch(() => ({})) as { confirm?: string };
  if (body.confirm !== 'DELETE MY ACCOUNT') {
    return new Response(JSON.stringify({ error: 'Confirmation phrase required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return new Response('Unauthorized', { status: 401 });

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const userId = user.id;

  // Final audit log before deletion
  await admin.from('audit_log').insert({
    user_id: userId, action: 'account_delete', entity: null,
    metadata: { tables_affected: AUDIT_TABLES, timestamp: new Date().toISOString() },
  });

  // Delete auth user — cascades to all tables with FK on auth.users ON DELETE CASCADE
  const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return new Response(JSON.stringify({ error: deleteErr.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

import { supabase } from './supabase';

export type AuditAction =
  | 'login'
  | 'login_failed'
  | 'logout'
  | 'password_change'
  | 'security_change'
  | 'finance_change'
  | 'document_access'
  | 'export'
  | 'account_delete'
  | 'integration_connect'
  | 'integration_disconnect';

/** Best-effort client-side audit entry. Server-side events (e.g. failed
 *  logins for an unauthenticated user) are logged by Edge Functions. */
export async function logAudit(
  action: AuditAction,
  opts: { entity?: string; metadata?: Record<string, unknown> } = {},
): Promise<void> {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return; // RLS would reject anyway
  await supabase.from('audit_log').insert({
    user_id: userId,
    action,
    entity: opts.entity ?? null,
    metadata: opts.metadata ?? {},
  });
}

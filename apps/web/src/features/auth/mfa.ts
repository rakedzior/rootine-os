import { supabase } from '@/lib/supabase';

/** True if the current session has a verified TOTP factor and is still at
 *  aal1 — i.e. the user must enter a code to step up to aal2. */
export async function needsMfaStepUp(): Promise<boolean> {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || !data) return false;
  return data.nextLevel === 'aal2' && data.currentLevel !== 'aal2';
}

/** The id of the user's verified TOTP factor, if any. */
export async function getVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error || !data) return null;
  const factor = data.totp?.find((f) => f.status === 'verified');
  return factor?.id ?? null;
}

/** Challenge + verify a TOTP code in one call (used at login step-up and at
 *  enrollment activation). */
export async function verifyTotpCode(factorId: string, code: string) {
  return supabase.auth.mfa.challengeAndVerify({ factorId, code });
}

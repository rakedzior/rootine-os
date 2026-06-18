import { z } from 'zod';
import zxcvbn from 'zxcvbn';

export const emailSchema = z.string().trim().email('Podaj poprawny adres e-mail');

/** Strong password policy: min 12 chars + zxcvbn strength >= 3. */
export const passwordSchema = z
  .string()
  .min(12, 'Hasło musi mieć co najmniej 12 znaków')
  .max(128, 'Hasło jest za długie (max 128 znaków)');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Podaj hasło'),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Hasła nie są takie same',
  })
  .refine((d) => zxcvbn(d.password).score >= 3, {
    path: ['password'],
    message: 'Hasło jest zbyt łatwe do odgadnięcia — wydłuż je lub dodaj losowości',
  });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Hasła nie są takie same' })
  .refine((d) => zxcvbn(d.password).score >= 3, {
    path: ['password'],
    message: 'Hasło jest zbyt łatwe do odgadnięcia',
  });

const STRENGTH_LABELS = ['Bardzo słabe', 'Słabe', 'Średnie', 'Dobre', 'Bardzo dobre'];

export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '—' };
  const { score } = zxcvbn(pw);
  return { score, label: STRENGTH_LABELS[score] ?? '—' };
}

/** HaveIBeenPwned k-anonymity check — best-effort, never blocks signup.
 *  Returns true if breached, false if clean, null if the check failed. */
export async function isPasswordPwned(pw: string): Promise<boolean | null> {
  try {
    const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pw));
    const hash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return null;
    const body = await res.text();
    return body
      .split('\n')
      .some((line) => line.split(':')[0].trim().toUpperCase() === suffix);
  } catch {
    return null;
  }
}

/** Collapse Zod issues into a field->message map. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0]?.toString() ?? '_';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

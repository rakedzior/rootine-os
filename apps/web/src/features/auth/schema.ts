import { z } from 'zod';

export const emailSchema = z.string().trim().email('Podaj poprawny adres e-mail');

/** Strong password policy: min 12 chars + local entropy checks. */
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
  .refine((d) => passwordStrength(d.password).score >= 3, {
    path: ['password'],
    message: 'Hasło jest zbyt łatwe do odgadnięcia — wydłuż je lub dodaj losowości',
  });

export const newPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { path: ['confirm'], message: 'Hasła nie są takie same' })
  .refine((d) => passwordStrength(d.password).score >= 3, {
    path: ['password'],
    message: 'Hasło jest zbyt łatwe do odgadnięcia',
  });

const STRENGTH_LABELS = ['Bardzo słabe', 'Słabe', 'Średnie', 'Dobre', 'Bardzo dobre'];
const COMMON_PASSWORD_PARTS = ['password', 'haslo', 'hasło', 'qwerty', 'admin', 'rootine', '123456', '111111'];

function hasSequence(pw: string): boolean {
  const s = pw.toLowerCase();
  for (let i = 0; i <= s.length - 4; i += 1) {
    const chars = s.slice(i, i + 4).split('').map((c) => c.charCodeAt(0));
    const ascending = chars.every((code, idx) => idx === 0 || code === chars[idx - 1] + 1);
    const descending = chars.every((code, idx) => idx === 0 || code === chars[idx - 1] - 1);
    if (ascending || descending) return true;
  }
  return false;
}

export function passwordStrength(pw: string): { score: number; label: string } {
  if (!pw) return { score: 0, label: '—' };
  const classes = [
    /[a-z]/.test(pw),
    /[A-Z]/.test(pw),
    /\d/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ].filter(Boolean).length;
  const uniqueRatio = new Set(pw).size / pw.length;
  let score = 0;
  if (pw.length >= 12) score += 1;
  if (pw.length >= 16) score += 1;
  if (pw.length >= 20) score += 1;
  if (classes >= 3) score += 1;
  if (classes >= 4 && uniqueRatio > 0.55) score += 1;
  if (COMMON_PASSWORD_PARTS.some((part) => pw.toLowerCase().includes(part))) score -= 1;
  if (/(.)\1{3,}/.test(pw) || hasSequence(pw)) score -= 1;
  score = Math.max(0, Math.min(4, score));
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

import { createClient } from '@supabase/supabase-js';

// Anon (public) key only. The service-role key must never reach the client —
// privileged work happens in Supabase Edge Functions.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  // Don't throw at import time during early scaffolding, but make it loud.
  // eslint-disable-next-line no-console
  console.warn(
    '[Rootine OS] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.',
  );
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

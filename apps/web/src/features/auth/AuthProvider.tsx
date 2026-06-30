import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { loadUserTheme } from '@/lib/theme';
import { QA_AUTH_ENABLED, QA_USER_EMAIL, QA_USER_ID } from './qaAuth';

interface AuthState {
  session: Session | null;
  loading: boolean;
}

const qaSession = {
  access_token: 'rootine-qa-access-token',
  refresh_token: 'rootine-qa-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: QA_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email: QA_USER_EMAIL,
    email_confirmed_at: new Date(0).toISOString(),
    confirmed_at: new Date(0).toISOString(),
    app_metadata: {},
    user_metadata: {},
    created_at: new Date(0).toISOString(),
  },
} as Session;

const AuthContext = createContext<AuthState>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => (
    QA_AUTH_ENABLED ? { session: qaSession, loading: false } : { session: null, loading: true }
  ));

  useEffect(() => {
    if (QA_AUTH_ENABLED) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState({ session: data.session, loading: false });
      if (data.session) loadUserTheme();
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ session, loading: false });
      if (session) loadUserTheme();
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

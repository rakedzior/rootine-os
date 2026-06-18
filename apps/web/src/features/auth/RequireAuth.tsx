import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';

/** Gate for protected routes:
 *  - no session  -> /login
 *  - session but email not confirmed -> /confirm-email (no data access)
 *  - otherwise render the app. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-wrap">
        <div className="auth-sub">Ładowanie…</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const confirmed = Boolean(session.user.email_confirmed_at ?? session.user.confirmed_at);
  if (!confirmed) {
    return <Navigate to="/confirm-email" replace />;
  }

  return <>{children}</>;
}

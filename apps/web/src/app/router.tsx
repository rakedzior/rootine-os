import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/features/auth/RequireAuth';

const Login = lazy(() => import('@/features/auth/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('@/features/auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('@/features/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/features/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const ConfirmEmail = lazy(() => import('@/features/auth/ConfirmEmail').then((m) => ({ default: m.ConfirmEmail })));
const StartScreen = lazy(() => import('@/modules/start/StartScreen').then((m) => ({ default: m.StartScreen })));
const SportScreen = lazy(() => import('@/modules/sport/SportScreen').then((m) => ({ default: m.SportScreen })));
const DietScreen = lazy(() => import('@/modules/diet/DietScreen').then((m) => ({ default: m.DietScreen })));
const FinanceScreen = lazy(() => import('@/modules/finance/FinanceScreen').then((m) => ({ default: m.FinanceScreen })));
const GoalsScreen = lazy(() => import('@/modules/goals/GoalsScreen').then((m) => ({ default: m.GoalsScreen })));
const BiuroScreen = lazy(() => import('@/modules/office/BiuroScreen').then((m) => ({ default: m.BiuroScreen })));
const TravelScreen = lazy(() => import('@/modules/travel/TravelScreen').then((m) => ({ default: m.TravelScreen })));
const NotesScreen = lazy(() => import('@/modules/notes/NotesScreen').then((m) => ({ default: m.NotesScreen })));
const PracaScreen = lazy(() => import('@/modules/work/PracaScreen').then((m) => ({ default: m.PracaScreen })));
const SettingsScreen = lazy(() => import('@/features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

function RouteFallback() {
  return (
    <div className="module-page">
      <div style={{ padding: 'var(--gap)', maxWidth: 1640, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        <div className="skeleton" style={{ height: 160, borderRadius: 12 }} />
      </div>
    </div>
  );
}

function lazyRoute(element: ReactNode) {
  return <Suspense fallback={<RouteFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  // ---- public auth routes ----
  { path: '/login', element: lazyRoute(<Login />) },
  { path: '/register', element: lazyRoute(<Register />) },
  { path: '/forgot-password', element: lazyRoute(<ForgotPassword />) },
  { path: '/reset-password', element: lazyRoute(<ResetPassword />) },
  { path: '/confirm-email', element: lazyRoute(<ConfirmEmail />) },

  // ---- protected app ----
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: lazyRoute(<StartScreen />) },
      { path: 'sport', element: lazyRoute(<SportScreen />) },
      { path: 'diet', element: lazyRoute(<DietScreen />) },
      { path: 'finance', element: lazyRoute(<FinanceScreen />) },
      { path: 'goals', element: lazyRoute(<GoalsScreen />) },
      { path: 'office', element: lazyRoute(<BiuroScreen />) },
      { path: 'travel', element: lazyRoute(<TravelScreen />) },
      { path: 'notes', element: lazyRoute(<NotesScreen />) },
      { path: 'work', element: lazyRoute(<PracaScreen />) },
      { path: 'settings', element: lazyRoute(<SettingsScreen />) },
      { path: 'settings/profile', element: lazyRoute(<SettingsScreen tab="profile" />) },
      { path: 'settings/integrations', element: lazyRoute(<SettingsScreen tab="integrations" />) },
      { path: 'settings/security', element: lazyRoute(<SettingsScreen tab="security" />) },
      { path: 'settings/modules', element: lazyRoute(<SettingsScreen tab="modules" />) },
    ],
  },
]);

import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ModuleScreen } from '@/modules/ModuleScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { Login } from '@/features/auth/Login';
import { Register } from '@/features/auth/Register';
import { ForgotPassword } from '@/features/auth/ForgotPassword';
import { ResetPassword } from '@/features/auth/ResetPassword';
import { ConfirmEmail } from '@/features/auth/ConfirmEmail';

export const router = createBrowserRouter([
  // ---- public auth routes ----
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },
  { path: '/confirm-email', element: <ConfirmEmail /> },

  // ---- protected app ----
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <ModuleScreen moduleKey="start" /> },
      { path: 'sport', element: <ModuleScreen moduleKey="sport" /> },
      { path: 'diet', element: <ModuleScreen moduleKey="diet" /> },
      { path: 'finance', element: <ModuleScreen moduleKey="finance" /> },
      { path: 'goals', element: <ModuleScreen moduleKey="goals" /> },
      { path: 'office', element: <ModuleScreen moduleKey="office" /> },
      { path: 'travel', element: <ModuleScreen moduleKey="travel" /> },
      { path: 'notes', element: <ModuleScreen moduleKey="notes" /> },
      { path: 'work', element: <ModuleScreen moduleKey="work" /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'settings/integrations', element: <SettingsScreen tab="integrations" /> },
      { path: 'settings/security', element: <SettingsScreen tab="security" /> },
      { path: 'settings/modules', element: <SettingsScreen tab="modules" /> },
    ],
  },
]);

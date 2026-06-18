import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StartScreen } from '@/modules/start/StartScreen';
import { GoalsScreen } from '@/modules/goals/GoalsScreen';
import { FinanceScreen } from '@/modules/finance/FinanceScreen';
import { DietScreen } from '@/modules/diet/DietScreen';
import { SportScreen } from '@/modules/sport/SportScreen';
import { BiuroScreen } from '@/modules/office/BiuroScreen';
import { TravelScreen } from '@/modules/travel/TravelScreen';
import { NotesScreen } from '@/modules/notes/NotesScreen';
import { PracaScreen } from '@/modules/work/PracaScreen';
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
      { index: true, element: <StartScreen /> },
      { path: 'sport', element: <SportScreen /> },
      { path: 'diet', element: <DietScreen /> },
      { path: 'finance', element: <FinanceScreen /> },
      { path: 'goals', element: <GoalsScreen /> },
      { path: 'office', element: <BiuroScreen /> },
      { path: 'travel', element: <TravelScreen /> },
      { path: 'notes', element: <NotesScreen /> },
      { path: 'work', element: <PracaScreen /> },
      { path: 'settings', element: <SettingsScreen /> },
      { path: 'settings/integrations', element: <SettingsScreen tab="integrations" /> },
      { path: 'settings/security', element: <SettingsScreen tab="security" /> },
      { path: 'settings/modules', element: <SettingsScreen tab="modules" /> },
    ],
  },
]);

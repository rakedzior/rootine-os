import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { queryClient } from '@/lib/queryClient';
import { router } from './router';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ToastProvider } from '@/components/layout/ToastProvider';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastProvider />
      </AuthProvider>
    </QueryClientProvider>
  );
}

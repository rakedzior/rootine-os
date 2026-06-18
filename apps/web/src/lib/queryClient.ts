import { QueryClient } from '@tanstack/react-query';
import { toast } from './toast';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : 'Nieznany błąd';
        toast.error(msg);
      },
    },
  },
});

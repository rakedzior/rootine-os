import { useEffect, useState } from 'react';
import { subscribeToasts, type Toast } from '@/lib/toast';

const MARK: Record<Toast['type'], string> = {
  success: 'OK',
  error: '!',
  info: 'i',
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsub = subscribeToasts(setToasts);
    return () => {
      unsub();
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-mark">{MARK[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}

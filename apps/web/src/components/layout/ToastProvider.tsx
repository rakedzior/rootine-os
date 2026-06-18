import { useEffect, useState } from 'react';
import { subscribeToasts, type Toast } from '@/lib/toast';

const BG: Record<Toast['type'], string> = {
  success: 'var(--acc-a)',
  error: 'var(--acc-b)',
  info: 'var(--ev-blue)',
};

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => subscribeToasts(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: BG[t.type],
            color: '#fff',
            padding: '10px 16px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            maxWidth: 320,
            animation: 'toast-in 0.18s ease',
          }}
        >
          {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✗ ' : 'ℹ '}{t.message}
        </div>
      ))}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:none; } }`}</style>
    </div>
  );
}

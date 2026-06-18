/** Lightweight toast system — no extra deps.
 *  Usage: toast.success('Zapisano') / toast.error('Błąd')
 *  Renders via <ToastProvider /> mounted in App.tsx. */

type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

type Listener = (toasts: Toast[]) => void;

let _toasts: Toast[] = [];
const _listeners: Set<Listener> = new Set();

function notify() {
  _listeners.forEach((l) => l([..._toasts]));
}

function show(message: string, type: ToastType, duration = 3500) {
  const id = Math.random().toString(36).slice(2);
  _toasts = [..._toasts, { id, message, type }];
  notify();
  setTimeout(() => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, duration);
}

export const toast = {
  success: (msg: string) => show(msg, 'success'),
  error: (msg: string) => show(msg, 'error', 5000),
  info: (msg: string) => show(msg, 'info'),
};

export function subscribeToasts(fn: Listener) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

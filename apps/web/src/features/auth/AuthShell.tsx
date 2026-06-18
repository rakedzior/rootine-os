import type { ReactNode } from 'react';

/** Centered card shell for all public auth screens. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="dot" />
          <span className="wm">
            <b>Rootine</b>&nbsp;OS
          </span>
        </div>
        <h1 className="auth-title">{title}</h1>
        {subtitle && <div className="auth-sub">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

const STRENGTH_COLORS = [
  'var(--acc-b)',
  'var(--acc-b)',
  'var(--ev-blue)',
  'var(--acc-a)',
  'var(--acc-a)',
];

export function PasswordMeter({ score, label }: { score: number; label: string }) {
  const pct = ((score + 1) / 5) * 100;
  return (
    <div className="pw-meter">
      <div className="pw-track">
        <i style={{ width: `${pct}%`, background: STRENGTH_COLORS[score] }} />
      </div>
      <span className="pw-label">{label}</span>
    </div>
  );
}

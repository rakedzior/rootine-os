import { useEffect, useRef, type ReactNode, type FC } from 'react';

// ─── MODAL ───────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, size, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`modal ${sizeClass}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Zamknij">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── CONFIRM DELETE ───────────────────────────────────────────

interface ConfirmDeleteProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  label?: string;
}
export function ConfirmDelete({ open, onClose, onConfirm, label = 'ten element' }: ConfirmDeleteProps) {
  return (
    <Modal open={open} onClose={onClose} title="Usuń" size="sm"
      footer={
        <>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Anuluj</button>
          <button className="btn btn-danger btn-sm" onClick={() => { onConfirm(); onClose(); }}>Usuń</button>
        </>
      }>
      <p style={{ color: 'var(--ink-2)', fontSize: 14 }}>Czy na pewno chcesz usunąć <strong>{label}</strong>? Tej akcji nie można cofnąć.</p>
    </Modal>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  desc?: string;
  cta?: string;
  onCta?: () => void;
  secondary?: string;
  onSecondary?: () => void;
}
export function EmptyState({ icon, title, desc, cta, onCta, secondary, onSecondary }: EmptyStateProps) {
  return (
    <div className="empty-state">
      {icon ?? <DefaultEmptyIcon />}
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
      {cta && <button className="btn btn-primary btn-sm" onClick={onCta} style={{ marginTop: 4 }}>{cta}</button>}
      {secondary && <button className="btn btn-ghost btn-sm" onClick={onSecondary}>{secondary}</button>}
    </div>
  );
}

function DefaultEmptyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 15s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  );
}

// ─── SUB-TABS ─────────────────────────────────────────────────

interface SubTab { id: string; label: string; }
interface SubTabsProps { tabs: SubTab[]; active: string; onChange: (id: string) => void; }
export function SubTabs({ tabs, active, onChange }: SubTabsProps) {
  return (
    <div className="sub-tabs">
      {tabs.map(t => (
        <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── PROGRESS BAR ─────────────────────────────────────────────

interface ProgressBarProps { value: number; max?: number; color?: string; size?: 'sm' | 'md' | 'lg'; }
export function ProgressBar({ value, max = 100, color, size }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const h = size === 'sm' ? 4 : size === 'lg' ? 8 : 6;
  return (
    <div style={{ height: h, borderRadius: 99, background: 'var(--surface-3)', overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color ?? 'var(--green-mid)', transition: 'width .3s' }} />
    </div>
  );
}

// ─── CIRCULAR PROGRESS ───────────────────────────────────────

interface CircularProgressProps { value: number; max?: number; size?: number; strokeWidth?: number; color?: string; children?: ReactNode; }
export function CircularProgress({ value, max = 100, size = 80, strokeWidth = 8, color, children }: CircularProgressProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, (value / max) * 100);
  const offset = c - (c * pct) / 100;
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color ?? 'var(--green-mid)'} strokeWidth={strokeWidth}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      {children && <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>{children}</div>}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  todo:     { label: 'Do zrobienia', cls: 'status-todo' },
  active:   { label: 'W trakcie',    cls: 'status-active' },
  waiting:  { label: 'Oczekuje',     cls: 'status-waiting' },
  done:     { label: 'Zrobione',     cls: 'status-done' },
  blocked:  { label: 'Zablokowane',  cls: 'status-blocked' },
};
export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_MAP[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

// ─── PRIORITY BADGE ───────────────────────────────────────────

const PRIO_MAP: Record<string, { label: string; cls: string }> = {
  low:  { label: '▶ Niski',  cls: 'prio-low' },
  mid:  { label: '▶ Średni', cls: 'prio-mid' },
  high: { label: '▶ Wysoki', cls: 'prio-high' },
};
export function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIO_MAP[priority] ?? { label: priority, cls: 'badge-gray' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

// ─── ICON BUTTON ──────────────────────────────────────────────

interface IcoBtnProps { icon: ReactNode; onClick?: () => void; title?: string; danger?: boolean; }
export function IconBtn({ icon, onClick, title, danger }: IcoBtnProps) {
  return (
    <button
      className="icon-btn"
      onClick={onClick}
      title={title}
      style={danger ? { color: 'var(--p-high)' } : {}}
    >
      {icon}
    </button>
  );
}

export const IcoEdit: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
export const IcoTrash: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
export const IcoPlus: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);
export const IcoCheck: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
export const IcoChevRight: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
export const IcoMore: FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);

// ─── FIELD ────────────────────────────────────────────────────

interface FieldProps { label: string; children: ReactNode; required?: boolean; }
export function Field({ label, children, required }: FieldProps) {
  return (
    <div className="field">
      <label>{label}{required && <span style={{ color: 'var(--p-high)', marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  );
}

// ─── SECTION HEADER ───────────────────────────────────────────

interface SectionHeadProps { title: string; action?: ReactNode; }
export function SectionHead({ title, action }: SectionHeadProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-3)' }}>{title}</span>
      {action}
    </div>
  );
}

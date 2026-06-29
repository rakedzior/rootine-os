import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode, type FC } from 'react';

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
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = window.setTimeout(() => {
      const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      (firstFocusable ?? dialogRef.current)?.focus();
    }, 0);
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      )).filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
      if (!focusable.length) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
      previousFocusRef.current?.focus?.();
      previousFocusRef.current = null;
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onMouseDown={e => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`modal ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-head">
          <span className="modal-title" id={titleId}>{title}</span>
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
  description?: string;
  cta?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  onCta?: () => void;
  secondary?: string;
  onSecondary?: () => void;
  compact?: boolean;
}
export function EmptyState({ icon, title, desc, description, cta, action, onCta, secondary, onSecondary, compact }: EmptyStateProps) {
  const effectiveDesc = desc ?? description;
  const effectiveCta = action?.label ?? cta;
  const effectiveOnCta = action?.onClick ?? onCta;
  return (
    <div className={`empty-state${compact ? ' empty-state-compact' : ''}`}>
      {icon ?? <DefaultEmptyIcon />}
      <h3>{title}</h3>
      {effectiveDesc && <p>{effectiveDesc}</p>}
      {effectiveCta && <button className="btn btn-primary btn-sm" onClick={effectiveOnCta} style={{ marginTop: 4 }}>{action?.icon}{effectiveCta}</button>}
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

interface SubTab { id: string; label: string; icon?: () => ReactNode; }
interface SubTabsProps { tabs: SubTab[]; active: string; onChange: (id: string) => void; }
export function SubTabs({ tabs, active, onChange }: SubTabsProps) {
  return (
    <div className="sub-tabs">
      {tabs.map(t => (
        <button key={t.id} className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
          {t.icon && <span className="sub-tab-icon">{t.icon()}</span>}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── COUNT BADGE / TABS / FILTERS / SEGMENTED CONTROL ─────────────────────

type SharedTone = 'default' | 'muted' | 'info' | 'warning' | 'danger' | 'success';

interface CountBadgeProps {
  value: number | string;
  tone?: SharedTone;
  size?: 'xs' | 'sm' | 'md';
}
export function CountBadge({ value, tone = 'default', size = 'sm' }: CountBadgeProps) {
  return <span className={`count-badge count-badge-${tone} count-badge-${size}`}>{value}</span>;
}

interface FilterChipItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}
interface FilterChipsProps {
  items: FilterChipItem[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}
export function FilterChips({ items, value, onChange, ariaLabel = 'Filtry' }: FilterChipsProps) {
  return (
    <div className="filter-chips" role="group" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.id}
          className={`filter-chip${value === item.id ? ' is-active' : ''}`}
          type="button"
          disabled={item.disabled}
          aria-pressed={value === item.id}
          onClick={() => onChange(item.id)}
        >
          <span>{item.label}</span>
          {typeof item.count !== 'undefined' && <CountBadge value={item.count} tone={value === item.id ? 'info' : 'muted'} size="xs" />}
        </button>
      ))}
    </div>
  );
}

interface AppTabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}
interface AppTabsProps {
  items: AppTabItem[];
  value: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'compact';
  ariaLabel?: string;
}
function moveWithin(items: { id: string; disabled?: boolean }[], value: string, delta: number) {
  const enabled = items.filter((item) => !item.disabled);
  const index = Math.max(0, enabled.findIndex((item) => item.id === value));
  return enabled[(index + delta + enabled.length) % enabled.length]?.id ?? value;
}
export function AppTabs({ items, value, onChange, variant = 'default', ariaLabel = 'Zakładki' }: AppTabsProps) {
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    onChange(moveWithin(items, value, event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <div className={`app-tabs app-tabs-${variant}`} role="tablist" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <button
          key={item.id}
          className={value === item.id ? 'is-active' : ''}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.icon && <span className="app-tab-icon">{item.icon}</span>}
          <span>{item.label}</span>
          {typeof item.count !== 'undefined' && <CountBadge value={item.count} tone={value === item.id ? 'info' : 'muted'} size="xs" />}
        </button>
      ))}
    </div>
  );
}

interface ViewSegment {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
}
interface ViewSegmentedControlProps {
  items: ViewSegment[];
  value: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
  iconOnly?: boolean;
}
export function ViewSegmentedControl({ items, value, onChange, ariaLabel = 'Widok', iconOnly }: ViewSegmentedControlProps) {
  function onKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    onChange(moveWithin(items, value, event.key === 'ArrowRight' ? 1 : -1));
  }

  return (
    <div className={`view-segmented-control${iconOnly ? ' is-icon-only' : ''}`} role="group" aria-label={ariaLabel} onKeyDown={onKeyDown}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={value === item.id ? 'is-active' : ''}
          aria-pressed={value === item.id}
          aria-label={iconOnly ? item.label : undefined}
          title={iconOnly ? item.label : undefined}
          disabled={item.disabled}
          onClick={() => onChange(item.id)}
        >
          {item.icon && <span className="view-segment-icon">{item.icon}</span>}
          {!iconOnly && <span>{item.label}</span>}
        </button>
      ))}
    </div>
  );
}

type DateNavigatorMode = 'day' | 'week' | 'month' | 'range';
type DateNavigatorValue = Date | { start: Date; end: Date };
interface DateNavigatorProps {
  mode: DateNavigatorMode;
  value: DateNavigatorValue;
  onPrevious: () => void;
  onNext: () => void;
  onToday?: () => void;
  onOpenPicker?: () => void;
  label?: string;
}
const MONTHS_FULL = ['styczeń', 'luty', 'marzec', 'kwiecień', 'maj', 'czerwiec', 'lipiec', 'sierpień', 'wrzesień', 'październik', 'listopad', 'grudzień'];
function datePart(date: Date, withWeekday = false) {
  const weekday = withWeekday ? `${date.toLocaleDateString('pl-PL', { weekday: 'long' })}, ` : '';
  return `${weekday}${date.getDate()} ${MONTHS_FULL[date.getMonth()]} ${date.getFullYear()}`;
}
function compactRange(start: Date, end: Date) {
  if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    return `${start.getDate()}-${end.getDate()} ${MONTHS_FULL[end.getMonth()]} ${end.getFullYear()}`;
  }
  return `${datePart(start)} - ${datePart(end)}`;
}
function navigatorLabel(mode: DateNavigatorMode, value: DateNavigatorValue) {
  if ('start' in value) return compactRange(value.start, value.end);
  if (mode === 'month') return `${MONTHS_FULL[value.getMonth()]} ${value.getFullYear()}`;
  if (mode === 'week') {
    const start = new Date(value);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() + 1 - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return compactRange(start, end);
  }
  return datePart(value, mode === 'day');
}
export function DateNavigator({ mode, value, onPrevious, onNext, onToday, onOpenPicker, label }: DateNavigatorProps) {
  const renderedLabel = label ?? navigatorLabel(mode, value);
  return (
    <div className="date-navigator" data-mode={mode}>
      <button className="icon-btn" type="button" onClick={onPrevious} aria-label="Poprzedni okres">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>
      <button className="date-navigator-label" type="button" onClick={onOpenPicker} disabled={!onOpenPicker}>
        {renderedLabel}
      </button>
      <button className="icon-btn" type="button" onClick={onNext} aria-label="Następny okres">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
      {onToday && <button className="btn btn-secondary btn-sm" type="button" onClick={onToday}>Dzisiaj</button>}
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
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: color ?? 'var(--green-mid)' }} />
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
// Unified app-wide statuses (sekcja 16). Aliases map module-specific
// names onto the canonical six so colours stay consistent everywhere.

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  todo:      { label: 'Do zrobienia', cls: 'status-todo' },
  active:    { label: 'W trakcie',    cls: 'status-active' },
  waiting:   { label: 'Oczekuje',     cls: 'status-waiting' },
  done:      { label: 'Zrobione',     cls: 'status-done' },
  overdue:   { label: 'Opóźnione',    cls: 'status-overdue' },
  cancelled: { label: 'Anulowane',    cls: 'status-cancelled' },
  // aliases → canonical
  'in-progress': { label: 'W trakcie',   cls: 'status-active' },
  inprogress:    { label: 'W trakcie',   cls: 'status-active' },
  pending:       { label: 'Oczekuje',    cls: 'status-waiting' },
  blocked:       { label: 'Opóźnione',   cls: 'status-overdue' },
  late:          { label: 'Opóźnione',   cls: 'status-overdue' },
  canceled:      { label: 'Anulowane',   cls: 'status-cancelled' },
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const m = STATUS_MAP[status] ?? { label: label ?? status, cls: 'badge-gray' };
  return <span className={`badge ${m.cls}`}>{label ?? m.label}</span>;
}

// ─── PAGE HEADER ──────────────────────────────────────────────
// One module header for the whole app: icon + title + description + actions.

interface PageHeaderProps {
  icon?: ReactNode;
  title: string;
  desc?: string;
  actions?: ReactNode;
}
export function PageHeader({ icon, title, desc, actions }: PageHeaderProps) {
  return (
    <header className="page-head">
      <div className="page-head-main">
        {icon && <span className="page-head-icon">{icon}</span>}
        <div className="page-head-text">
          <h1>{title}</h1>
          {desc && <p>{desc}</p>}
        </div>
      </div>
      {actions && <div className="page-head-actions">{actions}</div>}
    </header>
  );
}

// ─── KPI CARD ─────────────────────────────────────────────────

type Tone = 'pink' | 'teal' | 'green' | 'amber' | 'red' | 'blue' | 'violet' | 'gray';
interface KpiCardProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  icon?: ReactNode;
}
export function KpiCard({ label, value, sub, tone = 'gray', icon }: KpiCardProps) {
  return (
    <div className="kpi-card" data-tone={tone}>
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

// ─── FILTER BAR ───────────────────────────────────────────────

export function FilterBar({ children }: { children: ReactNode }) {
  return <div className="filter-bar">{children}</div>;
}

interface FilterSelectProps {
  label?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}
export function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <label className="filter-select">
      {label && <span>{label}</span>}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// ─── DETAIL PANEL ─────────────────────────────────────────────
// Shared scaffold for task/training/goal/note/payment/case/trip/project
// detail views. Only the props provided are rendered (sekcja 15).

interface DetailField { label: string; value: ReactNode; }
interface DetailPanelProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badges?: ReactNode;
  fields?: DetailField[];
  actions?: ReactNode;
  onClose?: () => void;
  children?: ReactNode;
}
export function DetailPanel({ title, subtitle, badges, fields, actions, onClose, children }: DetailPanelProps) {
  return (
    <div className="detail-panel">
      <div className="detail-panel-head">
        <div className="detail-panel-title">
          <strong>{title}</strong>
          {subtitle && <span>{subtitle}</span>}
        </div>
        {onClose && (
          <button className="icon-btn" onClick={onClose} aria-label="Zamknij">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      {badges && <div className="detail-panel-badges">{badges}</div>}
      {fields && fields.length > 0 && (
        <dl className="detail-panel-fields">
          {fields.map((f, i) => (
            <div key={i}><dt>{f.label}</dt><dd>{f.value}</dd></div>
          ))}
        </dl>
      )}
      {children}
      {actions && <div className="detail-panel-actions">{actions}</div>}
    </div>
  );
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

// ─── MORE MENU (•••) ──────────────────────────────────────────

export interface MoreMenuItem { label: string; onClick: () => void; danger?: boolean; disabled?: boolean; }
export function MoreMenu({ items, label = 'Więcej' }: { items: MoreMenuItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="more-menu-wrap" ref={ref}>
      <button className="icon-btn" onClick={() => setOpen((v) => !v)} aria-label={label} aria-haspopup="menu" aria-expanded={open}>
        <IcoMore />
      </button>
      {open && (
        <div className="more-menu" role="menu">
          {items.map((it, i) => (
            <button key={i} role="menuitem" className={it.danger ? 'danger' : ''} disabled={it.disabled}
              onClick={() => { setOpen(false); it.onClick(); }}>
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

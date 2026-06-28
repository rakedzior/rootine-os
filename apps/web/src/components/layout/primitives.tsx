import type { CSSProperties, ReactNode } from 'react';

/**
 * Shared layout system. Every tab should compose from these so the whole app
 * keeps one set of margins, gaps, radii, borders and responsive behaviour.
 * Visuals live in styles.css under the `lay-*` namespace.
 */

/** Outer page wrapper — consistent max-width, padding and vertical flow. */
export function PageContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`lay-page ${className}`.trim()}>{children}</div>;
}

/** Full-screen module wrapper: one header rhythm and one scroll/height contract for every app tab. */
export function PageLayout({
  header,
  children,
  className = '',
}: { header: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`module-page ${className}`.trim()}>
      {header}
      <div className="page-body">{children}</div>
    </div>
  );
}

/** Generic responsive grid. `min` controls the smallest column width before wrapping. */
export function ResponsiveModuleGrid({
  children,
  min = 280,
  className = '',
}: { children: ReactNode; min?: number; className?: string }) {
  const style = { '--lay-col-min': `${min}px` } as CSSProperties;
  return <div className={`lay-grid ${className}`.trim()} style={style}>{children}</div>;
}

/** Explicit-column grid (e.g. a 7/3 split) that collapses to one column on narrow screens. */
export function PageGrid({
  children,
  columns = '1fr',
  className = '',
}: { children: ReactNode; columns?: string; className?: string }) {
  const style = { '--lay-cols': columns } as CSSProperties;
  return <div className={`lay-cols ${className}`.trim()} style={style}>{children}</div>;
}

/** A panel/card surface. `span` lets it stretch across grid columns. */
export function ModuleCard({
  children,
  className = '',
  span,
  padded = true,
}: { children: ReactNode; className?: string; span?: number; padded?: boolean }) {
  const style = span ? ({ gridColumn: `span ${span}` } as CSSProperties) : undefined;
  return (
    <section className={`lay-card${padded ? '' : ' lay-card-flush'} ${className}`.trim()} style={style}>
      {children}
    </section>
  );
}

/** Card / section header with optional eyebrow and trailing actions. */
export function ModuleHeader({
  title,
  eyebrow,
  actions,
  className = '',
}: { title: ReactNode; eyebrow?: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <header className={`lay-card-head ${className}`.trim()}>
      <div className="lay-card-head-text">
        {eyebrow && <span className="lay-eyebrow">{eyebrow}</span>}
        <h3 className="lay-card-title">{title}</h3>
      </div>
      {actions && <ModuleActions>{actions}</ModuleActions>}
    </header>
  );
}

/** Trailing action cluster for a header. */
export function ModuleActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`lay-actions ${className}`.trim()}>{children}</div>;
}

/** Scrollable region inside a fixed-height card — the layout never overflows the page. */
export function ScrollableModuleContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`lay-scroll ${className}`.trim()}>{children}</div>;
}

/** Consistent empty state for any module. */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="lay-empty">
      {icon && <div className="lay-empty-ic">{icon}</div>}
      <div className="lay-empty-title">{title}</div>
      {description && <p className="lay-empty-desc">{description}</p>}
      {action && <div className="lay-empty-action">{action}</div>}
    </div>
  );
}

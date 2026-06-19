/** Small hand-rolled SVG chart primitives — no charting lib dependency,
 *  consistent with the rest of the app's inline-SVG style. */

export interface LineChartPoint { label: string; value: number; }

interface LineChartProps {
  points: LineChartPoint[];
  color?: string;
  height?: number;
  unit?: string;
}

export function LineChart({ points, color = 'var(--acc)', height = 90, unit = '' }: LineChartProps) {
  if (points.length === 0) return <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Brak danych.</div>;
  const values = points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 100;
  const stepX = points.length > 1 ? w / (points.length - 1) : 0;
  const coords = points.map((p, i) => {
    const x = points.length > 1 ? i * stepX : w / 2;
    const y = height - ((p.value - min) / range) * (height - 16) - 6;
    return { x, y, ...p };
  });
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x},${c.y}`).join(' ');
  const areaPath = `${path} L${coords[coords.length - 1].x},${height} L${coords[0].x},${height} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <path d={areaPath} fill={color} opacity={0.12} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={1.6} fill={color}>
            <title>{c.label}: {c.value}{unit}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {points.map((p, i) => (
          (points.length <= 8 || i === 0 || i === points.length - 1 || i % Math.ceil(points.length / 6) === 0) ? (
            <span key={i} style={{ fontSize: 9.5, color: 'var(--ink-4)' }}>{p.label}</span>
          ) : <span key={i} />
        ))}
      </div>
    </div>
  );
}

export interface DonutSlice { label: string; value: number; color: string; }

interface DonutChartProps { slices: DonutSlice[]; size?: number; strokeWidth?: number; centerLabel?: string; }

export function DonutChart({ slices, size = 120, strokeWidth = 16, centerLabel }: DonutChartProps) {
  const total = slices.reduce((a, s) => a + s.value, 0);
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {total === 0 ? (
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={strokeWidth} />
          ) : slices.filter((s) => s.value > 0).map((s, i) => {
            const frac = s.value / total;
            const dash = frac * c;
            const dashOffset = c - offset;
            offset += dash;
            return (
              <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={strokeWidth}
                strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={dashOffset} />
            );
          })}
        </svg>
        {centerLabel && (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800 }}>{centerLabel}</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {slices.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <i style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--ink-2)' }}>{s.label}</span>
            <span style={{ fontWeight: 700, marginLeft: 'auto' }}>{total > 0 ? Math.round((s.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface MonthDayInfo { date: string; intensity: number; count: number; }

interface MonthHeatmapProps {
  month: Date;
  data: Map<string, MonthDayInfo>;
  onSelectDay?: (date: string) => void;
  selected?: string | null;
}

const WEEKDAY_LETTERS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

export function MonthHeatmap({ month, data, onSelectDay, selected }: MonthHeatmapProps) {
  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const last = new Date(year, m + 1, 0);
  let startDow = first.getDay(); startDow = startDow === 0 ? 6 : startDow - 1;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, m, d));
  while (cells.length % 7 !== 0) cells.push(null);

  function colorFor(intensity: number) {
    if (intensity <= 0) return 'var(--surface-3)';
    if (intensity < 0.34) return 'var(--acc-soft)';
    if (intensity < 0.67) return 'var(--acc-b)';
    return 'var(--acc)';
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {WEEKDAY_LETTERS.map((d) => <div key={d} style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ink-4)', textAlign: 'center' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((date, i) => {
          if (!date) return <div key={`b${i}`} />;
          const key = date.toISOString().split('T')[0];
          const info = data.get(key);
          const isSelected = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelectDay?.(key)}
              title={info ? `${info.count} sesji` : 'Brak sesji'}
              style={{
                aspectRatio: '1/1', borderRadius: 5, border: isSelected ? '1.5px solid var(--acc)' : '1px solid transparent',
                background: colorFor(info?.intensity ?? 0), cursor: onSelectDay ? 'pointer' : 'default',
                fontSize: 9, color: (info?.intensity ?? 0) > 0.5 ? '#fff' : 'var(--ink-3)', fontFamily: 'var(--mono)',
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 10, fontSize: 10.5, color: 'var(--ink-3)' }}>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc-soft)', marginRight: 4 }} />Lekko</span>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc-b)', marginRight: 4 }} />Średnio</span>
        <span><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--acc)', marginRight: 4 }} />Mocno</span>
      </div>
    </div>
  );
}

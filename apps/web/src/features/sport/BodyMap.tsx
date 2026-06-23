import { Fragment } from 'react';
import type { MuscleKey } from './catalog';
import { MUSCLE_LABEL } from './catalog';

export type HighlightLevel = 'primary' | 'secondary' | 'stabilizer';

interface Shape {
  key: MuscleKey;
  view: 'front' | 'back';
  rect?: [number, number, number, number];
  circle?: [number, number, number];
  mirror?: boolean;
}

// Simplified paper-doll silhouette, 100x190 viewBox. Mirrored shapes render
// once per side (left/right) since the data model doesn't track laterality.
const SHAPES: Shape[] = [
  { key: 'neck', view: 'front', rect: [43, 10, 14, 9] },
  { key: 'neck', view: 'back', rect: [43, 10, 14, 9] },

  { key: 'front_delts', view: 'front', rect: [24, 26, 13, 11], mirror: true },
  { key: 'side_delts', view: 'front', rect: [24, 26, 13, 11], mirror: true },
  { key: 'rear_delts', view: 'back', rect: [24, 26, 13, 11], mirror: true },
  { key: 'shoulder', view: 'front', circle: [25, 25, 3], mirror: true },
  { key: 'shoulder', view: 'back', circle: [25, 25, 3], mirror: true },

  { key: 'chest', view: 'front', rect: [35, 28, 30, 20] },
  { key: 'upper_back', view: 'back', rect: [33, 28, 34, 13] },
  { key: 'lats', view: 'back', rect: [33, 41, 34, 17] },
  { key: 'lower_back', view: 'back', rect: [37, 58, 26, 13] },
  { key: 'abs', view: 'front', rect: [38, 48, 24, 20] },
  { key: 'obliques', view: 'front', rect: [38, 48, 24, 20] },

  { key: 'biceps', view: 'front', rect: [17, 38, 9, 22], mirror: true },
  { key: 'triceps', view: 'back', rect: [17, 38, 9, 22], mirror: true },
  { key: 'forearms', view: 'front', rect: [14, 61, 8, 20], mirror: true },
  { key: 'forearms', view: 'back', rect: [14, 61, 8, 20], mirror: true },
  { key: 'elbow', view: 'front', circle: [21, 60, 3], mirror: true },
  { key: 'elbow', view: 'back', circle: [21, 60, 3], mirror: true },
  { key: 'wrist', view: 'front', circle: [18, 82, 3], mirror: true },
  { key: 'wrist', view: 'back', circle: [18, 82, 3], mirror: true },

  { key: 'hip_flexors', view: 'front', rect: [36, 71, 28, 11] },
  { key: 'adductors', view: 'front', rect: [36, 71, 28, 11] },
  { key: 'glutes', view: 'back', rect: [34, 71, 32, 12] },

  { key: 'quads', view: 'front', rect: [33, 84, 14, 28], mirror: true },
  { key: 'hamstrings', view: 'back', rect: [33, 84, 14, 28], mirror: true },
  { key: 'knee', view: 'front', circle: [40, 113, 4], mirror: true },
  { key: 'knee', view: 'back', circle: [40, 113, 4], mirror: true },
  { key: 'calves', view: 'front', rect: [34, 119, 12, 24], mirror: true },
  { key: 'calves', view: 'back', rect: [34, 119, 12, 24], mirror: true },
  { key: 'ankle', view: 'front', circle: [40, 147, 3], mirror: true },
  { key: 'ankle', view: 'back', circle: [40, 147, 3], mirror: true },
];

function mirrorX(x: number, w: number): number {
  return 100 - x - w;
}

function levelColor(level: HighlightLevel): string {
  if (level === 'primary') return 'var(--acc)';
  if (level === 'secondary') return 'var(--acc-b)';
  return 'var(--ink-4)';
}

function painColor(intensity: number): string {
  if (intensity <= 0) return 'var(--surface-2)';
  if (intensity <= 1) return 'var(--warn-soft)';
  if (intensity <= 2) return 'var(--warn)';
  if (intensity <= 3) return 'var(--danger-soft)';
  return 'var(--danger)';
}

interface BodyMapProps {
  /** "What's working today" / template preview mode. */
  highlight?: Partial<Record<MuscleKey, HighlightLevel>>;
  /** Pain check-in mode — 0..5 intensity per region. Takes priority over `highlight`. */
  painMap?: Partial<Record<MuscleKey, number>>;
  /** Allow clicking a region (used by the Odczucia pain map). */
  onRegionClick?: (key: MuscleKey) => void;
  size?: number;
  title?: string;
  /** Thumbnail mode — hides labels/captions, tightens spacing. */
  compact?: boolean;
}

export function BodyMap({ highlight, painMap, onRegionClick, size = 96, title, compact = false }: BodyMapProps) {
  const interactive = !!onRegionClick;

  function shapeFill(key: MuscleKey): string {
    if (painMap) {
      const v = painMap[key];
      return v != null ? painColor(v) : 'var(--surface-2)';
    }
    if (highlight) {
      const lvl = highlight[key];
      return lvl ? levelColor(lvl) : 'var(--surface-2)';
    }
    return 'var(--surface-2)';
  }

  function shapeOpacity(key: MuscleKey): number {
    if (painMap) return painMap[key] != null ? 1 : 0.5;
    if (highlight) {
      const lvl = highlight[key];
      if (lvl === 'stabilizer') return 0.45;
      return lvl ? 1 : 0.35;
    }
    return 0.35;
  }

  function renderView(view: 'front' | 'back') {
    const shapes = SHAPES.filter((s) => s.view === view);
    return (
      <svg viewBox="0 0 100 190" width={size} height={size * 1.9} role="img" aria-label={`Sylwetka — widok ${view === 'front' ? 'z przodu' : 'z tyłu'}`}>
        {/* head + torso outline for context */}
        <circle cx={50} cy={8} r={7} fill="none" stroke="var(--border)" strokeWidth={1.2} />
        <path
          d="M37 20 Q50 16 63 20 L67 70 Q63 90 58 95 L60 165 L52 165 L50 110 L48 165 L40 165 L42 95 Q37 90 33 70 Z"
          fill="none" stroke="var(--border)" strokeWidth={1.2}
        />
        {shapes.map((s, i) => {
          const fill = shapeFill(s.key);
          const opacity = shapeOpacity(s.key);
          const handleClick = interactive ? () => onRegionClick?.(s.key) : undefined;
          if (s.circle) {
            const [cx, cy, r] = s.circle;
            return (
              <Fragment key={`${s.key}-${view}-${i}`}>
                <circle
                  cx={cx} cy={cy} r={r} fill={fill} opacity={opacity}
                  stroke="var(--surface)" strokeWidth={0.6}
                  style={interactive ? { cursor: 'pointer' } : undefined}
                  onClick={handleClick}
                >
                  <title>{MUSCLE_LABEL[s.key]}</title>
                </circle>
                {s.mirror && (
                  <circle
                    cx={mirrorX(cx, 0)} cy={cy} r={r} fill={fill} opacity={opacity}
                    stroke="var(--surface)" strokeWidth={0.6}
                    style={interactive ? { cursor: 'pointer' } : undefined}
                    onClick={handleClick}
                  >
                    <title>{MUSCLE_LABEL[s.key]}</title>
                  </circle>
                )}
              </Fragment>
            );
          }
          if (s.rect) {
            const [x, y, w, h] = s.rect;
            return (
              <Fragment key={`${s.key}-${view}-${i}`}>
                <rect
                  x={x} y={y} width={w} height={h} rx={3} fill={fill} opacity={opacity}
                  stroke="var(--surface)" strokeWidth={0.6}
                  style={interactive ? { cursor: 'pointer' } : undefined}
                  onClick={handleClick}
                >
                  <title>{MUSCLE_LABEL[s.key]}</title>
                </rect>
                {s.mirror && (
                  <rect
                    x={mirrorX(x, w)} y={y} width={w} height={h} rx={3} fill={fill} opacity={opacity}
                    stroke="var(--surface)" strokeWidth={0.6}
                    style={interactive ? { cursor: 'pointer' } : undefined}
                    onClick={handleClick}
                  >
                    <title>{MUSCLE_LABEL[s.key]}</title>
                  </rect>
                )}
              </Fragment>
            );
          }
          return null;
        })}
      </svg>
    );
  }

  return (
    <div>
      {title && <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--ink-3)', marginBottom: 8 }}>{title}</div>}
      <div style={{ display: 'flex', gap: compact ? 4 : 14, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          {renderView('front')}
          {!compact && <div style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 2 }}>Przód</div>}
        </div>
        <div style={{ textAlign: 'center' }}>
          {renderView('back')}
          {!compact && <div style={{ fontSize: 9.5, color: 'var(--ink-4)', marginTop: 2 }}>Tył</div>}
        </div>
      </div>
    </div>
  );
}

export function muscleSetFromExercises(
  exercises: { primaryMuscles?: MuscleKey[]; secondaryMuscles?: MuscleKey[]; stabilizerMuscles?: MuscleKey[] }[],
): Partial<Record<MuscleKey, HighlightLevel>> {
  const out: Partial<Record<MuscleKey, HighlightLevel>> = {};
  for (const ex of exercises) {
    for (const m of ex.primaryMuscles ?? []) out[m] = 'primary';
    for (const m of ex.secondaryMuscles ?? []) if (out[m] !== 'primary') out[m] = 'secondary';
    for (const m of ex.stabilizerMuscles ?? []) if (!out[m]) out[m] = 'stabilizer';
  }
  return out;
}

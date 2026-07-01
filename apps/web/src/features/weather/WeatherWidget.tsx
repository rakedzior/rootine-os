import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { Modal } from '@/components/common';
import { useUpdateProfile } from '@/features/config/useProfile';
import { toast } from '@/lib/toast';
import { geocodeSuggest, weatherLabel, type CitySuggestion, type WeatherData, type WeatherDay, type WeatherHour } from './useWeather';

type SearchFn = (city: string, resolved?: { lat: number; lon: number; label: string }) => void;

/** City text field with type-ahead suggestions from the geocoding database. */
function CityAutocomplete({ onPick, autoFocus }: { onPick: (s: CitySuggestion) => void; autoFocus?: boolean }) {
  const [q, setQ] = useState('');
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [openList, setOpenList] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const reqId = useRef(0);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setSuggestions([]); setOpenList(false); return; }
    const id = ++reqId.current;
    const t = window.setTimeout(async () => {
      const list = await geocodeSuggest(term);
      if (id !== reqId.current) return; // a newer keystroke superseded this
      setSuggestions(list);
      setOpenList(true);
      setActiveIdx(-1);
    }, 220);
    return () => window.clearTimeout(t);
  }, [q]);

  function pick(s: CitySuggestion) {
    onPick(s);
    setQ('');
    setSuggestions([]);
    setOpenList(false);
  }

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
      <input
        className="input"
        placeholder="Wpisz miejscowość…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpenList(true)}
        onBlur={() => window.setTimeout(() => setOpenList(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter') {
            e.preventDefault();
            const s = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
            if (s) pick(s);
          } else if (e.key === 'Escape') setOpenList(false);
        }}
        style={{ height: 34, width: '100%' }}
        autoFocus={autoFocus}
        role="combobox"
        aria-expanded={openList}
        aria-autocomplete="list"
      />
      {openList && suggestions.length > 0 && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 5,
            margin: 0, padding: 4, listStyle: 'none', maxHeight: 220, overflowY: 'auto',
            background: 'var(--surface-overlay)', border: '1px solid var(--border)', borderRadius: 12,
            boxShadow: 'var(--sh-pop)',
          }}
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat},${s.lon}`}
              role="option"
              aria-selected={i === activeIdx}
              onMouseDown={(e) => { e.preventDefault(); pick(s); }}
              onMouseEnter={() => setActiveIdx(i)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 1, padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                background: i === activeIdx ? 'var(--surface-2)' : 'transparent',
              }}
            >
              <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{s.name}</strong>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{[s.admin1, s.country].filter(Boolean).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeatherIcon({ code, size = 18, className }: { code: number; size?: number; className?: string }) {
  const storm = [95, 96, 99].includes(code);
  const rain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  const cloudy = code > 1;
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size, flexShrink: 0 }}>
      {!cloudy && <circle cx="12" cy="12" r="4" />}
      {!cloudy && <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />}
      {cloudy && <path d="M7 18h10a4 4 0 0 0 0-8 6 6 0 0 0-11.3 2A3 3 0 0 0 7 18Z" />}
      {rain && <path d="M8 21l1-2M13 21l1-2M18 21l1-2" />}
      {storm && <path d="M13 13l-2 4h3l-2 4" />}
    </svg>
  );
}

interface WeatherButtonProps {
  weather: WeatherData | null;
  loading: boolean;
  onClick: () => void;
  compact?: boolean;
}

export function WeatherButton({ weather, loading, onClick, compact }: WeatherButtonProps) {
  if (compact) {
    return (
      <button type="button" onClick={onClick} className="tmini tmini-btn" style={{ background: 'transparent', border: 0, padding: 0 }}>
        <WeatherIcon code={weather ? weather.code : 3} size={20} className="ic" />
        <div className="tt">
          <b>{loading ? '--' : weather ? `${Math.round(weather.temp)}°C` : '--'}</b>
          <small>{weather ? weatherLabel(weather.code) : 'Pogoda'}</small>
        </div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 34,
        padding: '6px 10px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface-inset)',
        color: 'var(--ink)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--acc-b)' }}><WeatherIcon code={weather ? weather.code : 3} /></span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 800 }}>{loading ? '--' : weather ? `${Math.round(weather.temp)}°` : '--'}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-3)' }}>{weather ? weatherLabel(weather.code) : 'Pogoda'}</span>
      </span>
    </button>
  );
}

function HourlyChart({ chart }: { chart: WeatherHour[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const temps = chart.map((h) => h.temp);
  const min = temps.length ? Math.min(...temps) : 0;
  const max = temps.length ? Math.max(...temps) : 1;
  const range = Math.max(1, max - min);

  function xFor(i: number) { return chart.length <= 1 ? 0 : (i / (chart.length - 1)) * 100; }
  function yFor(temp: number) { return 54 - ((temp - min) / range) * 42; }

  const points = chart.map((h, i) => `${xFor(i)},${yFor(h.temp)}`).join(' ');

  function handleMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (!rect || chart.length === 0) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHoverIdx(Math.round(frac * (chart.length - 1)));
  }

  const active = hoverIdx !== null ? chart[hoverIdx] : null;

  return (
    <div
      ref={wrapRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
      style={{ position: 'relative', border: '1px solid var(--border-soft)', background: 'var(--surface-inset)', borderRadius: 'var(--r-mid)', padding: 12, cursor: 'crosshair' }}
    >
      {active && hoverIdx !== null && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: `${Math.min(86, Math.max(0, xFor(hoverIdx)))}%`,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '6px 10px',
          boxShadow: 'var(--sh-1)',
          zIndex: 2,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          <span style={{ color: 'var(--acc-b)' }}><WeatherIcon code={active.code} size={15} /></span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13 }}>{Math.round(active.temp)}°C</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-3)' }}>{new Date(active.time).getHours()}:00</span>
          {active.rainProbability > 0 && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ev-blue)' }}>{active.rainProbability}% deszczu</span>
          )}
        </div>
      )}
      <svg viewBox="0 0 100 62" preserveAspectRatio="none" style={{ width: '100%', height: 160, display: 'block', overflow: 'visible' }}>
        <path d="M0 56H100" stroke="var(--border)" strokeWidth=".5" />
        {hoverIdx !== null && (
          <line x1={xFor(hoverIdx)} x2={xFor(hoverIdx)} y1="2" y2="58" stroke="var(--ink-3)" strokeWidth=".5" strokeDasharray="2,2" vectorEffect="non-scaling-stroke" />
        )}
        <polyline points={points} fill="none" stroke="var(--acc-a)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {chart.map((h, i) => (
          <circle key={h.time} cx={xFor(i)} cy={yFor(h.temp)} r={hoverIdx === i ? 2.6 : 1.1} fill="var(--acc-a)" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-3)', fontFamily: 'var(--mono)', fontSize: 10, marginTop: 4 }}>
        {chart.filter((_, i) => i % 4 === 0).slice(0, 6).map((h) => (
          <span key={h.time}>{new Date(h.time).getHours()}:00</span>
        ))}
      </div>
    </div>
  );
}

function HourlyStrip({ chart }: { chart: WeatherHour[] }) {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {chart.map((h) => (
        <div
          key={h.time}
          style={{
            flexShrink: 0,
            minWidth: 58,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
            padding: '10px 6px',
            borderRadius: 12,
            border: '1px solid var(--border-soft)',
            background: 'var(--surface-inset)',
          }}
        >
          <span style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--ink-3)' }}>{new Date(h.time).getHours()}:00</span>
          <span style={{ color: 'var(--acc-b)' }}><WeatherIcon code={h.code} size={17} /></span>
          <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 13 }}>{Math.round(h.temp)}°</span>
          {h.rainProbability > 0 ? (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ev-blue)' }}>{h.rainProbability}%</span>
          ) : (
            <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'transparent' }}>0%</span>
          )}
        </div>
      ))}
    </div>
  );
}

const DAY_SHORT = ['Niedz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob'];
function dayLabel(date: string, idx: number): string {
  if (idx === 0) return 'Dziś';
  if (idx === 1) return 'Jutro';
  return DAY_SHORT[new Date(date).getDay()];
}

function DailyStrip({ days }: { days: WeatherDay[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(days.length, 5)}, 1fr)`, gap: 8 }}>
      {days.slice(0, 5).map((d, i) => (
        <div key={d.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 6px', borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>{dayLabel(d.date, i)}</span>
          <span style={{ color: 'var(--acc-b)' }}><WeatherIcon code={d.code} size={20} /></span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 800 }}>{Math.round(d.max)}°<span style={{ color: 'var(--ink-3)', fontWeight: 500 }}> {Math.round(d.min)}°</span></span>
          {d.rainProbability > 0 && <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--ev-blue)' }}>{d.rainProbability}%</span>}
        </div>
      ))}
    </div>
  );
}

function LocationBar({ weather, onSearch }: { weather: WeatherData; onSearch?: SearchFn }) {
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState('');
  const updateProfile = useUpdateProfile();

  function saveDefault() {
    const q = picked.trim();
    if (!q) return;
    updateProfile.mutate({ default_city: q }, {
      onSuccess: () => toast.success('Zapisano domyślną lokalizację'),
      onError: () => toast.error('Nie udało się zapisać lokalizacji'),
    });
    setEditing(false);
    setPicked('');
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <span className="badge badge-gray" style={{ fontSize: 9 }}>
        {weather.locationSource === 'geo' ? 'Lokalizacja' : weather.locationSource === 'profile' ? 'Z profilu' : weather.locationSource === 'manual' ? 'Wpisana' : 'Domyślna'}
      </span>
      <strong style={{ fontSize: 13 }}>{weather.locationLabel}</strong>
      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing((v) => !v); setPicked(''); }}>Zmień</button>
      {editing && (
        <div style={{ display: 'flex', gap: 8, flexBasis: '100%', marginTop: 4, flexWrap: 'wrap' }}>
          <CityAutocomplete
            autoFocus
            onPick={(s) => {
              onSearch?.(s.name, { lat: s.lat, lon: s.lon, label: s.label });
              setPicked(s.name);
            }}
          />
          <button className="btn btn-primary btn-sm" disabled={!picked} onClick={saveDefault}>Zapisz jako domyślną</button>
        </div>
      )}
    </div>
  );
}

interface WeatherModalProps {
  open: boolean;
  weather: WeatherData | null;
  loading: boolean;
  error: boolean;
  needsCity?: boolean;
  onClose: () => void;
  onSearch?: SearchFn;
}

export function WeatherModal({ open, weather, loading, error, needsCity, onClose, onSearch }: WeatherModalProps) {
  const chart = weather?.next24 ?? [];

  return (
    <Modal open={open} onClose={onClose} title="Pogoda" size="lg">
      {loading && !weather && <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Ładowanie pogody...</div>}
      {error && !weather && (
        <div style={{ display: 'grid', gap: 12 }}>
          <div className="auth-banner warn">Nie udało się pobrać pogody. Wpisz miejscowość.</div>
          {onSearch && <ManualOnly onSearch={onSearch} />}
        </div>
      )}
      {weather && (
        <div style={{ display: 'grid', gap: 16 }}>
          {needsCity && (
            <div className="auth-banner warn">
              Pokazuję domyślną lokalizację. Wpisz miejscowość, aby dopasować pogodę do siebie.
            </div>
          )}
          {error && (
            <div className="auth-banner warn">
              Nie udało się odświeżyć pogody. Pokazuję ostatnie dostępne dane.
            </div>
          )}
          <LocationBar weather={weather} onSearch={onSearch} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ color: 'var(--acc-b)', width: 42, height: 42, display: 'grid', placeItems: 'center' }}><WeatherIcon code={weather.code} size={36} /></span>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 34, fontWeight: 800, lineHeight: 1 }}>{Math.round(weather.temp)}°C</div>
                <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{weatherLabel(weather.code)} · odczuwalna {Math.round(weather.apparent)}°C</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(100px, 1fr))', gap: 8 }}>
              {[
                ['Min / max', `${Math.round(weather.minTemp)}° / ${Math.round(weather.maxTemp)}°`],
                ['Wilgotność', `${Math.round(weather.humidity)}%`],
                ['Wiatr', `${Math.round(weather.wind)} km/h`],
                ['Porywy', `${Math.round(weather.maxWind)} km/h`],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-soft)', background: 'var(--surface-inset)' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>{label}</div>
                  <div style={{ marginTop: 4, fontWeight: 800, color: 'var(--ink)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical analysis */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, border: '1px solid var(--acc-line)', background: 'var(--acc-soft)' }}>
            <span style={{ color: 'var(--acc-ink)', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
            </span>
            <span style={{ fontWeight: 600, color: 'var(--acc-ink)', fontSize: 13.5 }}>{weather.analysis}</span>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
              Temperatura godzinowa · najedź kursorem po szczegóły
            </div>
            <HourlyChart chart={chart} />
          </div>

          <div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
              Prognoza godzina po godzinie
            </div>
            <HourlyStrip chart={chart} />
          </div>

          {weather.daily.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 8 }}>
                Prognoza na kilka dni
              </div>
              <DailyStrip days={weather.daily} />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function ManualOnly({ onSearch }: { onSearch: SearchFn }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <CityAutocomplete autoFocus onPick={(s) => onSearch(s.name, { lat: s.lat, lon: s.lon, label: s.label })} />
    </div>
  );
}

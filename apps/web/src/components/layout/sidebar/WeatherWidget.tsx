import { useState } from 'react';
import { useWeather, weatherLabel } from '@/features/weather/useWeather';
import { WeatherIcon, WeatherModal } from '@/features/weather/WeatherWidget';

/** Weather summary; opens the full forecast modal on click. Collapses to icon + temp. */
export function WeatherWidget({ expanded }: { expanded: boolean }) {
  const [open, setOpen] = useState(false);
  const { data, loading, error, needsCity, search } = useWeather();
  const temp = data ? `${Math.round(data.temp)}°` : '--';
  const tempText = data ? `${temp}C` : '--';
  const desc = data ? weatherLabel(data.code) : 'Pogoda';

  return (
    <>
      <button
        type="button"
        className="sb-weather"
        onClick={() => setOpen(true)}
        title={expanded ? undefined : `${tempText} · ${desc}`}
        aria-label={`Pogoda: ${tempText}, ${desc}`}
      >
        <span className="sb-weather-ic"><WeatherIcon code={data ? data.code : 3} size={20} /></span>
        <span className="sb-weather-text">
          <strong>{loading && !data ? '--' : tempText}</strong>
          <small>{desc}</small>
        </span>
        {!expanded && <span className="sb-tooltip" role="tooltip">{tempText} · {desc}</span>}
      </button>
      <WeatherModal
        open={open}
        weather={data}
        loading={loading}
        error={error}
        needsCity={needsCity}
        onClose={() => setOpen(false)}
        onSearch={search}
      />
    </>
  );
}

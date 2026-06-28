import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchProfile } from '@/features/config/profile';

export interface WeatherHour {
  time: string;
  temp: number;
  apparent: number;
  rainProbability: number;
  precipitation: number;
  rain: number;
  showers: number;
  wind: number;
  gust: number;
  code: number;
}

export interface WeatherDay {
  date: string;
  min: number;
  max: number;
  code: number;
  rainProbability: number;
}

export type LocationSource = 'geo' | 'profile' | 'manual' | 'default';

export interface WeatherData {
  locationLabel: string;
  locationSource: LocationSource;
  temp: number;
  apparent: number;
  code: number;
  humidity: number;
  wind: number;
  gust: number;
  precipitation: number;
  rain: number;
  next24: WeatherHour[];
  daily: WeatherDay[];
  minTemp: number;
  maxTemp: number;
  maxRainProbability: number;
  maxWind: number;
  stormLikely: boolean;
  rainLikely: boolean;
  analysis: string;
}

export function weatherLabel(code: number): string {
  if (code === 0) return 'Bezchmurnie';
  if ([1, 2].includes(code)) return 'Częściowe zachmurzenie';
  if (code === 3) return 'Pochmurno';
  if ([45, 48].includes(code)) return 'Mgła';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Mżawka';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Deszcz';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Śnieg';
  if ([95, 96, 99].includes(code)) return 'Burza';
  return 'Pogoda';
}

/** Short practical, human read of the day. */
function buildAnalysis(p: {
  temp: number;
  code: number;
  rainLikely: boolean;
  stormLikely: boolean;
  maxRainProbability: number;
  maxWind: number;
  afternoonRain: boolean;
  morningRain: boolean;
}): string {
  if (p.stormLikely) return 'Możliwa burza — lepiej ograniczyć aktywność na zewnątrz.';
  if (p.afternoonRain && !p.morningRain) return 'Ryzyko opadów po południu — rano jeszcze sucho.';
  if (p.maxRainProbability >= 60) return 'Wysokie ryzyko opadów — weź parasol.';
  if (p.rainLikely) return 'Możliwe przelotne opady — warto zabrać kurtkę.';
  if (p.maxWind >= 55) return 'Silny wiatr — uważaj na zewnątrz.';
  if (p.temp <= 0) return 'Mróz — ubierz się ciepło.';
  if (p.temp >= 12 && p.temp <= 24 && p.code <= 2) return 'Dobry dzień na bieganie i aktywność na świeżym powietrzu.';
  if (p.code <= 1) return 'Słonecznie i spokojnie — dobry dzień na spacer.';
  return 'Spokojna pogoda bez większych niespodzianek.';
}

interface GeoPoint {
  lat: number;
  lon: number;
  label: string;
  source: LocationSource;
}

async function geocodeCity(name: string): Promise<GeoPoint | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=pl&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = await res.json();
  const r = json.results?.[0];
  if (!r) return null;
  const label = [r.name, r.country].filter(Boolean).join(', ');
  return { lat: r.latitude, lon: r.longitude, label, source: 'manual' };
}

async function loadWeather(point: GeoPoint): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(point.lat),
    longitude: String(point.lon),
    timezone: 'auto',
    forecast_days: '5',
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,rain',
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max',
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error('Weather request failed');
  const json = await res.json();
  const hourly = json.hourly;
  const current = json.current;
  const d = json.daily;
  const nowMs = Date.now();
  const firstFuture = (hourly.time as string[]).findIndex((t) => new Date(t).getTime() >= nowMs);
  const start = firstFuture >= 0 ? firstFuture : 0;
  const next24: WeatherHour[] = (hourly.time as string[]).slice(start, start + 24).map((time, idx) => {
    const i = start + idx;
    return {
      time,
      temp: Number(hourly.temperature_2m[i] ?? 0),
      apparent: Number(hourly.apparent_temperature[i] ?? 0),
      rainProbability: Number(hourly.precipitation_probability[i] ?? 0),
      precipitation: Number(hourly.precipitation[i] ?? 0),
      rain: Number(hourly.rain[i] ?? 0),
      showers: Number(hourly.showers[i] ?? 0),
      wind: Number(hourly.wind_speed_10m[i] ?? 0),
      gust: Number(hourly.wind_gusts_10m[i] ?? 0),
      code: Number(hourly.weather_code[i] ?? 0),
    };
  });
  const daily: WeatherDay[] = (d?.time as string[] ?? []).map((date, i) => ({
    date,
    min: Number(d.temperature_2m_min[i] ?? 0),
    max: Number(d.temperature_2m_max[i] ?? 0),
    code: Number(d.weather_code[i] ?? 0),
    rainProbability: Number(d.precipitation_probability_max[i] ?? 0),
  }));

  const temps = next24.map((h) => h.temp);
  const maxRainProbability = next24.length ? Math.max(...next24.map((h) => h.rainProbability)) : 0;
  const maxWind = next24.length ? Math.max(...next24.map((h) => h.gust || h.wind)) : Number(current.wind_gusts_10m ?? current.wind_speed_10m ?? 0);
  const stormLikely = next24.some((h) => [95, 96, 99].includes(h.code));
  const rainLikely = next24.some((h) => h.rainProbability >= 45 || h.precipitation > 0.2 || h.rain > 0 || h.showers > 0);

  const afternoon = next24.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 12 && hr <= 18; });
  const morning = next24.filter((h) => { const hr = new Date(h.time).getHours(); return hr >= 6 && hr <= 11; });
  const afternoonRain = afternoon.some((h) => h.rainProbability >= 50);
  const morningRain = morning.some((h) => h.rainProbability >= 40);
  const temp = Number(current.temperature_2m ?? 0);
  const code = Number(current.weather_code ?? 0);

  return {
    locationLabel: point.label,
    locationSource: point.source,
    temp,
    apparent: Number(current.apparent_temperature ?? 0),
    code,
    humidity: Number(current.relative_humidity_2m ?? 0),
    wind: Number(current.wind_speed_10m ?? 0),
    gust: Number(current.wind_gusts_10m ?? 0),
    precipitation: Number(current.precipitation ?? 0),
    rain: Number(current.rain ?? 0),
    next24,
    daily,
    minTemp: temps.length ? Math.min(...temps) : temp,
    maxTemp: temps.length ? Math.max(...temps) : temp,
    maxRainProbability,
    maxWind,
    stormLikely,
    rainLikely,
    analysis: buildAnalysis({ temp, code, rainLikely, stormLikely, maxRainProbability, maxWind, afternoonRain, morningRain }),
  };
}

const WARSAW: GeoPoint = { lat: 52.2297, lon: 21.0122, label: 'Warszawa, Polska', source: 'default' };
const WEATHER_CACHE_KEY = 'rootine-weather-cache-v1';
const WEATHER_CACHE_TTL_MS = 1000 * 60 * 20;

interface WeatherCachePayload {
  savedAt: number;
  data: WeatherData;
}

function readWeatherCache(): WeatherData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WeatherCachePayload;
    if (!parsed?.data || !parsed.savedAt) return null;
    if (Date.now() - parsed.savedAt > WEATHER_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeWeatherCache(data: WeatherData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data } satisfies WeatherCachePayload));
  } catch {
    // Weather is a sidebar convenience; storage failure should not break the app.
  }
}

export function useWeather() {
  const initialCache = useRef<WeatherData | null | undefined>(undefined);
  if (initialCache.current === undefined) initialCache.current = readWeatherCache();
  const [data, setData] = useState<WeatherData | null>(() => initialCache.current ?? null);
  const [loading, setLoading] = useState(() => !initialCache.current);
  const [error, setError] = useState(false);
  const [needsCity, setNeedsCity] = useState(false);
  const cancelled = useRef(false);

  const run = useCallback(async (point: GeoPoint) => {
    setLoading(true);
    setError(false);
    try {
      const payload = await loadWeather(point);
      writeWeatherCache(payload);
      if (!cancelled.current) { setData(payload); setNeedsCity(false); }
    } catch {
      if (!cancelled.current) setError(true);
    } finally {
      if (!cancelled.current) setLoading(false);
    }
  }, []);

  /** Manual city search (also used to save default). */
  const search = useCallback(async (city: string) => {
    if (!city.trim()) return;
    setLoading(true);
    setError(false);
    const point = await geocodeCity(city);
    if (!point) { if (!cancelled.current) { setError(true); setLoading(false); } return; }
    await run(point);
  }, [run]);

  useEffect(() => {
    cancelled.current = false;

    // Priority: geolocation → profile default city → manual input prompt.
    async function fromProfileOrPrompt() {
      try {
        const profile = await fetchProfile();
        const city = profile?.default_city?.trim();
        if (city) {
          const point = await geocodeCity(city);
          if (point) { await run({ ...point, source: 'profile' }); return; }
        }
      } catch { /* fall through */ }
      // No geo, no profile city → ask the user, but still show a sensible default.
      if (!cancelled.current) { setNeedsCity(true); await run(WARSAW); }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => void run({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'Twoja lokalizacja', source: 'geo' }),
        () => void fromProfileOrPrompt(),
        { timeout: 2500, maximumAge: 1000 * 60 * 30 },
      );
    } else {
      void fromProfileOrPrompt();
    }

    return () => { cancelled.current = true; };
  }, [run]);

  return { data, loading, error, needsCity, search };
}

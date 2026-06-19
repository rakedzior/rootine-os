import { useEffect, useState } from 'react';

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

export interface WeatherData {
  locationLabel: string;
  temp: number;
  apparent: number;
  code: number;
  wind: number;
  gust: number;
  precipitation: number;
  rain: number;
  next24: WeatherHour[];
  minTemp: number;
  maxTemp: number;
  maxRainProbability: number;
  maxWind: number;
  stormLikely: boolean;
  rainLikely: boolean;
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

export function useWeather() {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load(lat = 52.2297, lon = 21.0122, locationLabel = 'Warszawa') {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          latitude: String(lat),
          longitude: String(lon),
          timezone: 'auto',
          forecast_days: '2',
          current: 'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,rain',
          hourly: 'temperature_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,weather_code,wind_speed_10m,wind_gusts_10m',
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
        if (!res.ok) throw new Error('Weather request failed');
        const json = await res.json();
        const hourly = json.hourly;
        const current = json.current;
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
        const temps = next24.map((h) => h.temp);
        const payload: WeatherData = {
          locationLabel,
          temp: Number(current.temperature_2m ?? 0),
          apparent: Number(current.apparent_temperature ?? 0),
          code: Number(current.weather_code ?? 0),
          wind: Number(current.wind_speed_10m ?? 0),
          gust: Number(current.wind_gusts_10m ?? 0),
          precipitation: Number(current.precipitation ?? 0),
          rain: Number(current.rain ?? 0),
          next24,
          minTemp: temps.length ? Math.min(...temps) : Number(current.temperature_2m ?? 0),
          maxTemp: temps.length ? Math.max(...temps) : Number(current.temperature_2m ?? 0),
          maxRainProbability: next24.length ? Math.max(...next24.map((h) => h.rainProbability)) : 0,
          maxWind: next24.length ? Math.max(...next24.map((h) => h.gust || h.wind)) : Number(current.wind_gusts_10m ?? current.wind_speed_10m ?? 0),
          stormLikely: next24.some((h) => [95, 96, 99].includes(h.code)),
          rainLikely: next24.some((h) => h.rainProbability >= 45 || h.precipitation > 0.2 || h.rain > 0 || h.showers > 0),
        };
        if (!cancelled) {
          setData(payload);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => void load(pos.coords.latitude, pos.coords.longitude, 'Twoja lokalizacja'),
        () => void load(),
        { timeout: 2500, maximumAge: 1000 * 60 * 30 },
      );
    } else {
      void load();
    }

    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}

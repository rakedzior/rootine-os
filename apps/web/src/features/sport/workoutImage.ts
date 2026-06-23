/**
 * Best-effort cover photo for a workout template: manual `image` wins, otherwise
 * we try Pexels (only if VITE_PEXELS_API_KEY is set) and cache the result, falling
 * back to `null` — the caller (WorkoutCover) already renders a gradient + icon
 * placeholder when no image is available, so this never blocks rendering.
 */
import { useEffect, useState } from 'react';

const CACHE_KEY = 'rootine.workoutImageCache';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

type ImageCache = Record<string, { url: string; ts: number }>;

function readCache(): ImageCache {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? '{}') as ImageCache;
  } catch {
    return {};
  }
}

function getCachedImage(query: string): string | null {
  const entry = readCache()[query];
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
  return entry.url;
}

function setCachedImage(query: string, url: string): void {
  const cache = readCache();
  cache[query] = { url, ts: Date.now() };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // storage full/unavailable — non-fatal, just skip caching
  }
}

const QUERY_BY_CATEGORY: Record<string, string> = {
  'Siłownia': 'gym workout strength training',
  'Bieganie': 'running training',
  'Wspinaczka': 'climbing training',
  'Mobilność': 'mobility stretching',
  'Rehabilitacja': 'rehabilitation exercise',
};

const QUERY_BY_TEMPLATE_CATEGORY: Record<string, string> = {
  'Push': 'push workout gym',
  'Pull': 'pull workout back gym',
  'Legs': 'leg workout gym',
};

export function buildImageQuery(sportType: string, focusAreas: string[] = [], templateCategory?: string): string {
  if (templateCategory && QUERY_BY_TEMPLATE_CATEGORY[templateCategory]) return QUERY_BY_TEMPLATE_CATEGORY[templateCategory];
  if (QUERY_BY_CATEGORY[sportType]) return QUERY_BY_CATEGORY[sportType];
  if (focusAreas[0]) return `${focusAreas[0]} ${sportType} training`;
  return `${sportType} training`;
}

async function fetchPexelsImage(query: string): Promise<string | null> {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY as string | undefined;
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
      headers: { Authorization: apiKey },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.photos?.[0]?.src?.landscape ?? json?.photos?.[0]?.src?.large ?? null;
  } catch {
    return null;
  }
}

/** Returns a cover image URL for a workout: the manual `image` if set, otherwise a cached/fetched Pexels photo, otherwise `null` (caller falls back to its own placeholder). */
export function useWorkoutImage(sportType: string, focusAreas: string[] | undefined, templateCategory: string | undefined, manualImage: string | undefined): string | null {
  const [fetched, setFetched] = useState<string | null>(null);
  const query = buildImageQuery(sportType, focusAreas ?? [], templateCategory);

  useEffect(() => {
    if (manualImage) return;
    const cached = getCachedImage(query);
    if (cached) { setFetched(cached); return; }
    let cancelled = false;
    fetchPexelsImage(query).then((url) => {
      if (cancelled || !url) return;
      setCachedImage(query, url);
      setFetched(url);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manualImage, query]);

  return manualImage ?? fetched;
}

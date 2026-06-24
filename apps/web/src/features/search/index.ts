/**
 * Global search — indexes the module registry (tabs, sub-tabs, feature widgets)
 * plus a short list of settings actions, so the topbar search can jump straight
 * to any part of the app. Polish-diacritic and small-typo tolerant.
 */
import { MODULES, FEATURES, type ModuleKey } from '@/features/config/registry';

export type SearchGroup = 'tab' | 'subtab' | 'module' | 'action';

export interface SearchResult {
  id: string;
  group: SearchGroup;
  title: string;
  subtitle?: string;
  path: string;
  keywords?: string[];
}

export interface SearchAction extends SearchResult {
  group: 'action';
  /** Special client-side actions (e.g. logout) that need more than a navigate(). */
  kind?: 'logout';
}

/** Sub-tab labels per module — hand-curated from each *Screen.tsx's own TABS array. */
const SUBTABS: Record<ModuleKey, { id: string; label: string; keywords?: string[] }[]> = {
  start: [],
  sport: [
    { id: 'dzisiaj', label: 'Dzisiaj', keywords: ['trening', 'dzisiejszy trening'] },
    { id: 'szablony', label: 'Szablony', keywords: ['trening', 'plan treningowy'] },
    { id: 'sesja', label: 'Aktywna sesja', keywords: ['trening', 'sesja treningowa'] },
    { id: 'historia', label: 'Historia', keywords: ['historia treningów', 'trening', 'strava'] },
    { id: 'analiza', label: 'Analiza', keywords: ['statystyki', 'trening'] },
    { id: 'cwiczenia', label: 'Ćwiczenia', keywords: ['baza ćwiczeń', 'trening'] },
    { id: 'odczucia', label: 'Odczucia', keywords: ['samopoczucie', 'ból'] },
    { id: 'planowanie', label: 'Planowanie', keywords: ['cykle', 'powtarzające się treningi'] },
  ],
  diet: [],
  finance: [
    { id: 'przeglad', label: 'Przegląd' },
    { id: 'konta', label: 'Konta' },
    { id: 'budzet', label: 'Budżet' },
    { id: 'oszczednosci', label: 'Oszczędności' },
    { id: 'cykliczne', label: 'Cykliczne', keywords: ['wydatki cykliczne'] },
    { id: 'jdg', label: 'JDG' },
  ],
  goals: [
    { id: 'lista', label: 'Lista celów' },
    { id: 'nawyki', label: 'Nawyki' },
    { id: 'dzisiaj', label: 'Dzisiaj' },
    { id: 'ukonczone', label: 'Ukończone' },
  ],
  office: [
    { id: 'zadania', label: 'Zadania urzędowe' },
    { id: 'dokumenty', label: 'Dokumenty' },
    { id: 'samochod', label: 'Samochód' },
    { id: 'ubezp', label: 'Ubezpieczenia' },
    { id: 'urlopy', label: 'Urlopy' },
  ],
  travel: [
    { id: 'podroze', label: 'Podróże' },
    { id: 'pakowanie', label: 'Pakowanie' },
    { id: 'wishlist', label: 'Wishlist' },
  ],
  notes: [
    { id: 'wszystkie', label: 'Wszystkie' },
    { id: 'sticky', label: 'Przyklejone' },
    { id: 'listy', label: 'Listy kontrolne' },
    { id: 'pelne', label: 'Pełne notatki' },
  ],
  work: [
    { id: 'zadania', label: 'Zadania' },
    { id: 'projekty', label: 'Projekty' },
    { id: 'konteksty', label: 'Konteksty' },
  ],
};

const EXTRA_KEYWORDS: Record<string, string[]> = {
  'start.calendar': ['kalendarz', 'google calendar', 'wydarzenia'],
  'sport.body_measurements': ['waga', 'pomiary ciała', 'masa'],
  'sport.running': ['strava', 'bieganie'],
  'diet.daily_targets': ['waga', 'pomiary'],
};

function buildIndex(): SearchResult[] {
  const results: SearchResult[] = [];

  for (const m of MODULES) {
    results.push({ id: `tab:${m.key}`, group: 'tab', title: m.label, path: m.path });
  }

  for (const m of MODULES) {
    for (const s of SUBTABS[m.key] ?? []) {
      results.push({
        id: `subtab:${m.key}:${s.id}`,
        group: 'subtab',
        title: s.label,
        subtitle: m.label,
        path: `${m.path}?tab=${s.id}`,
        keywords: s.keywords,
      });
    }
  }

  for (const m of MODULES) {
    for (const f of FEATURES[m.key] ?? []) {
      results.push({
        id: `module:${f.key}`,
        group: 'module',
        title: f.label,
        subtitle: m.label,
        path: m.path,
        keywords: EXTRA_KEYWORDS[f.key],
      });
    }
  }

  results.push(
    { id: 'action:settings-integrations', group: 'action', title: 'Integracje', subtitle: 'Ustawienia', path: '/settings/integrations', keywords: ['google calendar', 'strava', 'połącz'] },
    { id: 'action:settings-personalization', group: 'action', title: 'Zmień motyw', subtitle: 'Ustawienia', path: '/settings/profile', keywords: ['personalizacja', 'wygląd', 'ciemny', 'jasny'] },
    { id: 'action:settings-modules', group: 'action', title: 'Zarządzaj modułami', subtitle: 'Ustawienia', path: '/settings/modules', keywords: ['układ aplikacji', 'widoczność'] },
    { id: 'action:settings-security', group: 'action', title: 'Bezpieczeństwo', subtitle: 'Ustawienia', path: '/settings/security', keywords: ['hasło', 'zmiana hasła', 'mfa'] },
    { id: 'action:settings-account', group: 'action', title: 'Konto i eksport danych', subtitle: 'Ustawienia', path: '/settings', keywords: ['eksport', 'usuń konto'] },
    { id: 'action:logout', group: 'action', title: 'Wyloguj się', path: '/login', keywords: ['logout', 'wyjście'] },
  );

  return results;
}

let cachedIndex: SearchResult[] | null = null;
export function getSearchIndex(): SearchResult[] {
  if (!cachedIndex) cachedIndex = buildIndex();
  return cachedIndex;
}

// ─── matching ───────────────────────────────────────────────────

const DIACRITICS: Record<string, string> = { ł: 'l', Ł: 'l' };

const COMBINING_MARKS = new RegExp('[̀-ͯ]', 'g');

export function normalize(input: string): string {
  return input
    .split('').map((ch) => DIACRITICS[ch] ?? ch).join('')
    .normalize('NFD').replace(COMBINING_MARKS, '')
    .toLowerCase().trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** Score a single haystack token against the (already normalized) query. Higher is better; 0 = no match. */
function scoreToken(token: string, query: string): number {
  if (!token) return 0;
  if (token === query) return 100;
  if (token.startsWith(query)) return 80;
  if (token.includes(query)) return 60;
  if (query.length >= 4) {
    const maxDist = query.length <= 6 ? 1 : 2;
    if (levenshtein(token, query) <= maxDist) return 40;
    // also try word-by-word for multi-word tokens
    for (const word of token.split(/\s+/)) {
      if (word.length >= 3 && levenshtein(word, query) <= maxDist) return 35;
    }
  }
  return 0;
}

function scoreResult(result: SearchResult, query: string): number {
  const haystacks = [result.title, result.subtitle, ...(result.keywords ?? [])].filter(Boolean) as string[];
  let best = 0;
  for (const h of haystacks) {
    best = Math.max(best, scoreToken(normalize(h), query));
  }
  return best;
}

export interface GroupedResults {
  tab: SearchResult[];
  subtab: SearchResult[];
  module: SearchResult[];
  action: SearchResult[];
  total: number;
}

const GROUP_LIMIT = 6;

export function searchAll(rawQuery: string): GroupedResults {
  const query = normalize(rawQuery);
  const empty: GroupedResults = { tab: [], subtab: [], module: [], action: [], total: 0 };
  if (!query) return empty;

  const scored = getSearchIndex()
    .map((r) => ({ r, score: scoreResult(r, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const out: GroupedResults = { tab: [], subtab: [], module: [], action: [], total: 0 };
  for (const { r } of scored) {
    if (out[r.group].length < GROUP_LIMIT) out[r.group].push(r);
  }
  out.total = out.tab.length + out.subtab.length + out.module.length + out.action.length;
  return out;
}

export const GROUP_LABELS: Record<SearchGroup, string> = {
  tab: 'Zakładki',
  subtab: 'Podzakładki',
  module: 'Moduły',
  action: 'Akcje',
};

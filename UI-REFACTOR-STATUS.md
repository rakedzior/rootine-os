# Rootine OS — UI Unification: Status & Handoff

> Dokument przekazania pracy. Opisuje co zostało zrobione w ujednoliceniu interfejsu,
> stan techniczny projektu i **wszystkie następne kroki**. Pełny plan fazowy:
> `C:\Users\raked\.claude\plans\prancy-tickling-galaxy.md`.

## 1. Kontekst projektu

Rootine OS to ciemna, „premium" aplikacja produktywności (web, `apps/web`). 9 modułów:
Planner (start), Sport, Dieta, Finanse, Cele, Biuro, Podróże, Notatki, Praca.

**Stack:** React 18 + Vite 8 + TypeScript, React Router 6, TanStack Query 5, Zustand
(`src/store/localStore.ts`, persist→localStorage), Supabase (auth + część danych).
Styl: czysty CSS z tokenami w `src/styles/*.css` (`styles.css` główny + per-moduł:
`notes.css`, `travel.css`, `work.css`, `health.css`, `nutrition.css`, `desk.css`).

**Cel refaktoru (zlecony przez użytkownika):** sprawić, by wszystkie zakładki wyglądały jak
jeden spójny system — wspólny shell, wspólne komponenty, spójne nagłówki/podzakładki/statusy
— BEZ zmiany kierunku wizualnego (ciemny, różowy akcent, akcenty teal/cyan/green).

**Decyzje użytkownika:** (1) najpierw fundament, fazy zatwierdzane osobno; (2) pełna
trwałość danych przez migrację DB; (3) integracje = tylko UI/status teraz, sync później.

## 2. Komendy / weryfikacja

```
cd apps/web
npm run dev          # serwer dev (Vite) — domyślnie :5173
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build        # tsc + vite build
```
**Stan na teraz: `tsc`, `eslint`, `vite build` — wszystko czyste, 0 błędów/ostrzeżeń.**
Brak testów automatycznych — weryfikacja ręczna + build. Dev server bywa uruchomiony w tle.

## 3. Co zostało ZROBIONE

### Faza 1 — Globalny shell + system komponentów
- **Top bar** (`components/layout/Topbar.tsx`): usunięta globalna wyszukiwarka i przycisk
  „+ Dodaj". Nowy **`UserMenu.tsx`** (avatar → Profil/Ustawienia/Integracje/Wyloguj).
- **Modal pogody** (`features/weather/useWeather.ts`, `WeatherWidget.tsx`): lokalizacja
  geo → miasto z profilu → ręczne wpisanie (geokodowanie Open‑Meteo); wilgotność, prognoza
  godzinowa + kilkudniowa, zdanie analizy („Dobry dzień na bieganie" itd.), zmiana miasta +
  „Zapisz jako domyślną".
- **Migracja** `supabase/migrations/0016_profile_prefs.sql`: `profiles` +
  {first_name, avatar_url, default_city, timezone}; `user_preferences` +
  {mode, notifications, privacy}. **Użytkownik twierdzi, że zaaplikowana** (zweryfikować).
- **Profil/Ustawienia**: `features/settings/ProfileSettings.tsx` (route `/settings/profile`),
  hooki `features/config/profile.ts` + `useProfile.ts`. Motyw (10 palet) w `AccountSettings`,
  synchronizowany do `user_preferences` (`lib/theme.ts`).
- **Wspólne komponenty** w `components/common/index.tsx`: `PageHeader`, `SubTabs`, `KpiCard`,
  `FilterBar`/`FilterSelect`, `DetailPanel`, `StatusBadge` (6 statusów: todo/active/waiting/
  done/overdue/cancelled), `PriorityBadge`, `ProgressBar`, `Modal`, `MoreMenu` (•••),
  `EmptyState`, `IconBtn`, `Field`. CSS klas: `.page-head`, `.kpi-card`, `.filter-bar`,
  `.detail-panel`, `.status-*`, `.user-menu`, `.more-menu` w `styles.css`.
- **Wszystkie 9 modułów** używa `<PageHeader>`; martwy CSS per‑moduł (goals-header,
  office-header, travel-hero, notes-hero, work-hero) usunięty.
- Naprawiony pre-existing bug: komentarz CSS `*/` w `styles.css` blokujący build; oraz
  wyrównanie nagłówków Travel/Notes/Work (`.module-page > header` dostaje padding).

### Fazy 2–10 — przebudowa modułów
- **Planner**: panel Zadania → sekcje Dzisiaj/Nadchodzące/Bez daty/Ukończone dziś.
- **Sport**: duże kafle sportów → kompaktowy `FilterSelect` w Historii/Analizie (zostają w
  Planowaniu/Szablonach); filtry Ćwiczeń scalone w 1 pasek; Aktywna sesja = „tryb skupienia"
  (baner: Powrót do Sportu / Pauza / Zakończ, nowy prop `onExit`).
- **Dieta**: akcje posiłku → `+Dodaj` + `MoreMenu` (Kopiuj/Zapisz szablon/Wyczyść); prawy
  panel makro sticky; podzakładki Dzień/Tydzień/Miesiąc/Produkty/Szablony (Produkty = inline
  `ProductLibraryPanel`, Szablony = lista).
- **Finanse**: podzakładki Przegląd/Miesięczne/Budżet/Cele/Historia (nowy `FinanceHistory`);
  statusy budżetu OK/Uwaga/Przekroczony; usunięty dolny baner.
- **Cele**: badge statusu na czas/ryzyko/opóźniony (`goalStatus`) + „Następny krok".
- **Biuro**: „Ukończone ostatnio" zwijane; podzakładki Sprawy/Dokumenty; nowy `OfficeDocuments`
  (Terminy cykliczne z aut/ubezpieczeń/dokumentów + tabela dokumentów).
- **Podróże**: rozdział Przegląd vs Szczegóły (`detailOpen`, „Powrót do przeglądu");
  podzakładki szczegółów (`TRIP_TABS`: Plan/Rezerwacje/Noclegi/Transport/Budżet/Lista
  pakowania/Dokumenty/Notatki).
- **Notatki**: uproszczone do Kategorie | Lista | Edytor (`.notes-layout-3`); usunięte górne
  KPI, prawy panel (szybka notatka/przypięte/ostatnie/tagi), sekcja aktywności; przełącznik
  Lista/Karty.
- **Praca**: „Ostatnie aktywności" zwijane; treść notatek zadania w panelu; **linki**
  (`WorkTask.links`) — dodawanie/usuwanie/otwieranie w panelu szczegółów.

## 4. NASTĘPNE KROKI

### A. Najpierw zweryfikować / dokończyć konfigurację
1. **Migracja 0016** — potwierdzić, że jest w bazie (`supabase db push` / `migration up`).
   Bez niej zapis profilu/miasta/strefy/języka i sync motywu nie działają.
2. **Integracje (env)** — żeby działały Połącz Google/Strava trzeba ustawić
   `VITE_GOOGLE_CLIENT_ID`, `VITE_STRAVA_CLIENT_ID` (frontend) oraz sekrety w Supabase
   (`GOOGLE_CLIENT_SECRET`, `STRAVA_CLIENT_SECRET`, `TOKEN_ENC_KEY`, `APP_URL`).
3. **Ręczny przegląd UI** — przejść wszystkie 9 zakładek + responsywność (patrz F).

### B. Integracje — synchronizacja (świadomie odłożona)
OAuth (połącz/rozłącz/status) działa; brakuje **edge functions** do faktycznego sync:
- Google Calendar → import wydarzeń do `calendar_events` (i ew. do Plannera/zadań).
- Strava → import historii aktywności do `strava_activities` → Historia treningów Sport.
- Powiązanie aktywności Strava z treningiem w Rootine OS.
Pliki: `supabase/functions/` (są `oauth-google`, `oauth-strava`; brak `sync-*`).

### C. Dokończenie wzorca „Wspólny panel szczegółów" (spec §15) i KpiCard (§17)
Komponenty `DetailPanel` i `KpiCard` ISTNIEJĄ, ale moduły wciąż mają własne odpowiedniki
(`finance-metric`, `goals-metric`, `office-metric`, `notes`/`travel`/`work` panele szczegółów,
`TaskDetails` w Pracy, `GoalDetail`, itd.). Następny krok: migrować je na wspólne
`KpiCard`/`DetailPanel`, żeby naprawdę był jeden wariant w całej apce. To duża, mechaniczna
robota — najlepiej moduł po module.

### D. Trwałe dane tam, gdzie teraz są mocki/placeholdery
- **Podróże**: Rezerwacje/Noclegi/Transport/Budżet/Lista pakowania/Dokumenty są generowane
  z funkcji `buildBudget/buildLodgings/buildTransport/PACKING_ITEMS` (mock). Potrzebny realny
  model danych w `Trip` + CRUD (formularze). Cover image jako opcjonalny upload.
- **Biuro Dokumenty**: widok jest READ-ONLY. Brakuje UI do dodawania/edycji dokumentów, aut
  (`cars`), ubezpieczeń (`insurances`) — store ma mutacje (`addOfficeDocument`, `addInsurance`
  itd.), trzeba tylko formularze/modale. Plus podzakładka „Archiwum".
- **Praca załączniki**: linki działają; pliki wymagają Supabase Storage (upload + bucket).
  Dodać też linki na poziomie projektu (analogicznie do zadań).
- **Profil avatar**: teraz tylko URL. Dodać upload do Supabase Storage.

### E. Niedziałające placeholdery do podpięcia lub usunięcia
W kilku miejscach są przyciski/kontrolki bez logiki (zostawione z prototypu):
- Notatki: przycisk „Filtry", ikona ustawień, „Dodaj kategorię", sortowanie.
- Sport/Dieta/Finanse: część selectów sortowania i nagłówkowych ikon.
- Ustawienia: brak UI dla `notifications` i `privacy` (kolumny w DB są), brak realnego
  trybu jasny/ciemny/**systemowy** (kolumna `mode` jest, ale `AccountSettings` zmienia tylko
  paletę). Reorder/widoczność modułów działa (`ModulesSettings`).
Przejść je i albo podpiąć, albo ukryć.

### F. Responsywność (spec §19) — wymaga realnego przejścia
Tokeny i breakpointy są (860/1100/1220/720px), część layoutów ma media queries. Trzeba
przetestować na wąskich ekranach: prawe panele → drawer/pod treść, podzakładki scroll
poziomy, KPI 1–2 kolumny, tabele → tryb kart. Nowe layouty (`.travel-split`,
`.notes-layout-3`, `.diet-side-sticky`) mają proste media queries — sprawdzić w praktyce.

### G. Sprzątanie (martwy CSS)
Po refaktorze nieużywane już klasy (bezpieczne do usunięcia po grep-weryfikacji):
`.travel-layout`, `.travel-central-grid` (travel.css), `.finance-overview-cta` (styles.css),
być może część `.module-header*` (styles.css) — Sport/Finanse już nie używają sticky bara.

### H. Dłuższa perspektywa
- Migracja modułów localStore-only (Sport/Office/Travel/Work/Goals/Diet częściowo) na pełny
  backend Supabase (dziś wiele danych tylko w localStorage → brak sync między urządzeniami).
- i18n — kolumna `locale` jest, ale teksty są zahardkodowane po polsku.
- Testy (Vitest/Playwright) — obecnie brak.

## 5. Mapa kluczowych plików
- Shell: `components/layout/{Topbar,UserMenu,AppLayout,MobileBottomNav}.tsx`
- Wspólne UI: `components/common/index.tsx`
- Pogoda: `features/weather/{useWeather.ts,WeatherWidget.tsx}`
- Profil/ustawienia: `features/settings/*`, `features/config/{profile.ts,useProfile.ts,...}`
- Moduły: `modules/{start,sport,diet,finance,goals,office,travel,notes,work}/*.tsx`
- Stan lokalny: `store/localStore.ts`  · Style: `styles/*.css`
- Migracje: `supabase/migrations/*.sql`  · Edge functions: `supabase/functions/*`
- Plan/pamięć: `~/.claude/plans/prancy-tickling-galaxy.md`,
  `~/.claude/projects/c--dev-rootine-os/memory/ui-unification-plan.md`

# Rootine OS — Architektura i plan wdrożenia (Faza 0–1)

> Dokument planistyczny. **Brak implementacji do czasu akceptacji.**
> Decyzje wyjściowe (potwierdzone): **multi-user od początku**, **region UE / Frankfurt**,
> **MFA TOTP opcjonalne (dostępne w ustawieniach, niewymuszane)**, **priorytet Fazy 1 = dashboard Start (agregacja)**.

---

## 1. Podsumowanie zrozumienia

Istnieje dopracowany statyczny prototyp z 9 modułami współdzielącymi jeden design system
("White Lotus", warm-light). Stan trzymany jest w `localStorage` przez generyczny silnik
`EditList` (`editable.js`); React+Babel ładowane z CDN wyłącznie dla panelu Tweaks.
Celem jest produkcyjna, bezpieczna aplikacja (PWA + iOS przez Capacitor + Windows jako PWA)
na React/TS/Vite + Supabase, z zachowaniem wyglądu **1:1**, głęboką konfigurowalnością
modułów/feature'ów per użytkownik, silnym auth oraz integracjami Google Calendar i Strava.
**Bez Garmina.**

### Co już mamy i co z tego wynika
- **`editable.js` = kontrakt CRUD.** rename / delete / add / toggle / pola numeryczne →
  mapuje się niemal wprost na mutacje TanStack Query. Port React ma jasny cel.
- **Panel Tweaks = zalążek systemu konfiguracji.** Już steruje `data-theme/-palette/-font`
  i `--r-card` na `<html>`, ma toggle `showFinance` ukrywający kartę. System widoczności
  modułów/feature'ów to generalizacja tego wzorca — zachowujemy UX, źródło prawdy przenosimy do Supabase.
- **Tokeny designu są czyste i theme-ready** (dark + 4 palety). Dlatego port `styles.css`
  bez zmian → wymóg 1:1 jest realny.
- **Luka:** nav w `Start.html` ma 8 zakładek — `Work.html` (Praca) istnieje, ale nie jest w nav.
  W routerze React podpinamy wszystkie 9.

---

## 2. Finalny stack i uzasadnienie

| Warstwa | Wybór | Uzasadnienie |
|---|---|---|
| Build/Framework | **React 18 + TypeScript + Vite** | zgodne z punktem wyjścia; Vite = szybki HMR, łatwy PWA plugin |
| Routing | **React Router (data router)** | 9 modułów + zagnieżdżone ekrany ustawień/integracji |
| Dane serwerowe | **TanStack Query** | cache, loading/empty/error, optimistic updates (wymóg) |
| Formularze + walidacja | **react-hook-form + Zod** | jeden schemat Zod współdzielony klient↔Edge Function ("nie ufaj klientowi") |
| Stan UI lokalny | React state + lekki store (Zustand) na config/sesję | konfiguracja czytana raz, cache per urządzenie |
| Styling | **`styles.css` portowany BEZ ZMIAN** + cienkie komponenty na istniejących klasach | gwarancja 1:1; **brak** przepisywania na Tailwind w MVP |
| Backend | **Supabase**: Postgres, Auth, Storage, RLS, Edge Functions, Realtime, Cron | jeden dostawca, RLS od dnia 1 |
| Logika serverless | **Supabase Edge Functions (jedno miejsce)** | tokeny OAuth, Vault/pgsodium i RLS są w Supabase — callbacki OAuth i webhook Strava trzymamy obok sekretów, bez rozjazdu na 2 platformy |
| Hosting web | **Netlify** (statyczny SPA + nagłówki bezpieczeństwa) | proste deploye, `_headers`/`netlify.toml` na CSP/HSTS |
| iOS | **Capacitor** + opcjonalny **HealthKit** (sen/HRV/tętno) | wspólny kod frontu |
| Windows | **PWA (MVP)**; Tauri odłożony | zero dodatkowego kodu; Tauri tylko gdy potrzebny offline-sejf / głęboka integracja OS |
| Szyfrowanie tokenów | **Supabase Vault / pgsodium** | tokeny OAuth nigdy w plaintext |

**Region:** projekt Supabase tworzony w **`eu-central-1` (Frankfurt)**.

---

## 3. Architektura (diagram)

```
                ┌───────────────────────── Wspólny frontend (React/TS/Vite) ─────────────────────────┐
   User ───────▶│  SPA na Netlify (CSP/HSTS/X-Frame…)                                                  │
                │   • React Router (9 modułów + Settings/Integrations/Security)                        │
                │   • TanStack Query (CRUD, optimistic, loading/empty/error)                           │
                │   • Config-driven render (czyta user_module/feature_settings)                        │
                └───────┬───────────────────────────────┬───────────────────────────────┬─────────────┘
                        │                                │                               │
              Supabase Auth                      Supabase Postgres + RLS         Supabase Storage
        (email+hasło, OAuth G/Apple/FB,        (deny-all default, user_id        (prywatne buckety,
         email confirm, MFA TOTP)               na każdej tabeli)                  signed URLs)
                        │                                │
                        └──────────────┐                 │
                                       ▼                 ▼
                          Supabase Edge Functions  ◀── Vault / pgsodium (szyfr. tokenów)
                            • OAuth callback (Google, Strava)
                            • Strava webhook (nowe aktywności)
                            • Eksport danych / usunięcie konta
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                              ▼
                 Google Calendar API            Strava API
                        ▲
   iOS (Capacitor + HealthKit)  ·  Windows (PWA)  ── ten sam bundle frontu
```

---

## 4. Struktura repo

```
rootine-os/
├─ apps/web/                 # SPA (Vite)
│  ├─ src/
│  │  ├─ app/                # router, providers (QueryClient, Auth, Config)
│  │  ├─ styles/styles.css   # PORT 1:1 z prototypu (źródło designu)
│  │  ├─ components/         # layout, topbar, nav, card, widget, form, modal, table, chart
│  │  ├─ modules/            # start/ sport/ diet/ finance/ goals/ office/ travel/ notes/ work/
│  │  │   └─ <mod>/{screen, widgets/, hooks/, schema.ts}
│  │  ├─ features/config/    # rejestr feature_key, hooki widoczności, ekran konfiguracji
│  │  ├─ features/auth/      # logowanie, rejestracja, MFA, security
│  │  ├─ lib/                # supabase client, query helpers, zod, toast
│  │  └─ types/              # typy generowane z DB (supabase gen types)
│  └─ public/                # manifest PWA, ikony, splash
├─ supabase/
│  ├─ migrations/            # SQL: tabele + RLS + indeksy + FK
│  ├─ functions/             # edge: oauth-google, oauth-strava, strava-webhook, export, delete-account
│  └─ seed/                  # seed z danych prototypu
├─ packages/shared/          # schematy Zod + typy współdzielone klient/serwer
├─ ios/                      # Capacitor (Faza 2)
├─ netlify.toml + _headers   # CSP/HSTS itd.
└─ ROOTINE-OS-PLAN.md
```

**Strategia komponentów:** prymitywy (`Card`, `Pill`, `StatGrid`, `Ring`, `Track`, `EditableList`)
odwzorowują istniejące klasy CSS; moduły składają z nich ekrany. `EditableList` to port silnika
`editable.js` na hook + komponent (z TanStack Query zamiast `localStorage`).

**Routing:** `/` → Start; `/sport`, `/diet`, `/finance`, `/goals`, `/office`, `/travel`,
`/notes`, `/work`; `/settings`, `/settings/integrations`, `/settings/security`, `/settings/modules`.
Trasy modułów filtrowane przez konfigurację użytkownika; ukryty moduł = brak w nav + guard na trasie.

**Stan:** serwer = TanStack Query (jedyne źródło danych domenowych); konfiguracja + sesja w lekkim
store, cache w `localStorage` per urządzenie dla szybkiego pierwszego renderu, rewalidacja z Supabase.

---

## 5. Strategia konfiguracji modułów / feature'ów

Trzy tabele + stabilny rejestr kluczy w kodzie (`feature_key`), np.
`start.weather_time`, `start.finance_pulse`, `start.today_tasks`, `start.calendar`,
`sport.readiness`, `sport.workout_logger`, `finance.budgets`, `work.kanban`,
`office.documents_vault`. Frontend renderuje **wyłącznie aktywne** moduły/feature'y — widoczność
nigdy nie jest hardcodowana.

- `user_module_settings` — per moduł: `visible`, `sort_order`.
- `user_feature_settings` — per `feature_key`: `visible`.
- `user_dashboard_layouts` — kolejność widgetów w obrębie ekranu (`screen`, `order[]`).
- Po rejestracji trigger zasiewa domyślną konfigurację (wszystko widoczne, kolejność domyślna).
- "Przywróć domyślne" = reset do rejestru z kodu.

---

## 6. Schemat bazy — Faza 1

**Konwencja dla każdej tabeli użytkownika:** `id uuid pk`, `user_id uuid → auth.users`,
`created_at`, `updated_at` (trigger), opcjonalnie `deleted_at` (soft delete), **RLS włączone**.

**Kanoniczny wzorzec RLS (deny-all + jawne polityki):**
```sql
alter table public.<t> enable row level security;
create policy "<t>_select" on public.<t> for select using (auth.uid() = user_id);
create policy "<t>_insert" on public.<t> for insert with check (auth.uid() = user_id);
create policy "<t>_update" on public.<t> for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "<t>_delete" on public.<t> for delete using (auth.uid() = user_id);
-- indeks: create index on public.<t> (user_id); + indeksy na FK i kolumnach dat
```

### Core
`profiles` (1:1 z auth.users), `user_preferences` (theme/palette/font/radius/locale),
`user_module_settings`, `user_feature_settings`, `user_dashboard_layouts`,
`audit_log` (append-only: logowania, błędne próby, zmiany finansów, dostęp do dokumentów,
eksport, usunięcie, podpięcie/odpięcie integracji), `sync_log`.

### Zadania / cele / praca
`tasks`, `task_notes`, `task_checklists`, `projects`, `work_companies`, `work_projects`,
`work_tasks`, `work_task_notes`, `goals`, `milestones`, `learning_paths`, `habits`, `habit_logs`.

### Sport
`exercises`, `workouts`, `workout_sets` (weight/reps/sets/RIR/RPE/notes), `body_measurements`,
`readiness_daily` (sen/HRV/tętno — ręcznie lub HealthKit), `runs`, `rehab_sessions`, `mobility_sessions`.

### Dieta
`food_items`, `meals`, `meal_items`, `nutrition_daily`.

### Finanse
`accounts`, `financial_categories`, `transactions`, `budgets`, `recurring_expenses`.

### Biuro / dokumenty
`document_categories`, `documents` (plik w Storage, nr dokumentu **szyfrowany**),
`insurance_policies`, `vehicles`, `vehicle_services`, `b2b_settlements`, `employment`, `vacations`.

### Podróże
`trips`, `trip_items`, `trip_documents`, `trip_budget_items`, `bucket_list`.

### Notatki
`note_collections`, `notes`, `journal_entries`.

### Integracje
`integrations` (status per provider), `integration_tokens` (**access/refresh szyfrowane Vault/pgsodium,
nigdy plaintext**), `calendar_events`, `strava_activities`.

Dostarczane w Fazie 0/1: migracje SQL, polityki RLS, indeksy, FK, seed z prototypu, komentarze decyzji.

---

## 7. Migracja template'ów HTML/CSS/JS → React

1. **Port `styles.css` 1:1** do `src/styles/` (bez modyfikacji klas).
2. **Shell:** `Topbar`, `Nav`, `Avatar`, `AppLayout` (grid 3-kolumnowy z `.grid/.col`).
3. **Prymitywy:** `Card`, `CardHead`, `Pill`, `Ring`, `Track`, `StatCell`, `EditableList`
   (port `editable.js` → hook + TanStack mutacje).
4. **Tweaks → ustawienia:** logikę z `tweaks-app.jsx` przenosimy do ekranu Ustawienia + systemu config;
   zachowujemy działanie `data-*` na `<html>`.
5. **Per-moduł:** statyczny HTML → komponenty widgetów czytające dane z Query; każdy widget ma
   stany loading/empty/error; każdy przycisk ma akcję lub `coming soon`.
6. **Weryfikacja wizualna:** screenshot diff względem oryginalnych template'ów (pixel-parity gate).

---

## 8. Faza 0 i Faza 1 — kroki/commity

### Faza 0 — Fundament
- `c0.1` scaffold Vite+React+TS, ESLint/Prettier, struktura repo
- `c0.2` port `styles.css` + shell (Topbar/Nav/Layout), routing 9 modułów (placeholdery)
- `c0.3` projekt Supabase (Frankfurt), `supabase` CLI, klient, env (**brak** service-role na froncie)
- `c0.4` migracje Core + **RLS od pierwszego dnia** + trigger `updated_at`
- `c0.5` Auth: email+hasło (Zod, polityka ≥12 znaków, zxcvbn, opcjonalnie HIBP k-anonymity), email confirmation (guard: brak potwierdzenia = brak danych)
- `c0.6` OAuth Google / Apple / Facebook
- `c0.7` tabele config + rejestr `feature_key` + seed domyślnej konfiguracji po rejestracji
- `c0.8` ekran Ustawień konta + Security (zmiana hasła, **MFA TOTP opcjonalne** + recovery codes, reset hasła bez ujawniania istnienia e-maila)
- `c0.9` nagłówki bezpieczeństwa (CSP/HSTS/…), rate limiting na endpointach wrażliwych
- `c0.10` audit_log + podpięcie zdarzeń auth

### Faza 1 — MVP CRUD (sekwencja pod priorytet "Start")
Ponieważ Start agreguje dane innych modułów, budujemy najpierw slice'y, które go zasilają, potem ekran Start, potem pełne ekrany modułów.
- `c1.1` **tasks** CRUD (+ checklist/notes) — zasila DZISIAJ
- `c1.2` **habits** + `habit_logs` (toggle, streak, dot-progress)
- `c1.3` **goals** + `milestones` (paski postępu)
- `c1.4` **finance** slice (accounts/transactions/budgets) → "Puls finansów"
- `c1.5` **nutrition** slice (nutrition_daily/meal_items) → "Największe kalorie"
- `c1.6` **calendar_events** (źródło lokalne; integracja w Fazie 3)
- `c1.7` **Ekran START** — złożenie widgetów z 1.1–1.6 + system widoczności/kolejności
- `c1.8` system konfiguracji UI: ukryj/pokaż moduł, ukryj/pokaż feature, reorder, reset
- `c1.9` pozostałe pełne ekrany: Sport (logger serii, 1RM, pomiary, readiness), Dieta, Finanse, Cele, Biuro+Storage (dokumenty prywatne, signed URLs), Podróże, Notatki, Praca (kanban)
- `c1.10` seed z prototypu, empty states, obsługa błędów + toasty, testy podstawowe (Vitest + RLS smoke testy), pixel-diff vs template

---

## 9. Ryzyka techniczne i bezpieczeństwa

- **Apple/Facebook OAuth** wymagają płatnego Apple Developer / weryfikacji aplikacji FB — możliwe opóźnienia konfiguracyjne; Google najszybsze. (Mitygacja: Google najpierw, reszta równolegle.)
- **Pixel-parity 1:1** — różnice renderowania React vs statyczny HTML (whitespace, kolejność). Mitygacja: port klas bez zmian + screenshot-diff gate.
- **Szyfrowanie tokenów** — błędna konfiguracja Vault/pgsodium = tokeny w plaintext. Mitygacja: dostęp do tokenów wyłącznie w Edge Functions, testy że klient nigdy nie widzi sekretów.
- **RLS** — łatwo zostawić tabelę bez polityki. Mitygacja: deny-all default + automatyczny test, że każda tabela ma RLS i 4 polityki.
- **Strava webhook** — wymaga publicznego, stabilnego endpointu i walidacji subskrypcji; limity API. (Faza 3.)
- **HealthKit** — tylko realne urządzenie iOS + uprawnienia; brak w web/Windows. (Faza 2, opcjonalne.)
- **MFA opcjonalne (wybór użytkownika)** — przy tak wrażliwych danych warto rozważyć step-up przy sejfie/eksporcie w przyszłości; na teraz pozostaje opcjonalne zgodnie z decyzją.
- **Migracja localStorage → Supabase** — prototyp nie ma realnych danych do migracji; seed startowy zamiast importu.

---

## 10. Następny krok
Czekam na akceptację tego planu (lub korekty) przed rozpoczęciem implementacji Fazy 0.
Po akceptacji zaczynam od `c0.1`–`c0.4` (scaffold + shell + Supabase + Core/RLS) i pracuję iteracyjnie, commit po commicie.

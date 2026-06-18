# Rootine OS — Roadmapa (stan aktualny)

## Stan na dziś — wszystkie fazy ukończone

### Stack
React 18 + TS + Vite + React Router + TanStack Query + Supabase. Kod w `apps/web/`.

### Hosting
- **Netlify** — `netlify.toml` (base=apps/web, publish=dist, SPA redirect, CSP/HSTS)
- **Vercel** — `vercel.json` (backup, SPA rewrite)
- **PWA** — `vite-plugin-pwa`, ikony w `apps/web/public/`
- **iPhone** — Safari → Udostępnij → Dodaj do ekranu głównego

### Migracje (do uruchomienia w Supabase SQL Editor)
Wszystkie pliki w `supabase/migrations/`:
- `0001_core` — user_preferences, audit_log, set_updated_at trigger
- `0002_tasks` — tasks
- `0003_habits` — habits, habit_completions
- `0004_goals` — goals, goal_milestones
- `0005_milestone_weight` — weight milestones
- `0006_finance` — finance_transactions, budgets, accounts
- `0007_diet` — food_items, meals, meal_items, nutrition_daily
- `0008_sport` — workouts, workout_sets, body_measurements, readiness_daily, runs
- `0009_notes` — note_collections, notes, journal_entries
- `0010_travel` — trips, trip_items, trip_documents, trip_budget_items, bucket_list
- `0011_work` — work_companies, work_projects, work_tasks, work_subtasks, work_task_notes
- `0012_office` — documents, insurance_policies, vehicles, vehicle_services, b2b_settlements, employment, vacations
- `0013_integrations` ← **NOWA** — integrations, integration_tokens, calendar_events, strava_activities

### Edge Functions (deploy po skonfigurowaniu sekretów)
W `supabase/functions/`:
- `oauth-google` — callback Google Calendar OAuth
- `oauth-strava` — callback Strava OAuth
- `strava-webhook` — webhook nowych aktywności Strava
- `data-export` — eksport danych RODO (GET z Bearer token)
- `delete-account` — usunięcie konta + danych (POST z potwierdzeniem)

Deploy: `supabase functions deploy --no-verify-jwt`

Sekrety do ustawienia w Supabase → Settings → Edge Functions → Secrets:
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_VERIFY_TOKEN`
- `TOKEN_ENC_KEY` (losowy 32-znakowy string)
- `APP_URL` (np. `https://rootine-os.netlify.app`)

Zmienne środowiskowe w Netlify:
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_GOOGLE_CLIENT_ID` (opcjonalne — do integracji)
- `VITE_STRAVA_CLIENT_ID` (opcjonalne — do integracji)

### CSS utility classes (ważne)
- `.fi` — flex:1, no width:100% (zamiennik .he-input w flex-row)
- `.fi-num` — 80px compact number input
- `.fi-sel` — inline select
- `.add-btn` — global (niezależny od kontekstu .log-add)

### Wzorzec CRUD (do ewentualnych nowych modułów)
1. Migracja SQL z RLS (enable + 4 polityki + indeks na user_id + trigger set_updated_at)
2. `features/<modul>/types.ts` + `api.ts` + `hooks.ts` (TanStack Query)
3. Ekran z hookami, stany loading/empty/error
4. Commit

### Konwencje
- Nowe pliki → Write tool; nadpisania istniejących → `cat > plik <<'EOF'` w bashu
- Po każdej partii skan NUL: `python3 -c "import os; [print('NUL:', f) for r,d,fs in os.walk('apps/web/src') for f in fs if open(os.path.join(r,f),'rb').read().count(b'\x00')]"`
- `npm install` / `build` robi użytkownik lokalnie (npm registry zablokowane w piaskownicy)

---

## Co zostało do zrobienia (opcjonalnie / przyszłość)

### Konfiguracja zewnętrzna (robi użytkownik)
- **Google Calendar**: Google Cloud Console → Calendar API → OAuth Client ID → `VITE_GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`
- **Strava**: strava.com/settings/api → `VITE_STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` + webhook
- **Supabase Storage**: prywatny bucket `documents` dla Biuro → podłączyć upload w BiuroScreen
- **Apple OAuth**: wymaga Apple Developer ($99/rok) — opcjonalne

### Możliwe ulepszenia
- Ciemny motyw — toggle w Ustawienia → Konto (już zaimplementowany) ✅
- Eksport danych / usunięcie konta (Ustawienia → Konto) ✅
- Integracje Google Calendar + Strava (Ustawienia → Integracje) ✅ (kod gotowy, wymaga konfiguracji)
- Supabase Storage dla dokumentów w Biuro
- Testy e2e (Playwright)
- Vite upgrade (advisory esbuild dev-server)
- Step-up MFA przy eksporcie/sejfie dokumentów
- Szyfrowanie numerów dokumentów (pgp_sym_encrypt / Supabase Vault)

---

## Kryteria MVP — status

- [x] Auth (email+hasło, OAuth, email confirm, MFA TOTP, RLS)
- [x] 9 ekranów z CRUD podłączonym do Supabase
- [x] Design 1:1 z oryginałem
- [x] PWA + hosting Netlify
- [x] Dark mode
- [x] Eksport danych + usunięcie konta
- [x] Integracje UI (Google Calendar, Strava) — wymaga konfiguracji API
- [ ] Storage dokumentów (Biuro)
- [ ] Aktywna integracja Google Calendar (wymaga konfiguracji)
- [ ] Aktywna integracja Strava (wymaga konfiguracji)

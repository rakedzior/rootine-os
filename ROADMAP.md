# Rootine OS — Roadmapa kontynuacji (dla nowej sesji)

Ten plik pozwala kontynuować budowę bez ponownego analizowania całości. Czytaj
od góry, realizuj „krok = commit", po każdym kroku: weryfikacja + commit + odświeżenie u użytkownika.

---

## 0. Kontekst (stan na teraz)

- **Stack:** React 18 + TS + Vite + React Router + TanStack Query + Supabase. Kod w `apps/web/`.
- **Design system:** `apps/web/src/styles/styles.css` (port 1:1). Per-moduł CSS: `nutrition/health/desk/travel/notes/work.css` (kopiowane z roota), importowane w ekranach.
- **Auth/Faza 0:** ukończone (e-mail+hasło, OAuth G/Apple/FB, email confirm, MFA TOTP, RLS od dnia 1, nagłówki CSP/HSTS w `netlify.toml`).
- **Region Supabase:** EU/Frankfurt. **MFA opcjonalne.** **Multi-user** (RLS, `auth.uid() = user_id`).
- **Migracje (zastosowane):** `0001_core`, `0002_tasks`, `0003_habits`, `0004_goals`, `0005_milestone_weight`, `0006_finance`. **Następna = `0007_*`.**
- **Konfiguracja modułów/feature'ów:** `apps/web/src/features/config/` (`registry.ts` = MODULES + FEATURES + ALL_FEATURE_KEYS; `useConfig.ts` = hooki czytające `user_module_settings`/`user_feature_settings` z fallbackiem do rejestru). Każdy widget gated przez `useIsFeatureVisible('<feature_key>')`.
- **Ekrany gotowe z CRUD:** Start (dashboard 3-kol), Cele, Finanse, oraz zadania/nawyki (na Starcie).
- **Ekrany z layoutem, BEZ danych (do podłączenia):** Dieta, Sport, Biuro, Podróże, Notatki, Praca.

### Wzorzec modułu CRUD (powtarzalny)
1. **Migracja SQL** `supabase/migrations/000N_<modul>.sql` — tabele z konwencją: `id uuid pk default gen_random_uuid()`, `user_id uuid references auth.users on delete cascade`, `created_at`, `updated_at` (+ trigger `set_updated_at`), opcj. `deleted_at`. **RLS enable + 4 polityki** (`auth.uid() = user_id`) + indeks na `user_id` + FK. Użytkownik wkleja plik w Supabase → SQL Editor → Run.
2. **Feature dir** `apps/web/src/features/<modul>/`: `types.ts`, `api.ts` (funkcje supabase, `uid()` helper, coercja `numeric` przez `Number()`), `hooks.ts` (TanStack Query: queries + mutacje z optimistic update na toggle/delete).
3. **Ekran**: zamień statyczne empty-states na żywe listy/formularze (stany loading/empty/error). Zachowaj klasy CSS.
4. **Start/agregacja** jeśli dotyczy (np. Dieta → karta „Podsumowanie kalorii").
5. Weryfikacja + commit.

### KONWENCJE PRACY (ważne — usterka mostu plików)
- Most plików **bywa zawodny przy NADPISYWANIU istniejących plików** (ucina treść lub zostawia bajty NUL, mimo „success"). **Dlatego: nowe pliki — OK tworzyć tool-em Write; nadpisania istniejących — pisz przez `cat > plik <<'EOF' … EOF` w bashu** (truncuje i zapisuje pewnie). Cudzysłów `'EOF'` zachowuje `${...}` i backticki dosłownie.
- **Po każdej partii zapisów** uruchom skan:
  ```bash
  cd /sessions/.../mnt/rootine-os   # ścieżka VM; w bashu: /sessions/<id>/mnt/rootine-os
  for f in $(find apps/web/src -type f); do n=$(tr -cd '\000' < "$f" | wc -c); [ "$n" -ne 0 ] && echo "CORRUPT($n): $f"; done
  # napraw: tr -d '\000' < f > /tmp/c && cat /tmp/c > f
  ```
  oraz sprawdź importy `@/...` i `tail -n1` każdego nowego pliku (czy kończy się `}`).
- npm registry jest zablokowane w piaskownicy → `npm install`/`build` robi UŻYTKOWNIK lokalnie. Nie dodawaj nowych zależności bez potrzeby (mamy: react, react-router-dom, @tanstack/react-query, @supabase/supabase-js, react-hook-form, zod, zustand, zxcvbn).
- Po każdym kroku użytkownik robi: `git add -A && git commit -m "…" && git push` oraz odświeża `http://localhost:5173` (Ctrl+Shift+R). Migracje wkleja ręcznie w SQL Editor.

---

## FAZA 1 — pozostały CRUD

### c1.6 — Dieta (NASTĘPNY)
- **Migracja `0007_diet.sql`:** `food_items` (name, kcal, protein, carb, fat, per_amount, unit), `meals` (date, name/slot), `meal_items` (meal_id, food_item_id|inline name+kcal+macros, amount), `nutrition_daily` (date unique per user: kcal_target, protein_target, carb_target, fat_target, water_ml, weight_kg). RLS na każdej.
- **Feature `features/diet/`** + podłącz `modules/diet/DietScreen.tsx`: dziennik (dodaj pozycję name+kcal[+makra], lista, usuń, suma dnia → ring/makra), cele dnia (edycja targetów → `nutrition_daily`), nawodnienie (klik szklanki → water_ml).
- **Start:** karta „Podsumowanie kalorii" (`features/diet` → kcal/makra dziś) zamiast statycznej w `StartScreen` (`NutritionSummaryCard`).
- `feature_key`: `diet.daily_targets`, `diet.macros`, `diet.meals`, `diet.calorie_balance`, `diet.food_items`.

### c1.9a — Sport
- **Migracja `0008_sport.sql`:** `exercises`, `workouts` (date, name, type, status), `workout_sets` (workout_id, exercise_id, weight, reps, set_no, rir/rpe, notes), `body_measurements` (date, weight, body_fat, lean_mass, circumferences jsonb), `readiness_daily` (date unique: sleep_h, hrv_ms, resting_hr, soreness), `runs` (date, distance_km, duration_s, source), `rehab_sessions`, `mobility_sessions`. RLS.
- **Feature `features/sport/`** + `modules/sport/SportScreen.tsx`: readiness (wpis sen/HRV/tętno → ring), pomiary ciała (wpis + lista), logger serii (workout + sets: ćwiczenie/ciężar/powt./serie/RIR), historia sesji, plan tygodnia, progresja/1RM (Epley: `1RM = w*(1+reps/30)`), rehab/mobility listy. Bieganie = placeholder do Stravy (Faza 3).
- **Start:** karta „Dzisiejszy trening" (najbliższy workout) — opcjonalnie.
- `feature_key`: `sport.readiness`, `sport.body_measurements`, `sport.today_workout`, `sport.workout_logger`, `sport.week_plan`, `sport.load_progression`, `sport.training_load`, `sport.session_history`, `sport.running`, `sport.rehab_mobility`.

### c1.9b — Notatki
- **Migracja `0009_notes.sql`:** `note_collections` (name, color), `notes` (collection_id, type[note|checklist|quote], title, body, pinned), `journal_entries` (date, prompt, body, mood). RLS.
- **Feature `features/notes/`** + `modules/notes/NotesScreen.tsx`: szybki zapis (textarea → notes), kolekcje (lista + licznik), tablica notatek (karty, przypinanie, usuwanie), dziennik (wpis dnia), ostatnio edytowane (order by updated_at).
- `feature_key`: `notes.quick_capture`, `notes.collections`, `notes.journal`, `notes.recent`.

### c1.9c — Podróże
- **Migracja `0010_travel.sql`:** `trips` (dest, country, start_date, end_date, status, notes), `trip_items` (trip_id, type[flight|lodging|transport|attraction], title, datetime, details jsonb), `trip_documents` (trip_id, name, expires_on, status), `trip_budget_items` (trip_id, category, planned, actual), `bucket_list` (name, note, status). RLS.
- **Feature `features/travel/`** + `modules/travel/TravelScreen.tsx`: najbliższy wyjazd (z `trips` po dacie), nadchodzące wyjazdy (lista + dodaj), dokumenty, budżet (planned vs actual bar), lista pakowania (jako trip_items type=packing lub osobna tabela `trip_packing` — dodaj jeśli trzeba), bucket list.
- `feature_key`: `travel.next_trip`, `travel.documents`, `travel.budget`, `travel.packing`, `travel.attractions`, `travel.flights`, `travel.lodging`, `travel.transport`, `travel.bucket_list`.

### c1.9d — Praca
- **Migracja `0011_work.sql`:** `work_companies` (name, type[client|own]), `work_projects` (company_id, name, status), `work_tasks` (project_id, title, status[todo|doing|done], due_date, sort_order), `work_task_notes` (task_id, body), `work_subtasks` (task_id, title, done). RLS.
- **Feature `features/work/`** + `modules/work/PracaScreen.tsx`: kanban (3 kolumny po `status`, przenoszenie zmienia status — dnd opcjonalnie, na start przyciski ←/→), firmy & projekty (CRUD), zadania (lista + subtaski + notatki + terminy).
- `feature_key`: `work.kanban`, `work.companies`, `work.projects`, `work.tasks`, `work.subtasks`, `work.task_notes`, `work.statuses`, `work.deadlines`.

### c1.9e — Biuro (z Supabase Storage)
- **Migracja `0012_office.sql`:** `document_categories`, `documents` (category_id, name, **doc_number szyfrowany** — patrz niżej, file_path w Storage, expires_on), `insurance_policies` (type, insurer, sum, premium, start/end), `vehicles` (name, plate, vin), `vehicle_services` (vehicle_id, type[przegląd|OC|AC|serwis], date, cost, due_on), `b2b_settlements` (month, zus, pit, vat, status), `employment` (employer, position, start_date, vacation_pool), `vacations` (start, end, days, type). RLS.
- **Storage:** prywatny bucket `documents` (RLS/policy: tylko właściciel), upload + **signed URLs** (brak publicznego dostępu). Ścieżka: `${user_id}/${uuid}_${filename}`.
- **Szyfrowanie wrażliwych pól** (numery dokumentów, dane B2B): Supabase Vault / pgsodium. MVP-minimum: trzymać numer dokumentu zaszyfrowany; deszyfracja w Edge Function lub kolumna `pgp_sym_encrypt`. (Jeśli zbyt złożone na teraz — oznacz pole jako „do zaszyfrowania" i wróć w Fazie 4 security review, ale NIE trzymaj w plaintext docelowo.)
- **Feature `features/office/`** + `modules/office/BiuroScreen.tsx`: wypełnij sekcje sub-nav (Dokumenty/Umowy/Auto/Ubezpieczenia/UoP/B2B/Urlopy) realnym CRUD + Dashboard z najbliższymi terminami (OC/AC, przeglądy, odnowienia polis).
- `feature_key`: `office.documents_vault`, `office.insurance`, `office.vehicles`, `office.b2b_settlements`, `office.employment`, `office.vacations`.

### c1.10 — domknięcie Fazy 1
- Seed danych demo (opcjonalnie), empty states wszędzie, toasty błędów (rozważyć lekki toast zamiast `auth-banner`), podstawowe testy (Vitest) + smoke-test RLS (każda tabela ma RLS + 4 polityki), pixel-diff vs template (opcjonalnie).
- **Audit log:** podłącz zdarzenia: zmiana finansów, dostęp do dokumentu, eksport, podpięcie/odpięcie integracji (helper `logAudit` już jest w `lib/audit.ts`).

---

## FAZA 2 — Cross-platform
- **PWA:** dodać `vite-plugin-pwa` (manifest, ikony w `public/`, splash), service worker (offline shell). Windows = PWA (instalacja z przeglądarki).
- **iOS (Capacitor):** `@capacitor/core` + `@capacitor/ios`, `npx cap init`, `cap add ios`, build → `cap copy`. Ikony/splash.
- **Apple HealthKit (opcjonalnie):** plugin Capacitor Health → zasilenie `readiness_daily` (sen/HRV/tętno) na iOS. Tylko realne urządzenie.

## FAZA 3 — Integracje (Supabase Edge Functions)
- **Edge Functions** (jedno miejsce logiki, sekrety w Supabase, NIE w froncie):
  - `oauth-google` (callback, wymiana code→token, zapis do `integration_tokens` **zaszyfrowane**), `oauth-strava` (jw.), `strava-webhook` (nowe aktywności → `strava_activities`/`runs`), refresh tokenów.
- **Migracja integracji** (`integrations`, `integration_tokens` — access/refresh **szyfrowane Vault/pgsodium**, `calendar_events`, `strava_activities`).
- **Google Calendar:** OAuth, sync wydarzeń → `calendar_events`, render w Start/Cele/Podróże/Praca (kalendarz miesięczny — podmień statyczny grid w `StartScreen.MonthCalendar`).
- **Strava:** OAuth, pobranie aktywności, webhook, → karta „Bieganie" w Sporcie.
- **Ekran Integracje** (`Settings → Integracje`, tab już istnieje jako placeholder): status, połącz/odłącz, odłączenie czyści tokeny + log audit.
- **Apple/Facebook OAuth** dla logowania wymagają konfiguracji w panelach providerów (Apple Developer płatne) — Google najłatwiejszy.

## FAZA 4 — Polish
- **Eksport danych** (RODO): Edge Function zbiera wszystkie tabele użytkownika → JSON/CSV (+ log audit, + step-up MFA jeśli włączone).
- **Usunięcie konta i danych:** Edge Function (kasuje dane + `auth.admin.deleteUser`), potwierdzenie.
- **Dark mode:** `data-theme` na `<html>` już wspierany w CSS; dodać przełącznik w `Settings → Konto` zapisywany do `user_preferences` (tabela istnieje). Zastosować palette/font/radius z `user_preferences` przy starcie (port logiki z `tweaks-app.jsx`).
- **Offline cache:** TanStack Query persist + SW.
- **Bezpieczeństwo:** review RLS, CSP, Storage policies; rozważyć step-up MFA przy sejfie/eksporcie.
- **Vite upgrade:** podbić Vite (advisory esbuild dev-server) — breaking, więc świadomie i z testem buildu.
- **Testy e2e** (Playwright), perf.

---

## Kryteria akceptacji MVP (do odhaczenia)
- [x] Rejestracja e-mail+hasło, [x] OAuth (konfiguracja providerów po stronie użytkownika), [x] email confirm wymagane, [x] MFA TOTP w ustawieniach, [x] RLS per użytkownik, [x] dane w Supabase, [x] ukrywanie modułów/feature'ów, [x] design 1:1, [x] audit log (podstawa).
- [ ] Każda z 9 zakładek z działającym CRUD (zostało: Dieta, Sport, Biuro, Podróże, Notatki, Praca).
- [ ] Dokumenty prywatne w Storage (Biuro, c1.9e).
- [ ] Tokeny integracji szyfrowane (Faza 3).
- [ ] Eksport danych + usunięcie konta (Faza 4).

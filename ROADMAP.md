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

### CSS utility classes (dodane — ważne!)
- `.fi` — flex:1, no width:100% (zamiennik .he-input w flex-row kontekście)
- `.fi-num` — 80px compact number input (zamiennik .kcal poza .log-add)
- `.fi-sel` — inline select (zamiennik .he-select w flex-row)
- `.add-btn` — global (był tylko .log-add .add-btn w nutrition.css)
- Zasada: `.he-input` ma `width:100%` — NIE używać w flex-row. Używać `.fi`.

### Hosting
- **Netlify** — `netlify.toml` w root repo (już skonfigurowany: base=apps/web, publish=apps/web/dist, SPA redirect, CSP/HSTS headers).
- **Vercel** — `vercel.json` w root repo (jako backup, SPA rewrite).
- **PWA** — skonfigurowane w `apps/web/vite.config.ts` (vite-plugin-pwa, NetworkFirst dla Supabase, ikony w `apps/web/public/`).
- **Dodanie do ekranu głównego iPhone:** Safari → Udostępnij ⬆ → „Dodaj do ekranu głównego". Capacitor/Xcode NIE jest potrzebny.
- **Netlify deployment:**
  1. Wejdź na netlify.com, zaloguj się przez GitHub
  2. „Add new site → Import an existing project" → wybierz repo `rootine-os`
  3. Netlify auto-wykrywa `netlify.toml` — kliknij Deploy
  4. Ustaw zmienne środowiskowe: `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`
  5. Gotowy URL (np. rootine-os.netlify.app) → dodaj do Supabase: Auth → URL Configuration → Site URL + Redirect URLs

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
  for f in $(find apps/web/src -type f); do n=$(tr -cd '\000' < "$f" | wc -c); [ "$n" -ne 0 ] && echo "CORRUPT($n): $f"; done
  ```
- npm registry jest zablokowane w piaskownicy → `npm install`/`build` robi UŻYTKOWNIK lokalnie.
- Po każdym kroku użytkownik robi: `git add -A && git commit -m "…" && git push` oraz odświeża `http://localhost:5173`. Migracje wkleja ręcznie w SQL Editor.

---

## FAZA 1 — pozostały CRUD (NASTĘPNY KROK: c1.6 Dieta)

### c1.6 — Dieta (NASTĘPNY)
- **Migracja `0007_diet.sql`:** `food_items` (name, kcal, protein, carb, fat, per_amount, unit), `meals` (date, name/slot), `meal_items` (meal_id, food_item_id|inline name+kcal+macros, amount), `nutrition_daily` (date unique per user: kcal_target, protein_target, carb_target, fat_target, water_ml, weight_kg). RLS na każdej.
- **Feature `features/diet/`** + podłącz `modules/diet/DietScreen.tsx`: dziennik (dodaj pozycję name+kcal[+makra], lista, usuń, suma dnia → ring/makra), cele dnia (edycja targetów → `nutrition_daily`), nawodnienie (klik szklanki → water_ml).
- **Start:** karta „Podsumowanie kalorii" (`features/diet` → kcal/makra dziś) zamiast statycznej w `StartScreen` (`NutritionSummaryCard`).
- `feature_key`: `diet.daily_targets`, `diet.macros`, `diet.meals`, `diet.calorie_balance`, `diet.food_items`.

### c1.9a — Sport
- **Migracja `0008_sport.sql`:** `exercises`, `workouts` (date, name, type, status), `workout_sets` (workout_id, exercise_id, weight, reps, set_no, rir/rpe, notes), `body_measurements` (date, weight, body_fat, lean_mass, circumferences jsonb), `readiness_daily` (date unique: sleep_h, hrv_ms, resting_hr, soreness), `runs` (date, distance_km, duration_s, source), `rehab_sessions`, `mobility_sessions`. RLS.
- **Feature `features/sport/`** + `modules/sport/SportScreen.tsx`: readiness (wpis sen/HRV/tętno → ring), pomiary ciała (wpis + lista), logger serii (workout + sets: ćwiczenie/ciężar/powt./serie/RIR), historia sesji, plan tygodnia, progresja/1RM (Epley: `1RM = w*(1+reps/30)`), rehab/mobility listy.
- `feature_key`: `sport.readiness`, `sport.body_measurements`, `sport.today_workout`, `sport.workout_logger`, `sport.week_plan`, `sport.load_progression`, `sport.training_load`, `sport.session_history`, `sport.running`, `sport.rehab_mobility`.

### c1.9b — Notatki
- **Migracja `0009_notes.sql`:** `note_collections` (name, color), `notes` (collection_id, type[note|checklist|quote], title, body, pinned), `journal_entries` (date, prompt, body, mood). RLS.
- **Feature `features/notes/`** + `modules/notes/NotesScreen.tsx`: szybki zapis, kolekcje, tablica notatek, dziennik, ostatnio edytowane.
- `feature_key`: `notes.quick_capture`, `notes.collections`, `notes.journal`, `notes.recent`.

### c1.9c — Podróże
- **Migracja `0010_travel.sql`:** `trips`, `trip_items`, `trip_documents`, `trip_budget_items`, `bucket_list`. RLS.
- **Feature `features/travel/`** + `modules/travel/TravelScreen.tsx`: najbliższy wyjazd, nadchodzące, dokumenty, budżet, pakowanie, bucket list.
- `feature_key`: `travel.next_trip`, `travel.documents`, `travel.budget`, `travel.packing`, `travel.attractions`, `travel.flights`, `travel.lodging`, `travel.transport`, `travel.bucket_list`.

### c1.9d — Praca
- **Migracja `0011_work.sql`:** `work_companies`, `work_projects`, `work_tasks` (status[todo|doing|done], due_date), `work_subtasks`, `work_task_notes`. RLS.
- **Feature `features/work/`** + `modules/work/PracaScreen.tsx`: kanban (3 kolumny), firmy & projekty (CRUD), zadania + subtaski + notatki + terminy.
- `feature_key`: `work.kanban`, `work.companies`, `work.projects`, `work.tasks`, `work.subtasks`, `work.task_notes`, `work.statuses`, `work.deadlines`.

### c1.9e — Biuro (z Supabase Storage)
- **Migracja `0012_office.sql`:** `document_categories`, `documents` (file_path w Storage, expires_on), `insurance_policies`, `vehicles`, `vehicle_services`, `b2b_settlements`, `employment`, `vacations`. RLS.
- **Storage:** prywatny bucket `documents`, upload + signed URLs. Ścieżka: `${user_id}/${uuid}_${filename}`.
- **Szyfrowanie wrażliwych pól** (numery dokumentów): Supabase Vault / pgsodium. MVP: oznacz jako „do zaszyfrowania" jeśli zbyt złożone, wróć w Fazie 4.
- `feature_key`: `office.documents_vault`, `office.insurance`, `office.vehicles`, `office.b2b_settlements`, `office.employment`, `office.vacations`.

### c1.10 — domknięcie Fazy 1
- Empty states wszędzie, toasty błędów, smoke-test RLS, audit log (`logAudit` w `lib/audit.ts`).

---

## FAZA 2 — Cross-platform ✅ UKOŃCZONA
- **PWA** ✅ — vite-plugin-pwa, manifest, ikony w `apps/web/public/`, splash screen
- **iOS** — PWA wystarczy (Dodaj do ekranu głównego z Safari). Capacitor/App Store: opcjonalnie w przyszłości.
- **Hosting** ✅ — Netlify (netlify.toml) + Vercel (vercel.json) gotowe

## FAZA 3 — Integracje (Supabase Edge Functions)
- **Edge Functions:** `oauth-google` (Calendar), `oauth-strava` + webhook, refresh tokenów.
- **Migracje integracji:** `integrations`, `integration_tokens` (zaszyfrowane), `calendar_events`, `strava_activities`.
- **Google Calendar:** sync wydarzeń → render w Start/Cele/Podróże/Praca.
- **Strava:** OAuth, pobranie aktywności, webhook → karta „Bieganie" w Sporcie.
- **Ekran Integracje** (Settings → Integracje, placeholder już istnieje).

## FAZA 4 — Polish
- **Eksport danych** (RODO): Edge Function → JSON/CSV + log audit.
- **Usunięcie konta:** Edge Function (kasuje dane + auth.admin.deleteUser).
- **Dark mode:** `data-theme` na `<html>` + przełącznik w Settings → user_preferences.
- **Offline cache:** TanStack Query persist + SW.
- **Bezpieczeństwo:** review RLS, CSP, Storage policies, step-up MFA przy eksporcie/sejfie.

---

## Kryteria akceptacji MVP
- [x] Auth (email+hasło, OAuth, email confirm, MFA TOTP, RLS)
- [x] Ekrany Start, Cele, Finanse z CRUD
- [x] Design 1:1
- [x] PWA + hosting (Netlify)
- [ ] Każda z 9 zakładek z działającym CRUD (zostało: Dieta, Sport, Biuro, Podróże, Notatki, Praca)
- [ ] Dokumenty prywatne w Storage (Biuro)
- [ ] Tokeny integracji szyfrowane (Faza 3)
- [ ] Eksport danych + usunięcie konta (Faza 4)

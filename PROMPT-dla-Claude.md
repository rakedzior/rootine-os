# Prompt dla Claude — budowa aplikacji „Rootine OS"

> Wklej poniższy tekst do Claude (najlepiej **Claude Code** w repozytorium projektu).
> Załącz do rozmowy 9 plików HTML + pliki CSS/JS jako referencję designu.

---

## ROLA I KONTEKST

Jesteś senior full-stack engineerem. Pomóż mi przekształcić **9 gotowych templatów
designowych (HTML/CSS/JS)** w pełnoprawną, produkcyjną aplikację **„Rootine OS"** —
osobisty system operacyjny do zarządzania życiem (zdrowie, finanse, praca, cele itd.).

Templaty to statyczne mockupy z danymi w pamięci. Mają wspólny design system
(`styles.css`: warm-light „White Lotus", fonty Cormorant Garamond / Plus Jakarta Sans /
IBM Plex Mono, tokeny kolorów, komponenty `.card`, `.pill`, `.stat-grid` itd.).
Chcę zachować **dokładnie ten wygląd** — to nie jest redesign, tylko „ożywienie".

### 9 modułów (zakładek):
1. **Start** — dashboard: pogoda+czas, puls finansów, podsumowanie kalorii, dzisiejsze
   zadania, kalendarz miesięczny, nawyki, dzisiejszy trening, postępy w celach.
2. **Sport** — gotowość/regeneracja (sen, HRV, tętno — wprowadzane ręcznie lub z Apple
   HealthKit przez Capacitor na iOS), pomiary ciała, dzisiejszy trening + logger serii,
   plan tygodnia, progresja obciążeń (1RM), obciążenie treningowe, historia sesji,
   bieganie (z Stravy), rehabilitacja/mobilność.
3. **Dieta** — makroskładniki, posiłki, bilans kaloryczny.
4. **Finanse** — saldo, budżet, wydatki (cykliczne i jednorazowe), kategorie.
5. **Cele** — momentum, nawyki kluczowe, roadmapa/gantt 2026, zadania, ścieżki nauki,
   kamienie milowe.
6. **Biuro** — dokumenty i sejf: ubezpieczenia, auto (przegląd, OC/AC, serwis), rozliczenia
   B2B/ZUS/PIT, umowa UoP, urlopy.
7. **Podróże** — najbliższy wyjazd, dokumenty podróżne, budżet, lista pakowania, plan
   atrakcji, loty, nocleg, transport, lista marzeń.
8. **Notatki** — szybki zapis, kolekcje, dziennik, ostatnio edytowane.
9. **Praca** — kanban projektów, najbliższe terminy, zadania klientów.

---

## CEL

Produkcyjna aplikacja działająca na **Windows (desktop)** oraz **iOS (mobile)**,
ze wspólnym kodem, backendem w **Supabase** i hostingiem/funkcjami na **Netlify**.
Integracje z **Google Calendar** i **Strava** (Garmin **poza zakresem** — nie implementuj).
Aplikacja przechowuje **wrażliwe dane osobowe i finansowe**, więc bezpieczeństwo jest
priorytetem nr 1 — patrz osobna sekcja niżej.

---

## STACK TECHNOLOGICZNY (zaproponuj i uzasadnij; to mój punkt wyjścia)

- **Frontend:** React + TypeScript + Vite. Przeniesienie 9 templatów na komponenty,
  z **zachowaniem istniejącego `styles.css`** jako bazy design-systemu (ewentualnie
  przepisanie na CSS Modules / Tailwind tokeny — zaproponuj, ale nie zmieniaj wyglądu).
- **State/Data:** TanStack Query + Supabase JS client. Realtime tam, gdzie ma sens.
- **Backend:** **Supabase** — Postgres, Auth, Storage (dokumenty/sejf), Row Level
  Security, Edge Functions, Realtime, Scheduled Functions (cron) do synchronizacji.
- **Hosting + serverless:** **Netlify** — hosting web/PWA + Netlify Functions do
  OAuth callbacków i webhooków integracji (lub Supabase Edge Functions — wybierz jedno
  miejsce i uzasadnij).
- **Cross-platform:**
  - **iOS:** **Capacitor** owijający tę samą aplikację web (dostęp do natywnych API,
    Apple HealthKit, powiadomienia push, App Store). 
  - **Windows:** **Tauri** (lekki, natywny shell, mały rozmiar) lub instalowalny **PWA**.
    Zarekomenduj jedno i wyjaśnij kompromisy.
- **Auth:** Supabase Auth — e-mail+hasło **oraz** OAuth **Google / Apple / Facebook**.
  Obowiązkowe potwierdzenie e-mail, opcjonalne MFA (TOTP). Jeden użytkownik = jego dane (RLS).
  Szczegóły w sekcji **BEZPIECZEŃSTWO**.

> Jeśli widzisz lepsze rozwiązanie dla części stacku — zaproponuj z uzasadnieniem,
> zanim zaczniesz kodować.

---

## MODEL DANYCH (Supabase / Postgres)

Zaprojektuj schemat z RLS (każda tabela ma `user_id` powiązany z `auth.users`).
Wyprowadź tabele z danych obecnych w templatach, m.in.:
- `profiles`, `habits`, `habit_logs`, `tasks`, `projects`, `goals`, `milestones`,
  `learning_paths`
- `workouts`, `workout_sets`, `exercises`, `body_measurements`, `readiness_daily`
  (sen/HRV/tętno), `runs`
- `meals`, `food_items`, `nutrition_daily`
- `accounts`, `transactions`, `budgets`, `recurring_expenses`
- `documents`, `insurance_policies`, `vehicles`, `vehicle_services`, `b2b_settlements`,
  `employment`, `vacations`
- `trips`, `trip_items` (pakowanie/plan/loty/nocleg), `bucket_list`
- `notes`, `note_collections`, `journal_entries`
- `integrations` (tokeny OAuth — **szyfrowane przez Vault/pgsodium**), `sync_log`,
  `calendar_events`, `audit_log` (wrażliwe akcje)

Dostarcz **migracje SQL** + polityki RLS (deny-all + jawne polityki per operacja) +
seed z przykładowymi danymi (te z templatów).

---

## BEZPIECZEŃSTWO (priorytet — aplikacja trzyma dane finansowe i osobowe)

### Rejestracja i logowanie
- **Dwie ścieżki rejestracji:**
  1. **E-mail + hasło** — silna polityka haseł (min. 12 znaków, sprawdzanie przeciw
     listom wycieków np. HaveIBeenPwned/zxcvbn), hashowanie po stronie Supabase (bcrypt).
  2. **Social OAuth** — **Google, Apple, Facebook** (Sign in with Apple obowiązkowe dla
     publikacji w App Store, jeśli są inne logowania społecznościowe).
- **Potwierdzenie e-mail obowiązkowe** — konto nieaktywne do czasu kliknięcia linku
  weryfikacyjnego (Supabase email confirmation). Bez tego brak dostępu do danych.
- **MFA / 2FA** — możliwość włączenia w ustawieniach: **TOTP** (Google Authenticator/
  Authy) przez Supabase MFA; kody zapasowe (recovery codes). Wymuś ponowną weryfikację
  MFA przy wrażliwych operacjach (zmiana hasła, eksport danych).
- **Resetowanie hasła** przez bezpieczny link e-mail z krótkim TTL.
- Ochrona przed brute-force: **rate limiting** na logowaniu i throttling prób.

### Ochrona danych
- **Row Level Security (RLS)** na każdej tabeli — użytkownik widzi wyłącznie swoje
  rekordy (`auth.uid() = user_id`). Domyślny deny-all; jawne polityki SELECT/INSERT/
  UPDATE/DELETE.
- **Szyfrowanie danych wrażliwych at-rest** — tokeny OAuth integracji, dane finansowe i
  numery dokumentów szyfrowane (Supabase **Vault / pgsodium**), nigdy w plaintext.
- **TLS/HTTPS wszędzie**, bezpieczne ciasteczka (HttpOnly, Secure, SameSite), krótki
  czas życia tokenu sesji + rotacja refresh-tokenu.
- **Sekrety** (klucze API, service-role key) wyłącznie w zmiennych środowiskowych
  Netlify/Supabase — **service-role key nigdy nie trafia do frontendu**.
- **Nagłówki bezpieczeństwa** (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) na
  Netlify.
- **Audit log** wrażliwych akcji (logowanie, zmiana danych finansowych, eksport).
- **Walidacja po stronie serwera** (Edge/Netlify Functions), nie ufaj klientowi.

### Zgodność i prywatność (RODO/GDPR)
- **Eksport danych** (JSON/CSV) i **trwałe usunięcie konta** + danych na żądanie.
- Minimalizacja danych, jasna polityka prywatności, zgody na integracje.
- Możliwość odłączenia każdej integracji (revoke OAuth) w jednym kliku.

---

## INTEGRACJE (faza po MVP)

1. **Google Calendar** — OAuth 2.0, dwukierunkowa synchronizacja wydarzeń do modułu
   Start/Cele/Podróże. Webhook (push notifications) lub okresowy sync. Mapowanie
   `calendar_events` ↔ zadania/wydarzenia w app.
2. **Strava** — OAuth, pobieranie aktywności (biegi/rowery) do modułu Sport →
   `runs`/`workouts`. **Webhook Strava** na nowe aktywności (Netlify/Edge Function).

> **Garmin — poza zakresem.** Nie implementuj. Dane regeneracji (sen/HRV/tętno)
> wprowadzane ręcznie lub opcjonalnie z Apple HealthKit (Capacitor, iOS).

Dla każdej integracji: bezpieczne (szyfrowane) przechowywanie tokenów, refresh,
obsługa wygaśnięcia, ekran „Integracje" ze statusem połączenia i przyciskiem odłączenia
(rdzeń ekranu już jest w module Sport).

---

## PLAN WDROŻENIA (fazami — pracuj iteracyjnie)

- **Faza 0 — Fundament:** repo, monorepo/struktura, Vite+React+TS, Supabase projekt,
  **Auth (e-mail+hasło, Google/Apple/Facebook, potwierdzenie e-mail, MFA-TOTP) + RLS
  od pierwszego dnia**, port design-systemu, layout topbara/nawigacji, routing 9 modułów.
- **Faza 1 — MVP (CRUD):** każdy moduł na żywych danych z Supabase, realtime,
  optymistyczne update'y. Bez integracji zewnętrznych.
- **Faza 2 — Cross-platform:** Capacitor (iOS) + Tauri/PWA (Windows), buildy, ikony,
  splash, powiadomienia.
- **Faza 3 — Integracje:** Google Calendar → Strava (w tej kolejności). Garmin pomiń.
- **Faza 4 — Polish:** offline-first/cache, eksport danych, ustawienia, dark mode
  (design system już go wspiera przez `data-theme`).

---

## CZEGO OCZEKUJĘ TERAZ (zanim zaczniesz kodować)

1. **Zadaj mi pytania doprecyzowujące** (multi-user vs single-user, priorytety
   modułów, czy MFA wymuszone czy opcjonalne, region przechowywania danych — UE/RODO,
   itd.).
2. Zaproponuj **finalny stack + architekturę** (diagram tekstowy) i **strukturę repo**.
3. Zaproponuj **schemat bazy** (SQL) dla Fazy 1.
4. Rozpisz **Fazę 0 i 1** na konkretne kroki/commity.
5. Dopiero po mojej akceptacji — zacznij implementację.

Pracuj przyrostowo, pokazuj działające kawałki, nie generuj całości naraz.
Zachowaj istniejący wygląd 1:1.

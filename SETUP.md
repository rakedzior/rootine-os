# Rootine OS — Setup (Faza 0)

## Wymagania
- Node 20+ / npm 10+
- Konto Supabase (projekt w regionie **eu-central-1 / Frankfurt**)
- Supabase CLI (`npm i -g supabase`) — opcjonalnie do lokalnych migracji

## Frontend
```bash
cd apps/web
cp .env.example .env        # uzupełnij VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173
```
> Service-role key NIGDY nie trafia do frontu — tylko anon key.

## Baza (Supabase)
1. Utwórz projekt w regionie **Frankfurt (eu-central-1)**.
2. Wgraj migracje z `supabase/migrations/` (przez SQL Editor lub `supabase db push`).
3. `0001_core.sql` zakłada tabele Core + RLS (deny-all) + trigger zasiewający
   profil, preferencje i 9 ustawień modułów po rejestracji użytkownika.

## Auth (kolejne commity Fazy 0)
- Email + hasło (polityka ≥12 znaków, zxcvbn), email confirmation.
- OAuth: Google, Apple, Facebook (konfiguracja w Supabase Auth → Providers).
- MFA TOTP: opcjonalne, włączane w ustawieniach.

## Hosting
- Netlify czyta `netlify.toml` (build w `apps/web`, nagłówki CSP/HSTS).

## Verification

```bash
cd apps/web
npm run build
npm run e2e
```

E2E requires a test account:

```bash
set E2E_EMAIL=test@example.com
set E2E_PASSWORD=...
npm run e2e
```

Without `E2E_EMAIL` and `E2E_PASSWORD`, Playwright tests are skipped.

## Integrations

- Google Calendar and Strava require API secrets configured for Supabase Edge Functions.
- Do not put integration secrets in `apps/web/.env`; the frontend uses only the anon key.

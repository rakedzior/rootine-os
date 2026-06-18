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

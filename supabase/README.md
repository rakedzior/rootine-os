# Supabase — Rootine OS

- **Region:** eu-central-1 (Frankfurt).
- **migrations/** — wersjonowany schemat. `0001_core.sql` = tabele Core + RLS + triggery.
- **functions/** — Edge Functions (Faza 3: OAuth callback Google/Strava, webhook Strava,
  eksport danych, usunięcie konta). Tu żyje cała logika wymagająca sekretów.

## Zasady
- RLS włączone na każdej tabeli, domyślnie deny-all, jawne polityki SELECT/INSERT/UPDATE/DELETE.
- `audit_log` jest append-only (brak polityk update/delete).
- Tokeny integracji szyfrowane (Vault/pgsodium) — nigdy plaintext, dostęp tylko z Edge Functions.
- Widoczność feature'ów = model override (brak wiersza == widoczne).

# Rootine OS — Development Audit (2026-06-19)

## TL;DR
The app is a **fully-styled, fully-interactive prototype running entirely on the
browser's `localStorage`**. The Supabase backend (schema, RLS, auth, MFA, Edge
Functions) **and** the complete client data-access layer (`api.ts` + `hooks.ts`
for every feature) are built and correct — but **the UI screens do not use them.**
Every screen reads/writes `store/localStore.ts` (Zustand + `persist`). Only the
**Finance** module has begun bridging to Supabase.

The roadmap's claim "9 screens with live CRUD on Supabase" is inaccurate: the CRUD
is real, but it targets `localStorage`, not the database.

## What this means in practice
- Data is **per-browser**: it does not sync between your Windows desktop and iPhone.
- Data is **not actually protected** by Supabase RLS — it never leaves the browser.
- Auth works, but after login the app shows local data unrelated to the account.
- **Clearing browser data wipes everything.**
- The Start dashboard is additionally **partly mock** (`MOCK_HABITS`, `MOCK_EVENTS`).

## Status matrix

| Module        | UI reads from              | Supabase api.ts | hooks.ts | Migration | Wired? |
|---------------|----------------------------|-----------------|----------|-----------|--------|
| Start         | localStore + **mock**      | (composes others) | exist  | —         | ✗ mock/local |
| Sport         | localStore                 | ✓ (14 calls)    | ✓        | 0008      | ✗ local |
| Dieta         | localStore                 | ✓ (7)           | ✓        | 0007      | ✗ local |
| Finanse       | localStore **+ finance hooks** | ✓ (18)      | ✓ (used) | 0006      | ◑ partial |
| Cele          | localStore                 | ✓ (10)          | ✓        | 0004      | ✗ local |
| Biuro         | localStore                 | ✓ (24)          | ✓        | 0012      | ✗ local |
| Podróże       | localStore                 | ✓ (17)          | ✓        | 0010      | ✗ local |
| Notatki       | localStore                 | ✓ (11)          | ✓        | 0009      | ✗ local |
| Praca         | localStore                 | ✓ (16)          | ✓        | 0011      | ✗ local |
| (habits)*     | localStore                 | ✓ (9)           | ✓ unused | 0003      | ✗ local |
| (tasks)*      | localStore                 | ✓ (6)           | ✓ unused | 0002      | ✗ local |
| config/prefs  | Supabase                   | ✓ (8)           | ✓ used   | 0001      | ✓ wired |
| integrations  | Supabase (Settings)        | ✓ (10)          | ✓ used   | 0013      | ✓ UI ready, needs API keys |

*habits and tasks are cross-cutting (used by Start, Cele, Praca).

## What genuinely works
- Supabase **schema + RLS** for all modules (migrations 0001–0013).
- **Auth**: email+password, OAuth scaffolding, email confirmation, MFA/TOTP.
- **Edge Functions**: Google + Strava OAuth callbacks, Strava webhook, GDPR
  data-export, account deletion.
- **User preferences** (module visibility, theme) — actually wired to Supabase.
- **Integrations UI** in Settings — wired; just needs external API credentials.
- **Design system** — the new 10-theme redesign (this session).

## The real remaining work: bridge UI → Supabase
The hooks already exist and the localStore types mirror the DB schema, so this is
"connect the wires", not "build the backend".

**Pattern per module:**
1. Replace `useLocalStore(...)` selectors with the feature `hooks.ts` queries.
2. Add loading / empty / error states (classes exist: `.skeleton`, `.empty-state`,
   `.agenda-empty`).
3. Convert local writes to hook mutations (optimistic updates already scaffolded).
4. Delete mock data (Start).
5. Optional: one-time `localStore → Supabase` import so existing local data isn't lost.

**Suggested order (low risk → high value):**
1. **Dieta** — small, clean hooks; good reference next to Finance.
2. **Finanse** — finish the partial bridge.
3. **Notatki** — simple CRUD.
4. **Cele + tasks + habits** — cross-cutting; also un-mocks the Start dashboard.
5. **Sport** — largest surface.
6. **Podróże**, **Praca**, **Biuro** (Biuro also needs Storage for documents).
7. **Start** — recompose from now-real hooks; remove mocks.

## Other open items (from roadmap, still valid)
- **Document Storage** (Biuro): private `documents` bucket + upload UI.
- **Activate Google Calendar + Strava**: needs your API keys/secrets (external setup).
- **Security hardening**: encrypt document numbers (pgsodium/Vault), step-up MFA for
  export/vault, audit-log coverage.
- **Tests**: no e2e (Playwright) yet.
- **Dead code**: `features/*/{FinancePulse,HabitList,GoalProgress,TaskList}.tsx`
  components exist but are not rendered anywhere.

## Environment notes
- Production `vite build` needs the Linux rollup native binary; the cross-platform
  optional-deps bug means a clean `rm -rf node_modules package-lock.json && npm i`
  may be needed if it errors.
- This sandbox's filesystem corrupts git lock/index files and truncates some large
  writes — commit and verify on your real machine.

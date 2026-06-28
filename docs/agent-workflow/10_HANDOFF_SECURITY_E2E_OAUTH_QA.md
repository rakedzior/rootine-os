# Handoff: Security, E2E, OAuth, Visual QA

Date: 2026-06-27
Branch: `chore/codex-agent-setup`

## Current state

The branch has been pushed and contains the security hardening, E2E setup, OAuth verification, and QA follow-up work.

Recent commits:

- `32619fc` Harden document and MFA security
- `58a8fc9` Add office CRUD e2e coverage and clean docs encoding
- `ad0691c` Load e2e env files in Playwright config
- `bfcdc88` Stabilize authenticated e2e selectors

## Completed

- Added encrypted-at-rest storage path for `documents.doc_number`.
- Applied remote Supabase migration `0032_encrypt_document_numbers.sql`.
- Added owner-checked RPC decrypt path for document numbers.
- Added reusable in-app MFA step-up modal.
- Wired MFA step-up into data export, account deletion, and Office document file open.
- Enforced AAL2 server-side in `data-export` and `delete-account`.
- Deployed `data-export` and `delete-account`.
- Added audit logs for document metadata create/delete and MFA enable/disable.
- Added Playwright E2E setup.
- Added authenticated Office CRUD E2E test.
- Added `.env.e2e.local` / `.env.local` / `.env` loading in Playwright config.
- Stabilized E2E selectors after real credential run.
- Cleaned mojibake in agent workflow docs.
- Deployed OAuth functions:
  - `oauth-google`
  - `oauth-strava`
  - `strava-webhook`
- Verified OAuth redirect construction from the app:
  - Google redirects to `accounts.google.com` with Supabase callback.
  - Strava redirects to `strava.com/oauth` with Supabase callback.
- Verified callback smoke behavior:
  - Google/Strava callbacks without `code/state` return `400`.
  - Strava webhook with invalid verify token returns `403`.
- Ran authenticated visual QA screenshots for:
  - Start
  - Finance
  - Office
  - Diet
  - Sport
  - Settings / Integrations
  - desktop and mobile viewports

## Validation

Latest successful checks:

- `npm run e2e`: `10 passed`
- `npm run lint`: passed
- `npm run build`: passed
- `git diff --check`: passed before relevant commits

Local E2E credentials are expected in ignored env files, preferably:

```env
apps/web/.env.e2e.local
E2E_EMAIL=...
E2E_PASSWORD=...
```

Do not commit credentials or provider secrets.

## Remaining work

1. Open PR manually:

   `https://github.com/rakedzior/rootine-os/pull/new/chore/codex-agent-setup`

   `gh` is not installed on this machine, and the available GitHub connector did not expose PR creation.

2. Complete Google/Strava OAuth consent manually in a browser.

   Headless verification confirmed redirect URLs and callbacks, but provider login/consent still requires a real interactive account session.

3. Fix mobile visual QA issues:

   - Start mobile: calendar view segmented controls are clipped on narrow viewport.
   - Diet mobile: `Podsumowanie/Nawodnienie` panel overlaps meal list content.
   - Sport mobile: right header action (`+ Zaplanuj...`) overflows outside the viewport.

4. Office document upload visual/functional QA still needs seeded test documents.

   The E2E account did not have Office document metadata rows, so file upload/open/remove could not be exercised through UI.

## Useful commands

```powershell
cd C:\dev\rootine-os\apps\web
npm run e2e
npm run lint
npm run build
```

Start local dev server:

```powershell
cd C:\dev\rootine-os\apps\web
npm run dev -- --host 127.0.0.1
```

Local app URL:

```text
http://127.0.0.1:5173/
```

## Notes

- Supabase project: `kolmleeastcfvsvyasap`.
- OAuth/provider secrets are already configured in Supabase according to the user and were verified by secret name presence.
- Values were not copied into repo files.
- Visual QA artifacts were generated under `apps/web/test-results/visual-qa/` and are ignored.

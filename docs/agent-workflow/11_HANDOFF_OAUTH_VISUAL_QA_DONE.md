# Handoff: OAuth Consent Fixed, Visual QA Follow-up, Next Context

Date: 2026-06-28
Branch: `fix/mobile-visual-qa-followups`

## Current state

The main security/E2E/OAuth branch was merged to `main`.

Follow-up branch:

```text
fix/mobile-visual-qa-followups
```

Pushed commits on the follow-up branch:

- `7c71ba5` Fix mobile visual QA followups
- `42bfee9` Add security QA handoff
- `8936c5b` Fix OAuth integration callback redirects

Open PR URL:

```text
https://github.com/rakedzior/rootine-os/pull/new/fix/mobile-visual-qa-followups
```

## Completed in this follow-up

- Fixed Start mobile visual QA issues:
  - calendar header controls no longer clip on narrow screens;
  - task filter row no longer creates horizontal overflow.
- Fixed Diet mobile visual QA issues:
  - date bar wraps correctly;
  - summary/hydration/rhythm panels stack after meal cards instead of overlapping content.
- Fixed Sport mobile visual QA issue:
  - page-header actions, including `+ Zaplanuj blok`, stay inside the viewport.
- Fixed OAuth callback return behavior:
  - frontend now encodes `{ userId, returnTo }` in OAuth `state`;
  - `oauth-google` and `oauth-strava` decode state and redirect back to the initiating app origin;
  - local OAuth consent returns to `http://127.0.0.1:5173/settings/integrations`;
  - production still falls back to `APP_URL`;
  - callback errors are now more specific: `token`, `database`, or `server`.
- Deployed updated Supabase Edge Functions:
  - `oauth-google`
  - `oauth-strava`
- Google Calendar OAuth consent was tested manually and works.
- Strava OAuth consent was tested manually and works.
- Supabase Strava secrets were corrected:
  - `STRAVA_CLIENT_ID` is the numeric Strava client ID.
  - `STRAVA_CLIENT_SECRET` is stored only in Supabase secrets, not in repo.
- Supabase Google client ID was aligned with the frontend public client ID.
- Google client secret was set manually by the user in Supabase secrets.

## Validation

Latest validation before OAuth follow-up commit:

```powershell
cd C:\dev\rootine-os\apps\web
npm run lint
npm run build
npm run e2e
```

Results:

- `npm run lint`: passed
- `npm run build`: passed
- `npm run e2e`: 10 passed
- `git diff --check`: passed

After OAuth code changes:

- `npm run lint`: passed
- `npm run build`: passed
- Supabase functions deployed successfully.
- Manual Google Calendar connection: works.
- Manual Strava connection: works.

## Important implementation notes

- Do not commit provider secrets.
- `apps/web/.env` contains public Vite values only.
- For Strava, the frontend value must be the numeric client ID:

```env
VITE_STRAVA_CLIENT_ID=<numeric_client_id>
```

- Supabase secrets should contain:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
TOKEN_ENC_KEY
APP_URL
```

- Strava callback domain should be:

```text
kolmleeastcfvsvyasap.supabase.co
```

- Google authorized redirect URI should be:

```text
https://kolmleeastcfvsvyasap.supabase.co/functions/v1/oauth-google
```

## Remaining work

1. Merge the follow-up PR:

   ```text
   https://github.com/rakedzior/rootine-os/pull/new/fix/mobile-visual-qa-followups
   ```

2. Office document upload/open/remove QA still needs a real seeded document/file flow.

   The existing E2E test covers Office task CRUD, but not document file upload/open/remove.

   Suggested next task:

   - inspect current `Biuro` document UI;
   - create or seed one safe test document metadata row for the E2E user if needed;
   - upload a harmless test file;
   - verify open/download;
   - verify remove;
   - add focused E2E coverage if the UI flow is stable.

3. Optional follow-up:

   Update the old handoff file `10_HANDOFF_SECURITY_E2E_OAUTH_QA.md`, because its remaining OAuth/mobile items are now done.

## Useful commands

Start local app:

```powershell
cd C:\dev\rootine-os\apps\web
npm run dev -- --host 127.0.0.1
```

Run checks:

```powershell
cd C:\dev\rootine-os\apps\web
npm run lint
npm run build
npm run e2e
```

Deploy OAuth functions:

```powershell
cd C:\dev\rootine-os
supabase functions deploy oauth-google --project-ref kolmleeastcfvsvyasap --no-verify-jwt
supabase functions deploy oauth-strava --project-ref kolmleeastcfvsvyasap --no-verify-jwt
```

## New chat starter

Paste this into the next chat:

```text
Read docs/agent-workflow/11_HANDOFF_OAUTH_VISUAL_QA_DONE.md and continue from there.

Current repo: C:\dev\rootine-os
Current branch: fix/mobile-visual-qa-followups

OAuth Google and Strava are now manually verified as working. Mobile visual QA fixes are pushed. Next priority: merge the follow-up PR, then complete Office document upload/open/remove QA and add E2E coverage if practical.
```

# Rootine OS - Handover Supabase Module Plan

Repo: `C:\dev\rootine-os`

Mode: continue the orchestrator plan. Do not redesign UI. Preserve Graphite Cool Ice v3.

## Main Goal

Move Rootine OS modules from mocks / `localStore` to Supabase module by module, with migrations, React Query hooks, and build verification.

## Completed

1. Settings module visibility
   - `Sidebar.tsx` and `MobileBottomNav.tsx` use `useVisibleModules`.

2. Supabase data foundation
   - `supabase/functions/data-export/index.ts` expanded for current data groups.
   - `supabase/functions/delete-account/index.ts` updated.
   - Added `apps/web/docs/agent-workflow/08_SUPABASE_DATA_FOUNDATION.md`.

3. Work / Praca
   - Migration: `supabase/migrations/0026_work_screen_parity.sql`.
   - `supabase db push` was run and succeeded.
   - `PracaScreen.tsx` no longer uses `localStore`.

4. Goals / Cele
   - Migration: `supabase/migrations/0027_goals_screen_parity.sql`.
   - `supabase db push` was run and succeeded.
   - `GoalsScreen.tsx` no longer uses `localStore`.
   - Added `goal_tasks`.

5. Notes / Notatki
   - Migration: `supabase/migrations/0028_notes_screen_parity.sql`.
   - User said they completed the migration.
   - `NotesScreen.tsx` no longer uses `localStore`.

6. Travel / Podroze
   - Migration: `supabase/migrations/0029_travel_screen_parity.sql`.
   - `TravelScreen.tsx` no longer uses `localStore`.
   - It is not confirmed whether migration `0029` has been pushed.

7. Office / Biuro
   - Migration: `supabase/migrations/0030_office_screen_parity.sql`.
   - Added/expanded:
     - `office_tasks`
     - `office_categories`
     - parity fields for `documents`
     - parity fields for `vehicles`
     - parity fields for `insurance_policies`
     - `status` and `notes` for `vacations`
   - Updated:
     - `apps/web/src/features/office/types.ts`
     - `apps/web/src/features/office/api.ts`
     - `apps/web/src/features/office/hooks.ts`
     - `apps/web/src/modules/office/BiuroScreen.tsx`
   - `BiuroScreen.tsx` no longer uses `localStore`.
   - `npm run build` passed.

8. Finance / Finanse
   - `FinanceScreen.tsx` no longer uses `localStore`.
   - Updated `apps/web/src/features/finance/{types,api,hooks}.ts` to use the
     `finance_*` tables from `0024_finance_redesign.sql`.
   - Recurring payments, one-off reminders, budget categories, savings goals,
     accounts and JDG checklist now persist through Supabase.
   - Removed legacy unrouted finance cards and their compatibility hook/type
     shims:
     - `modules/finance/BudgetsCard.tsx`
     - `modules/finance/CategoriesCard.tsx`
     - `modules/finance/RecurringCard.tsx`

9. Diet / Dieta
   - Verified `DietScreenV2.tsx` already uses Supabase diet hooks.

10. Sport
   - Verified `SportScreen.tsx` already uses Supabase sport hooks.
   - Removed the stale localStore reference from `features/sport/catalog.ts`.

11. Start / Planer
   - Verified `StartScreen.tsx` uses Supabase tasks and habits hooks.

12. Cleanup
   - Deleted unused helper components:
     - `features/finance/FinancePulse.tsx`
     - `features/goals/GoalProgress.tsx`
     - `features/habits/HabitList.tsx`
     - `features/tasks/TaskList.tsx`
   - Deleted obsolete `apps/web/src/store/localStore.ts`.

13. Documents storage
   - Added and pushed migration `supabase/migrations/0031_documents_storage_bucket.sql`.
   - Creates private Supabase Storage bucket `documents`.
   - Storage object policies require files to live under `{auth.uid()}/...`.
   - Documented the bucket contract in both documents module specs.
   - `BiuroScreen.tsx` logs a best-effort `document_access` audit event when
     the documents modal is opened.
   - Added Office document file upload/open/remove UI.
   - Opening document files uses a 60-second signed URL.
   - Upload/open/remove operations log best-effort audit events.

14. MFA / audit / export hardening
   - Account data export and account deletion now block when Supabase reports
     the session needs MFA step-up.
   - Office document file open also blocks when MFA step-up is needed.
   - Finance mutations log best-effort `finance_change` audit events.
   - `data-export` includes `document_storage_objects` metadata for private
     objects in the `documents` bucket.
   - Added `docs/SECURITY-HARDENING.md` with remaining encryption/server-side
     MFA work.

15. E2E scaffolding
   - Added `@playwright/test`.
   - Added `apps/web/playwright.config.ts`.
   - Added authenticated smoke tests in `apps/web/tests/e2e/app-smoke.spec.ts`.
   - Added `npm run e2e`; tests require `E2E_EMAIL` / `E2E_PASSWORD` and skip
     otherwise.

## Important Notes

- Do not revert unrelated changes.
- The worktree is dirty and includes previous UI and migration work.
- Some files still have existing mojibake / Polish character encoding issues. Do not do a broad encoding rewrite without a dedicated task.
- Use `apply_patch` for manual edits.
- After major changes, run:

```powershell
npm run build
```

from `C:\dev\rootine-os\apps\web`.

## Immediate Next Step

No screen modules currently depend on `useLocalStore`.

Continue with deeper hardening and product work:

1. Implement real encryption for `documents.doc_number` using server-side key
   management. Do not ship encryption keys to the frontend.
2. Replace the current MFA "block and tell user" behavior with a first-class
   step-up challenge modal, then enforce AAL2 inside Edge Functions too.
3. Run Playwright with a configured test account and expand from smoke tests to
   CRUD assertions.
4. Configure/test Google Calendar and Strava credentials.
5. Do a dedicated mojibake/Polish encoding cleanup pass.

## How To Verify localStore Is Gone

```powershell
rg -n "useLocalStore" apps/web/src
```

Expected result: no live code usage. Mentions in historical docs only are okay.

## Standard Module Workflow

For each module:

1. Read the screen and existing `features/<module>`.
2. Compare the UI model with the current Supabase schema.
3. Add a migration `00xx_<module>_screen_parity.sql` if tables/fields are missing.
4. Update `types.ts`, `api.ts`, and `hooks.ts`.
5. Move the screen from `localStore` to Supabase hooks.
6. Preserve the current layout and Graphite Cool Ice v3 style.
7. Run build.
8. Report whether `supabase db push` is needed.

## Last Known Verification

`npm run build` in `apps/web` passed after Finance bridging, localStore cleanup,
documents storage/upload UI, MFA blocking, audit expansion, data-export storage
metadata, and Playwright scaffolding.

`npx playwright test --list` lists 9 smoke tests.

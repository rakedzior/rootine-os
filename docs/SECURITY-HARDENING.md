# Security Hardening Notes

## Implemented

- Supabase RLS on user-owned tables.
- Private `documents` Storage bucket with object paths scoped to `{auth.uid()}/...`.
- Office document file open uses short-lived signed URLs.
- Office document file open blocks when Supabase reports MFA step-up is needed.
- Account export and account deletion block when Supabase reports MFA step-up is needed.
- Best-effort audit events for:
  - login/logout/password change
  - export/account deletion through Edge Functions or settings actions
  - finance mutations
  - Office document list/file access and file upload/removal

## Still Required

- Encrypt `documents.doc_number`.
  - Prefer Supabase Vault/pgsodium or a dedicated server-side encryption function.
  - Do not ship encryption keys in client code.
  - Plan a migration that backfills existing `doc_number` values into encrypted storage,
    then removes or nulls plaintext once verified.
- Add a first-class MFA challenge UI for step-up actions instead of only blocking and
  asking the user to re-verify through settings/login.
- Extend audit coverage for every document metadata create/update/delete action.
- Add e2e assertions for storage upload/open/remove once an E2E account is configured.
- Review Edge Functions so high-risk operations enforce AAL2 server-side, not only in
  the browser.

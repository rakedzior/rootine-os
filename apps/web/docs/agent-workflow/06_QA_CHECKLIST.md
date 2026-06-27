# Rootine OS â€” QA Checklist

## Build quality

- [ ] App installs successfully.
- [ ] App builds successfully.
- [ ] Lint passes or existing issues are documented.
- [ ] Tests pass if present.
- [ ] TypeScript errors are resolved or documented.

## Functional quality

For every implemented module:

- [ ] List view loads.
- [ ] Empty state works.
- [ ] Loading state works.
- [ ] Error state works.
- [ ] Add flow works.
- [ ] Edit flow works.
- [ ] Delete/archive flow works.
- [ ] Details view works.
- [ ] Save state is clear.
- [ ] Validation works.
- [ ] Data persists after refresh.
- [ ] User can cancel without unwanted data changes.
- [ ] Disabled actions are visually clear.

## Supabase quality

- [ ] Tables exist.
- [ ] Migrations are documented.
- [ ] RLS is enabled.
- [ ] User can only access own records.
- [ ] Queries are scoped by user.
- [ ] Indexes exist for common filters.
- [ ] No final flow depends on mock data.

## UI quality

- [ ] Existing Graphite Cool Ice v3 style is preserved.
- [ ] No accidental redesign.
- [ ] No oversized neon accents.
- [ ] No large blue/cyan filled panels.
- [ ] No pure black or pure white surfaces/text.
- [ ] Spacing remains consistent.
- [ ] Modals/drawers are readable.
- [ ] Buttons are consistent.
- [ ] Forms are not overloaded.
- [ ] Components use available screen space logically.
- [ ] Icons are consistent and readable.

## Regression quality

- [ ] Other modules still render.
- [ ] Navigation still works.
- [ ] Auth still works.
- [ ] Global layout is not broken.
- [ ] Shared UI components are not degraded.

## Final QA result

PASS / FAIL:

Notes:

Blocking issues:

Non-blocking issues:

Recommended next action:
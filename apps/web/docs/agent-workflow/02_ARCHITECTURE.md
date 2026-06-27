# Rootine OS â€” Architecture Notes

## Goal

This file should be maintained by agents as they discover the actual repository architecture.

## Expected application layers

Use the existing project structure. Do not force a new architecture unless necessary.

Typical layers may include:

- routes/pages
- feature components
- shared UI components
- hooks
- services/API clients
- Supabase client
- types/interfaces
- utility functions
- state management if present

## Implementation preferences

1. Prefer feature-local code for module-specific behavior.
2. Extract shared code only when at least two modules genuinely need it.
3. Avoid large global rewrites.
4. Preserve current styling and design tokens.
5. Keep Supabase calls behind services/hooks where the current architecture allows it.
6. Keep types close to module logic or in a shared types layer if already used.
7. Avoid adding heavy dependencies unless clearly justified.
8. Keep all visual changes aligned with Graphite Cool Ice v3.

## Agent instruction

Before implementing a module:

1. Identify current folder structure.
2. Identify the module entry point.
3. Identify mock data.
4. Identify existing services/hooks/types.
5. Reuse existing patterns where possible.
6. Document any architecture change here.
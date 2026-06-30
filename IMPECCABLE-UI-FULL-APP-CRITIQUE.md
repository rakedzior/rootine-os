# Full App Design Critique

Step 21 audit for the Rootine OS UI redesign.

## Scope

- Live check: unauthenticated `/login` screen on `http://127.0.0.1:5176/`.
- Implementation check: protected app modules and CSS, because protected routes require auth in the browser.
- Main reviewed areas: routing, sidebar navigation, page shell primitives, global design tokens, auth styling, and tab-specific CSS for Planner, Sport, Nutrition, Goals, Finance, Office/Documents, Work, Travel and Notes.

## High Priority Findings

### 1. Auth still feels like a separate mini design system

Where:
- `apps/web/src/features/auth/auth.css`
- Login/register/forgot/reset/confirm screens.

Issue:
The auth layer redefines dark theme tokens locally (`--bg-0`, `--surface`, `--acc`, shadows, semantic colors) instead of inheriting the app-level token contract. The visual result is close, but auth has its own card radius, shadow, control sizing and background language.

Exact fix:
- Remove local token duplication from `.auth-wrap` where possible.
- Keep auth-specific layout, but consume global `--surface-*`, `--text-*`, `--accent-*`, `--ui-control-*`, `--ui-card-radius`.
- Align `.auth-card` radius/shadow with `--ui-card-radius` and `--sh-pop`/`--sh-1`.
- Make `.auth-btn` and `.oauth-btn` visually match `.btn`, `.btn-primary`, and `.btn-secondary`.

### 2. Shared layout primitives exist, but only some modules use them deeply

Where:
- Shared primitives: `apps/web/src/components/layout/primitives.tsx`
- Strong usage: Sport panels use `ModuleCard` and `ModuleHeader`.
- Most other tabs still use local card/header classes such as `travel-card`, `work-panel`, `office-mini-panel`, `notes-card`, `finance-*`.

Issue:
All main tabs now use `PageLayout`, which is good. But card/header/action patterns are still mostly bespoke per module. This makes spacing, headings, action alignment and empty states drift even after visual polish.

Exact fix:
- In Step 22, avoid a risky component migration, but normalize via CSS grouped selectors first.
- Standardize card contract across local classes: `border`, `radius`, `background`, `box-shadow`, `padding`, `gap`, `min-width: 0`.
- Later optimization can migrate stable panels to `ModuleCard` / `ModuleHeader`.

### 3. CSS layering is now the main source of inconsistency

Where:
- `apps/web/src/styles/styles.css` is very large and contains old base rules plus Step 12/14/15/17/20 overlays.
- `travel.css`, `work.css`, and `notes.css` contain multiple historical passes and final override blocks.
- Some stale selectors remain, e.g. travel references to old panel names while live markup uses `travel-central`, `travel-main-trip`, and `travel-main-grid`.

Issue:
The UI may look acceptable because late rules win, but future changes are fragile. Designers/developers will not know which layer is authoritative.

Exact fix:
- Step 22 should add one final harmonization block only.
- Step 25 should then consolidate and remove stale selectors and duplicate early rules.
- Prefer one canonical grouped selector for common surfaces rather than repeating gradients/radii in every module.

### 4. Controls are normalized late, but older button/input definitions still compete

Where:
- Early button/input definitions around the global `.btn`, `.icon-btn`, `.input`, `.select`, `.textarea`.
- Later normalized UI-control contract around `--ui-control-*`.
- Module-specific overrides in Work, Travel, Office, Diet, Sport, Finance and Auth.

Issue:
The final controls mostly align, but there are several competing definitions for padding, min-height, hover, focus, border and active state. This is especially visible in subtabs, filters, archive buttons, table actions and auth/OAuth buttons.

Exact fix:
- Treat `--ui-control-h`, `--ui-control-h-sm`, `--ui-control-radius`, `--ui-control-bg`, `--ui-control-bg-active`, and `--ui-control-focus` as authoritative.
- Harmonize segmented controls and filter chips with one grouped selector.
- Replace ad hoc `+` text actions with icon+label buttons where the app already has icons.

### 5. Status and badge language is close but not unified

Where:
- Global `.badge` and `.status-*`.
- Module-specific classes: Work priority/status, Travel status/document tones, Finance badges/tones, Office deadline/document states, Goals progress states.

Issue:
Semantic colors are mostly tokenized, but size, casing, border use and tone naming vary. Some module statuses use mono uppercase pills, others use plain labels or custom tinting.

Exact fix:
- Define one status-pill contract: height, radius, border, font, casing, and semantic variants.
- Keep module-specific labels, but map them to shared variants: neutral, info, success, warning, danger, blocked/overdue.
- In Step 22, group status classes under common visual rules without changing data or labels.

## Medium Priority Findings

### 6. Full-height page behavior needs one final contract

Where:
- Global: `html, body, #root { overflow: hidden; }`, `.module-page`, `.page-body`.
- Per tab: Planner, Finance, Goals, Office, Notes, Work, Travel, Sport use their own `overflow: hidden/auto`, `height: 100%`, `min-height: 0`, and mobile overrides.

Issue:
The direction is correct: desktop app surfaces should use fixed shell with internal scroll; mobile should allow page scroll. But each module encodes that contract differently, which can cause inconsistent scrollbars, clipped content, or double-scroll at breakpoints.

Exact fix:
- Standardize desktop: `.module-page` and `.page-body` own the outer height; one direct child owns module padding; inner lists/tables own scrolling.
- Standardize mobile/tablet: at a shared breakpoint, outer page becomes `overflow: auto`, module shell becomes `height: auto`, and internal fixed heights relax.
- Reuse this pattern in Work, Travel, Notes, Office, Goals, Finance, Diet and Sport.

### 7. Empty, loading and error states are inconsistent

Where:
- Common `EmptyState` exists in `components/common`.
- Shared layout also has `lay-empty`.
- Some modules use raw small empty boxes or inline skeletons.
- Route fallback uses inline styles.

Issue:
Empty states are mostly present, but there are two empty-state systems and inconsistent icon/title/description/action rhythm. Loading and error states are less consistently represented than empty states.

Exact fix:
- Use one EmptyState visual contract across `.empty-state` and `.lay-empty`.
- Standardize empty placement inside cards, tables and side rails.
- Add a shared loading skeleton class for route fallback and list/table loading states.
- Add a shared error banner class for module fetch/mutation errors.

### 8. Tables and dense lists still vary by module

Where:
- Finance table families.
- Work task table.
- Office documents table.
- Sport sets table.
- Diet meal/category tables.

Issue:
Tables now generally fit, but header sizing, row density, mobile card conversion, sticky headers and horizontal scroll patterns differ.

Exact fix:
- Define `.data-table`, `.data-table-head`, `.data-table-row`, and `.data-table-scroll` as the shared visual base.
- Let module-specific tables only define columns.
- Use the Office documents mobile-card pattern as the template for small screens.

### 9. Typography hierarchy still has local exceptions

Where:
- Page headers and shared card titles are consistent.
- Local panel titles, chips and helper text still vary in font size, mono usage and letter spacing.

Issue:
Some panel titles are uppercase mono labels, others are display headings, others are small bold text. The product feels close to unified, but the hierarchy can shift tab to tab.

Exact fix:
- Standardize panel titles to one of three levels: page title, card title, label/eyebrow.
- Keep mono uppercase for metadata only: table headers, small status labels, and true technical labels.
- Avoid negative letter-spacing inside compact controls.

### 10. Visual effects are repeated and slightly over-specific

Where:
- Many modules repeat radial/linear gradient cards and custom shadows.
- Notes, Work, Travel, Finance and Office each define similar card glow language independently.

Issue:
The effect language is coherent, but repeated implementation can drift. Some panels are calmer, others more “lit”.

Exact fix:
- Create a shared surface group for premium cards:
  `background`, `border-color`, `box-shadow`, `border-radius`.
- Reserve stronger gradients for selected/active/alert states only.

## Lower Priority Findings

### 11. Icons and action labels are not fully consistent

Where:
- Travel uses generic `Dodaj` in a contextual tab action.
- Some buttons still use literal `+`.
- Some rows have chevrons as text characters rather than icon components.

Exact fix:
- Prefer icon+specific label for main actions: `Dodaj dokument`, `Dodaj zadanie`, `Nowy projekt`.
- Use icon buttons for icon-only actions with `aria-label`.
- Replace text chevrons with existing icon components during cleanup.

### 12. Responsive breakpoints are functional but not named consistently

Where:
- Different files use `1500`, `1400`, `1320`, `1280`, `1240`, `1180`, `1120`, `1100`, `1060`, `900`, `860`, `760`, `720`, `680`, `640`, `560`, `520`, `480`, `460`.

Issue:
The app has responsive coverage, but breakpoint sprawl makes whole-app behavior hard to reason about.

Exact fix:
- In Step 22, do not rewrite all breakpoints.
- In Step 25, consolidate around a smaller set: large desktop, laptop/tablet, mobile, narrow mobile.

## Recommended Step 22 Order

1. Add one final grouped CSS harmonization block for cards, controls, status pills, empty states and mobile scroll behavior.
2. Normalize auth surfaces to consume the same global tokens.
3. Harmonize segmented controls: Planner task windows, Finance segment tabs, Work view tabs, Travel tabs, Diet tabs, Notes view toggles.
4. Harmonize status/badge classes across Work, Travel, Finance, Office, Goals and shared badges.
5. Normalize table/list row density and mobile table behavior.
6. Leave component refactors and CSS deletion for Step 25, after the final look is locked.

## Notes For Verification

- The app is currently protected by auth; the live browser check reached `/login`.
- Main protected modules were audited through source and CSS structure.
- The local dev server was running on port `5176` during this audit.

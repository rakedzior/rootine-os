# Rootine OS Design-System Extraction Map

This document extracts the reusable UI patterns that already exist in the current implementation. It is descriptive and preparatory only: no redesign, functionality change, or visual migration is implied here.

## Source Scan

Primary app surface:

- `apps/web/src/app/router.tsx`: active routes for Planner, Sport, Diet, Finance, Goals, Office, Travel, Notes, Work, and Settings.
- `apps/web/src/components/common/index.tsx`: shared UI primitives and helpers.
- `apps/web/src/components/layout/primitives.tsx`: page and module layout primitives.
- `apps/web/src/components/layout/AppShell.tsx`: desktop sidebar shell and mobile bottom navigation shell.
- `apps/web/src/styles/rootine-theme.css`: broad theme aliases, global component styling, and several late-stage overrides.
- `apps/web/src/styles/rootine-system.css`: imported last; current governed system layer with tokens and shared contracts.
- Module CSS files: `travel.css`, `work.css`, `desk.css`, `health.css`, `notes.css`, `nutrition.css`, `sport.css`, plus the large legacy `styles.css`.

Current shared component usage is already strong: `Field` is used about 266 times, `Modal` about 91 times, `EmptyState` about 33 times, `PageLayout` about 28 times, `PageHeader` about 21 times, `StatusBadge` about 19 times, `ModuleCard` and `MoreMenu` about 15 times each.

## 1. Shared Page Shell Patterns

Existing shared shell:

- `AppShell` provides the persistent app frame.
- Desktop uses a fixed sidebar and a content region.
- Mobile uses a bottom navigation with first-class modules plus a More sheet.
- Most pages render through `PageLayout`, with a `PageHeader` passed into the `header` prop.
- Most module bodies use either direct custom grids or `PageContainer` / `ModuleCard`.

Reusable target:

- `AppShell`: global navigation frame.
- `PageLayout`: required default page wrapper for all feature pages.
- `PageHeader`: required page title/action/header control area.
- `PageBody` or `PageContainer`: standard constrained page content region.
- `ModuleGrid`: shared responsive grid for multi-panel dashboards.

Current exceptions:

- `SettingsScreen` renders `main.module-page.settings-os` directly instead of using `PageLayout`, so it visually and structurally sits outside the main shell pattern.
- Planner, Diet, Sport, Finance, and Travel each have custom body grid names and sizing rules even when the layout role is similar.

## 2. Shared Navigation And Sub-Navigation Patterns

Existing navigation patterns:

- Primary navigation lives in `navConfig.ts` and is rendered by desktop sidebar plus mobile bottom nav.
- Mobile navigation uses fixed bottom tabs and a More sheet.
- In-page navigation appears as several related patterns:
  - `AppTabs`
  - `SubTabs`
  - `FilterChips`
  - `ViewSegmentedControl`
  - Custom tab classes: `finance-segment-tabs`, `work-view-tabs`, `travel-tabs`, `notes-view-toggle`, `diet-analytics-tabs`
  - Custom category/list selectors: `notes-category`, `office-category-row`, `goals-folder-row`, `travel-trip-item`, `work-project-card`

Reusable target:

- `PrimaryNav`: sidebar and mobile bottom nav from one item model.
- `TopTabs`: page-level section navigation, backed by `AppTabs`.
- `SubTabs`: local panel-level tabs.
- `SegmentedControl`: view mode switching, backed by `ViewSegmentedControl`.
- `FilterChips`: compact filter bar for task/status/category filtering.
- `SelectableListRow`: unified row/card selection primitive for sidebar lists.

Extraction note:

- The CSS already recognizes that `finance-segment-tabs`, `work-view-tabs`, `travel-tabs`, `notes-view-toggle`, `.sub-tabs`, and `.subtabs` are the same family. These should become one shared tab/segmented token set instead of parallel page-specific selectors.

## 3. Shared Card, Panel And Module Structures

Existing repeated structures:

- General cards: `.card`, `.lay-card`, `.module-card`, `.kpi-card`.
- Feature cards: `.finance-card`, `.finance-summary-tile`, `.office-mini-panel`, `.travel-card`, `.notes-card`, `.work-panel`, `.diet-meal-card`, `.sport-panel`, `.planner-calendar-card`, `.goals-roadmap-card`.
- Repeated card internals:
  - header row with title and actions
  - compact eyebrow/kicker label
  - metric value and supporting label
  - body list or empty state
  - footer/action row

Existing shared components:

- `ModuleCard`
- `ModuleHeader`
- `ModuleActions`
- `ScrollableModuleContent`
- `KpiCard`
- `DetailPanel`
- `EmptyState`

Reusable target:

- `Panel`: standard elevated surface.
- `PanelHeader`: title, subtitle, icon, actions.
- `MetricTile`: finance summary, office metric, travel KPI, notes KPI, generic KPI.
- `SelectableCard`: selected/active/hover surface for rails and lists.
- `ModuleCard`: keep as implementation primitive, but align it with `Panel`.
- `DetailPanel`: expand into a shared inspector/detail sidebar pattern.

Extraction note:

- `rootine-system.css` currently groups many tab-specific selectors into one surface contract. That is a strong signal that these should become a smaller component API rather than an ever-growing selector list.

## 4. Shared Button Variants

Existing shared button classes:

- `.btn-primary`
- `.btn-secondary`
- `.btn-ghost`
- `.btn-danger`
- `.icon-btn`
- `.sb-iconbtn`

Repeated usage counts in source are high: `icon-btn` appears about 138 times, `btn-primary` about 132 times, `btn-secondary` about 112 times, `btn-ghost` about 65 times, and `btn-danger` about 20 times.

Reusable target:

- `Button` with variants: `primary`, `secondary`, `ghost`, `danger`.
- `Button` sizes: `sm`, `md`, possibly `compact`.
- `IconButton` with variants: default, active, danger.
- `MenuButton` or `MoreMenu` trigger variant.
- `FloatingActionButton` for Planner mobile and any future mobile primary action.

Current conflicts:

- Button rules exist in `styles.css`, `rootine-theme.css`, `rootine-system.css`, and older legacy module styles.
- Some buttons use `.btn.btn-primary`, some use `.btn-primary`, and some pages add local action classes over the same visual role.
- Sport has multiple local icon button size overrides.

## 5. Shared Input And Form Field Styles

Existing shared form primitives:

- `Field`
- `.input`
- `.select`
- `.textarea`
- modal footer actions
- form row/grid classes inside several modules

Repeated usage is extensive: `input` appears about 490 times, `select` about 217 times, `textarea` about 117 times, and `field` about 141 times in CSS/TSX text matches.

Reusable target:

- `Field`: label, required marker, helper/error slot.
- `TextInput`, `Select`, `Textarea`: optional thin wrappers over native controls.
- `FormGrid`: one-column/two-column responsive field layout.
- `FormActions`: consistent modal/drawer action row.
- `InlineCreateField`: repeated inline add/create pattern used in Sport and category managers.

Current conflicts:

- Some module forms use raw native controls with shared classes, which is good.
- Layout around forms is not standardized: Sport has `.sport-form`, `.sport-form-row`, `.sport-form-actions`; Goals has custom goal form actions; Finance/Travel/Work mostly use modal body field stacks.

## 6. Shared Typography Styles

Existing type sources:

- App fonts are CSS-variable driven, with aliases such as `--font-sans`, `--font-display`, `--font-mono`.
- `rootine-system.css` defines:
  - `--rt-type-title: 30px`
  - `--rt-type-title-mobile: 28px`
  - `--rt-type-section: 18px`
  - `--rt-type-body: 14px`
  - `--rt-type-label: 11px`
- Headline rules target `.page-head-text h1`, `.page-header h1`, `.module-title`, `.page-title`.
- Label rules target `.text-label`, `.field label`, `.form-label`, `.kicker`, `.lay-eyebrow`, `.card-title`, `.section-head h3`, `.goals-section-title`.

Reusable target:

- `type.pageTitle`: 30px desktop, 28px mobile, 1.08 line height, strong weight.
- `type.sectionTitle`: 18px.
- `type.body`: 14px, 1.45 line height.
- `type.label`: 11px uppercase/mono-style label treatment.
- `type.metric`: large numeric values used in KPI tiles.
- `type.caption`: muted metadata in cards and rows.

Current conflicts:

- Several files still use older variables such as `--fs-h2`, `--fs-label`, `--ink`, `--ink-2`, and local font sizing.
- Some card titles are display-font headings, while others are mono uppercase labels for the same semantic role.

## 7. Shared Spacing Values

Current reusable spacing tokens:

- `--rt-space-1: 4px`
- `--rt-space-2: 8px`
- `--rt-space-3: 12px`
- `--rt-space-4: 16px`
- `--rt-space-5: 20px`
- `--rt-space-6: 24px`
- `--rt-space-7: 32px`
- `--rt-space-8: 40px`
- `--rt-layout-gap: var(--rt-space-5)`
- `--rt-layout-edge-x: clamp(22px, 2vw, 36px)`
- `--rt-layout-edge-y: clamp(14px, 1.4vw, 20px)`
- `--rt-mobile-edge: 18px`
- `--rt-mobile-nav-h: calc(72px + env(safe-area-inset-bottom))`

Reusable target:

- Keep the 4px-based scale.
- Promote layout edge and layout gap as page-level tokens.
- Add semantic aliases: `space.panelPadding`, `space.cardGap`, `space.controlGap`, `space.stack`, `space.pageX`, `space.pageY`.

Current conflicts:

- Module CSS still contains many one-off paddings: 14, 18, 22, 26, 28, 36, 48, and local clamp values.
- Planner, Sport, Travel, Notes, and Work each define their own responsive gutters and grid gaps.

## 8. Shared Color Values

Current theme colors:

- Main shell: graphite/blue-black background and surfaces.
- Primary accent: ice/cyan (`#7dd3fc`, `#8bdcff`, and related rgba mixes).
- Success: green (`#86efac` in main token layer).
- Warning: amber/yellow (`#fcd34d`).
- Danger: red (`#f87171`).
- Text: primary, secondary, muted aliases through `--text-*`, `--ink-*`, and `--rt-text-*`.
- Borders: faint, soft, default, strong, ice/accent.

Reusable target:

- `color.bg.page`
- `color.bg.shell`
- `color.surface.panel`
- `color.surface.card`
- `color.surface.field`
- `color.border.default`
- `color.border.strong`
- `color.border.active`
- `color.text.primary`
- `color.text.secondary`
- `color.text.muted`
- `color.accent.primary`
- `color.status.success/warning/danger`
- `color.status.*.bg`

Current conflicts:

- `rootine-theme.css` defines multiple generations of `--rt-*` tokens, including later overrides with different radius, accent, surface, and status values.
- `styles.css` still carries early root tokens and later duplicated patch blocks.
- Some module-specific colors are still hard-coded, especially macro colors, travel/warning rows, and sport state details.

## 9. Shared Radius, Shadow, Blur And Glass Effects

Current radius tokens:

- Theme layer: `--rt-radius-xs: 8px`, `--rt-radius-sm: 10px`, `--rt-radius-md: 13px`, `--rt-radius-lg: 16px`, `--rt-radius-xl: 22px`, `--rt-radius-2xl: 28px`, `--rt-radius-pill: 999px`.
- System layer: `--rt-radius-panel: 18px`, `--rt-radius-card: 16px`, `--rt-radius-control: 11px`.

Current shadow tokens:

- `--rt-shadow-soft`
- `--rt-shadow-card`
- `--rt-shadow-elevated`
- `--rt-shadow-modal`
- `--rt-shadow-ice`
- System-specific `--rt-shadow-panel-system`, `--rt-shadow-card-system`, `--rt-shadow-control-system`.

Current blur/glass:

- Modal overlays use backdrop blur.
- Surfaces use translucent rgba backgrounds.
- Sidebar, cards, drawers, and modals share a glass-like graphite surface language.

Reusable target:

- `radius.control`, `radius.card`, `radius.panel`, `radius.modal`, `radius.pill`.
- `shadow.card`, `shadow.panel`, `shadow.control`, `shadow.modal`, `shadow.active`.
- `effect.overlayBlur`.
- `effect.glassSurface`.

Current conflicts:

- Radius names differ between theme and system layers.
- `rootine-system.css` overrides many surfaces to 18px, while theme aliases still point cards to 22px.

## 10. Shared Interaction States

Existing shared states:

- Hover for interactive cards: subdued background shift, stronger border.
- Selected/active for cards/list rows: accent border and inset highlight.
- Button hover: primary changes to brighter cyan; secondary/ghost use field surface and stronger border.
- Focus-visible is defined broadly for buttons and modal controls in `styles.css`.
- Disabled buttons are dimmed and remove transform/shadow.
- Status states use success/warning/danger aliases.

Reusable target:

- `state.hover.surface`
- `state.selected.surface`
- `state.focus.ring`
- `state.disabled.opacity`
- `state.active.border`
- `state.danger.bg/border/text`

Current conflicts:

- Selected classes are inconsistent: `.is-active`, `.active`, `.is-selected`, `.card-selected`, `data-state="checked"`.
- Hover transforms are suppressed in the governed system layer, but older CSS still defines translate-on-hover rules.
- Checkbox/check controls are grouped globally but remain page-specific in class names: `.finance-check`, `.goals-task-check`, `.work-check`, `.office-case-check`, `.travel-pack-check`, `.sport-set-check`, `.tsk-check`.

## 11. Repeated CSS Rules That Should Become Tokens

High-value token candidates:

- Card/panel surface background, border, radius, shadow.
- Field surface background and border.
- Active/selected border color and inset highlight.
- Page edge padding and mobile bottom-nav safe area.
- Button min-heights: primary 44px, secondary/ghost 42px, icon 42px.
- Modal overlay blur and darkness.
- Empty-state padding and icon treatment.
- KPI/metric typography.
- Row hover background and active state.
- Breakpoints: 1180/1200, 760/720, 520/430, plus Sport-specific 1420/820.

High-risk duplicated files:

- `styles.css`: 9425 lines, 526 `!important` occurrences.
- `rootine-theme.css`: 4543 lines, 1162 `!important` occurrences.
- `rootine-system.css`: 3004 lines, 1472 `!important` occurrences.
- `rootine_v4_final_patch.css`: legacy patch file still present with 1198 lines and 299 `!important` occurrences.

Extraction note:

- The high `!important` count shows that the current design system is operating as an override layer instead of a stable source of truth. Future consolidation should make tokens and shared classes load once, then remove patch-style selectors gradually.

## 12. Repeated Components That Should Be Consolidated

Priority reusable components:

| Component | Current examples | Shared target |
| --- | --- | --- |
| Page shell | Most module screens use `PageLayout`; Settings does not | Require `PageLayout` + `PageHeader` for all feature pages |
| Top tabs | Finance, Travel, Work, Notes, Diet analytics | `Tabs` / `SegmentedControl` with shared variants |
| Selectable rail row | Notes categories, Office categories, Goals folders, Travel trips, Work projects | `SelectableListRow` / `SelectableCard` |
| Metric tile | Finance summary, Office metric, Travel KPI, Notes KPI, `KpiCard` | `MetricTile` |
| Panel card | `.card`, `.lay-card`, `.module-card`, feature cards | `Panel` with variants |
| Form stack/grid | Finance, Travel, Work, Sport, Goals modals | `FormGrid`, `FormActions`, enhanced `Field` |
| Drawer/modal surface | `Modal`, Diet drawer, Finance drawer, Sport modal variants | `OverlaySurface` with `modal`, `drawer`, `sheet` variants |
| More/actions menu | Shared `MoreMenu`, Goals local menu, task option popovers | Unified `ActionMenu` |
| Status badge | Shared `StatusBadge`, local Finance status badge | One badge component with status-to-tone mapping |
| Check control | Task, finance, office, travel, sport check classes | `CheckControl` / `CheckboxButton` |
| Empty state | Shared `EmptyState`, layout `EmptyState`, module variants | One `EmptyState` with compact/standard variants |

Do not extract too early:

- Planner calendar day cell internals.
- Sport week drag/drop board internals.
- Notes editor internals.
- Finance budget/account domain rows.
- Diet macro chart/analytics internals.

These have shared surface needs, but their domain behavior is specific enough that premature abstraction would make the system harder to work with.

## 13. Duplicated Tab-Specific Styling To Replace

Replace with shared surfaces and states:

- `.finance-summary-tile`, `.office-metric`, `.travel-kpi`, `.notes-kpi`, `.kpi-card` -> `MetricTile`.
- `.notes-category`, `.office-category-row`, `.goals-folder-row`, `.travel-trip-item`, `.work-project-card` -> `SelectableListRow` / `SelectableCard`.
- `.finance-segment-tabs`, `.work-view-tabs`, `.travel-tabs`, `.notes-view-toggle`, `.diet-analytics-tabs`, `.sub-tabs`, `.subtabs` -> shared `Tabs` or `SegmentedControl`.
- `.diet-drawer`, `.finance-drawer`, Sport modal overrides, Goals modal overrides -> `OverlaySurface`.
- `.sport-form`, `.goals-goal-form`, modal-specific form rows -> `FormGrid` / `FormActions`.
- Local icon button sizing in Sport, Planner, Goals, Finance -> `IconButton` size variants.
- Module-specific empty states inside Planner/Sport/Notes -> shared `EmptyState` variants.

## Design-System Extraction Priorities

1. Establish token authority.
   Keep `rootine-system.css` as the current system contract for now, but document which tokens are canonical. Then phase duplicated `--rt-*` definitions in `styles.css` and late `rootine-theme.css` blocks into aliases or remove them after verification.

2. Normalize shell usage.
   Move every feature page, especially Settings, onto `PageLayout` + `PageHeader` before polishing individual screens.

3. Consolidate cards and panels.
   Create a single `Panel` contract that covers `.card`, `.lay-card`, `.module-card`, and feature panel classes.

4. Consolidate selectable rows/cards.
   The active/hover rules already prove this pattern exists across five modules. Extract it before tuning individual sidebars.

5. Consolidate tabs and segmented controls.
   Use one shared tab/segment implementation and map page-specific class names to variants only when necessary.

6. Consolidate forms and overlays.
   `Field` and `Modal` are heavily reused; enrich them carefully instead of adding new tab-specific wrappers.

7. Split Sport-specific layout from shared system rules.
   Sport has the densest custom CSS and several screenshot-driven override blocks. Keep its domain layout specific, but replace generic button, card, modal, and form styling with shared tokens.

## Current Reusable Foundation

The app already has enough shared UI to support a design system without a visual reset:

- Shared React primitives exist and are widely used.
- A token scale exists for spacing, radius, type, color, shadows, and layout edges.
- Shared button, modal, field, empty-state, tabs, progress, and badge patterns exist.
- Cross-module selectors already group the same visual roles together.

The main risk is not absence of patterns. The risk is pattern drift: several CSS layers define the same roles, and tab-specific styles keep re-solving shared surface, spacing, state, and control problems. The next design-system step should be consolidation, not reinvention.

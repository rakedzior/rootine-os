---
name: Rootine OS
description: Current-state audit of a graphite personal life operating system.
colors:
  graphite-bg: "#0d1117"
  graphite-deep: "#080d13"
  graphite-soft: "#101721"
  shell-top: "#262d36"
  shell-mid: "#202831"
  shell-bottom: "#1a222b"
  surface-base: "#141d29"
  surface-raised: "#182232"
  surface-elevated: "#1b2838"
  field-top: "#151d25"
  field-bottom: "#111821"
  text-strong: "#f1f5f9"
  text-primary: "#e6edf5"
  text-secondary: "#a7b4c2"
  text-muted: "#7c8a9a"
  text-label: "#8493a5"
  ice: "#7dd3fc"
  ice-soft: "#a7e5ff"
  ice-strong: "#38bdf8"
  teal: "#5eead4"
  violet: "#a78bfa"
  hot: "#f472b6"
  success: "#86efac"
  warning: "#fcd34d"
  danger: "#f87171"
typography:
  display:
    fontFamily: "Sora, Inter, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 760
    lineHeight: 1.08
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "0"
  title:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0"
  body:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  xs: "8px"
  sm: "10px"
  control: "11px"
  md: "13px"
  card: "16px"
  panel: "18px"
  xl: "22px"
  modal: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  panel: "24px"
  section: "32px"
  wide: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.graphite-deep}"
    rounded: "{rounded.control}"
    padding: "0 26px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.field-bottom}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "42px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "20px"
  input-field:
    backgroundColor: "{colors.field-bottom}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "52px"
  chip-active:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.sm}"
    height: "30px"
---

# Design System: Rootine OS

> Prescriptive global system: see `DESIGN-SYSTEM.md`. This file remains the current-state audit captured before visual unification work.

## 1. Overview

**Creative North Star: "Private Command Graphite, Currently Mid-Migration"**

This document describes the UI as it exists now, before any redesign. Rootine OS is implemented as a Vite/React personal life-tracking app in `apps/web`, with legacy static HTML/CSS files still present at the repository root. The active app has a fixed app shell, a left desktop sidebar, a mobile bottom navigation bar, authenticated routes, and module pages for Planner, Sport, Diet, Finance, Goals, Office, Travel, Work, Notes, and Settings.

The current visual direction is graphite-first with ice-blue operational state, but the implementation is not yet a single governed design system. `styles.css` still contains older beige/green/dark theme tokens and large historical module rules; `rootine-theme.css` and `rootine-system.css` are imported after module CSS to force the graphite look through shared overrides. This creates the visible result the product wants, but the source of truth is split across globals, module stylesheets, shared component CSS, and many `!important` repair blocks.

**Current Page Structure:**
- **App shell:** `AppShell` renders a fixed desktop sidebar, a sidebar spacer, `main.app-main`, route outlet, and `MobileBottomNav`.
- **Shared module shell:** most active modules use `PageLayout`, which outputs `.module-page`, `.page-head`, and `.page-body`.
- **Primary modules:** Planner (`/`), Sport, Diet, Finance, Goals, Office, Travel, Work, and Notes use the newer page header pattern but each owns a custom internal workspace.
- **Settings:** uses `.module-page.settings-os` directly with `.col`, `.card.session`, and `.nav`; it does not fully participate in the newer `PageLayout`/dashboard raster.
- **Auth:** login/register/reset screens use `auth.css`; they share graphite colors but have separate layout, button, input, and card rules.
- **Legacy root files:** root-level `Start.html`, `Goals.html`, `Finance.html`, `styles.css`, and module CSS are older static surfaces. They are not the active Vite shell, but they duplicate naming and visual concepts.

**Current Navigation Patterns:**
- **Desktop primary navigation:** collapsible/expandable left sidebar with module icons and labels from `navConfig.ts`; active state is ice-tinted.
- **Mobile primary navigation:** bottom nav shows the first four visible modules and a "More" sheet for all modules plus Settings.
- **Module subnavigation:** inconsistent. Finance and Travel use shared `AppTabs`; Planner uses `ViewSegmentedControl` plus a mobile-only mode bar; Diet uses `SubTabs` and bespoke analytics tabs; Work uses `ViewSegmentedControl` with disabled future views; Notes uses icon-only `ViewSegmentedControl` plus category rails; Goals, Office, and Settings use custom category/nav rows.
- **Date navigation:** `DateNavigator` appears in Planner, Finance, and Diet-related controls, but its size and placement are overridden per module.

**Key Characteristics:**
- Dense, operational, dark product UI with strong module-specific dashboards.
- Graphite/ice direction is clear in rendered output, less clear in CSS ownership.
- Shared primitives exist, but module-specific panels still define much of the experience.
- Responsive behavior is heavily override-driven rather than token-governed.

### Current Design Risks

The biggest risk is polishing individual tabs before settling the shared raster. The active system has several competing authorities: `styles.css` base tokens, `rootine-theme.css` visual contract, `rootine-system.css` governed layer, and module CSS files. This makes future polish fragile because a component can look correct on one tab only because a later override happens to win.

## 2. Colors

The current app is visually graphite with ice-blue accents, but the token history still includes beige, green, brown, violet, pink, amber, and multiple semantic alias layers.

### Primary
- **Ice Accent**: Used for primary actions, selected states, focus rings, current day/period, progress fills, active nav, and some icons. It appears as `--rt-ice`, `--accent-ice`, `--acc`, `--rt-accent-system`, and `--border-active`.
- **Ice Strong / Soft**: Used for gradients, hover states, progress, and primary button treatment.

### Secondary
- **Teal, Violet, Hot Pink**: Present as secondary accents for tones, notes categories, event colors, and legacy/module-specific states. Their usage is not always governed by state meaning.
- **Semantic Status Colors**: Success, warning, and danger are implemented as both token pairs and background alphas. They are used for badges, priorities, warnings, overdue states, finance statuses, office deadlines, and validation.

### Neutral
- **Page Backgrounds:** graphite gradients from deep app bg to page/shell surfaces.
- **Surfaces:** cards and panels use a mix of hex tokens, rgba surfaces, and gradients; the final governed card system sets `rgba(22, 33, 46, 0.82)` with a low-contrast steel border.
- **Fields:** dark inset gradients from `field-top` to `field-bottom`.
- **Text Ramp:** strong, primary, secondary, muted, label, disabled, and inverse text tokens exist and are widely reused.
- **Borders:** mostly semi-transparent blue-gray strokes; active borders shift toward ice.

### Current Color Conflicts
- `styles.css` starts with mature beige/base theme tokens, then dark `[data-theme="dark"]`, then later Rootine graphite aliases.
- `auth.css` defines its own dark token set instead of relying fully on the shared root tokens.
- `rootine-theme.css` and `rootine-system.css` redefine many of the same semantic aliases.
- Finance exposes raw budget colors (`#3B82F6`, `#F59E0B`, etc.) that do not fully belong to the graphite/ice palette.
- Notes defines its own dark note color array and category tone names.
- Travel includes remote lodging images and warning/status colors that feel more content-rich than the rest of the app.

### Named Rules
**The Ice Is State Rule.** Ice-blue currently means primary action, selected item, focus, progress, and current period. It should not become decorative glow.

**The Semantic Color Rule.** Green, yellow, and red should remain success/warning/danger. Violet, pink, teal, and hot pink need explicit module roles or should be reduced.

**The Token Authority Rule.** Any future polish must choose one token authority before changing colors. Editing a module stylesheet alone will likely fight the final system layer.

## 3. Typography

**Display Font:** Sora with Inter/system fallback  
**Body Font:** Inter / Plus Jakarta Sans with system fallback  
**Label/Mono Font:** IBM Plex Mono with UI monospace fallback

**Character:** Typography is compact product UI typography. The best current screens use strong 30px module titles, 18px section headings, dense 14px body text, and small uppercase mono labels. The weakest typography appears where older module rules, inline styles, or modal-specific overrides set their own sizes.

### Hierarchy
- **Display** (760, 30px, 1.08): Module page titles through `.page-head-text h1`, `.page-header h1`, `.module-title`, and `.page-title`; mobile override is 28px.
- **Modal Title** (800, 30px, 1.1): Shared modal/drawer headers; this is larger and heavier than module section headings.
- **Section Headline** (750, 18px, 1.25): Section heads, card heads, goals section titles.
- **Panel/Card Title** (700-780, 14-24px): Inconsistent. Planner, Sport, and Goals contain module overrides that push individual panel titles to 21-24px.
- **Body** (500-600, 13-16px, 1.45-1.5): Normal content, rows, form fields, notes, task descriptions.
- **Label** (700-750, 10-11px, 0.08-0.12em): Metadata, field labels, kickers, category labels, weekdays, counters.
- **Inline/Local Styles:** several components still use inline `fontSize`, `fontWeight`, and `letterSpacing`, especially Planner modals/popovers and shared helper components.

### Current Typography Conflicts
- `rootine-system.css` standardizes module titles to 30px and labels to 0.08em, but `styles.css` and module-specific blocks still redefine heading sizes.
- Product labels sometimes use Sora/display styling through inherited card-title rules.
- Labels are often uppercase and tracked, but not consistently; some status badges and sport labels force normal case.
- Some Polish text appears mojibake-encoded in source output, which is not a design style but does affect review readability and copy QA.

### Named Rules
**The Product Type Rule.** Typography should serve scanning. Display sizing belongs to page titles and major modal titles, not buttons, labels, dense table rows, or badges.

**The Inline Type Debt Rule.** Any repeated inline type value should become a token or shared class before the next visual polish pass.

## 4. Elevation

Rootine currently uses a hybrid of tonal layering, shadows, gradients, inset highlights, borders, and modal backdrop blur. The desired rendered effect is restrained graphite depth, but several source layers still include heavier card shadows and gradient panels.

### Shadow Vocabulary
- **System Card Shadow** (`0 6px 16px rgba(0, 0, 0, 0.14)`): Current governed card default in `rootine-system.css`.
- **System Panel Shadow** (`0 10px 26px rgba(0, 0, 0, 0.18)`): Larger panel token, currently defined but less consistently used.
- **Control Shadow** (`0 4px 10px rgba(0, 0, 0, 0.13)`): Current primary button/control shadow.
- **Elevated Shadow** (`0 24px 64px rgba(0, 0, 0, 0.42)`, plus supporting shadows): Menus, sheets, and elevated surfaces in `rootine-theme.css`.
- **Modal Shadow** (`0 34px 90px rgba(0, 0, 0, 0.56)`, plus supporting shadows): Dialogs and drawers.
- **Historical Shadows:** `styles.css` contains older `--sh-1`, `--sh-2`, `--sh-3`, and many per-module shadow overrides. Some still win in Sport and Planner blocks.

### Current Elevation Conflicts
- Cards can be flat, softly shadowed, gradient-backed, or shadow-plus-border depending on module and import order.
- `rootine-system.css` tries to flatten hover transforms, while older rules still define translate-on-hover in some paths.
- Modal corners are 28px while normal panels are 18px and some sport panels are forced to 14px.
- Glass-like modal overlays and blur are present; they are functional for focus but should not expand into general card styling.

### Named Rules
**The Tonal Depth Rule.** Use surface level and border strength first. Shadow should confirm hierarchy, not decorate every panel.

**The Modal Exception Rule.** Heavy shadow and backdrop blur belong to modals, drawers, sheets, and popovers only.

## 5. Components

The app has useful shared primitives, but the visual source is split between React components, global CSS, and module CSS. The reusable layer should be treated as the foundation for a future design system extraction.

### Buttons
- **Shape:** Current governed controls use 11px radius; older controls range from 8px to 13px, with modal close buttons as pills.
- **Primary:** Ice background, graphite inverse text, 44px minimum height in the final layer; older `rootine-theme.css` uses a glossy ice gradient and 46px.
- **Secondary / Ghost:** Dark field background, soft border, muted/primary text, 42-46px height depending on which rule wins.
- **Icon Buttons:** Usually 42px square with 11-12px radius; Sport and Planner override to 30-48px in local contexts.
- **Risks:** Buttons mix raw `.btn`, `.btn-primary`, `.btn-sm`, custom buttons, inline labels, and icon-only actions without a single size scale.

### Inputs / Fields
- **Style:** Dark inset field surface, 13px radius, 52px default input height in the theme layer.
- **Module Overrides:** Planner and compact contexts force 42px. Diet settings and table-like controls use local sizes.
- **Focus:** Ice border and ring are consistent in intent but implemented through multiple token aliases.
- **Risks:** Generic selectors style all `input`, `select`, and `textarea`, so module-specific forms can inherit more than intended.

### Chips / Tabs / Segmented Controls
- **Shared Controls:** `FilterChips`, `AppTabs`, `ViewSegmentedControl`, `DateNavigator`, and `CountBadge` exist in `components/common`.
- **Shared Visual:** small rounded segmented containers, dark translucent background, 30-34px controls, ice border/fill for active state.
- **Custom Variants:** Diet analytics tabs, Travel rail filters, Notes category list, Goals folder rows, Office category rows, Settings `.nav`, and Planner mobile mode bar all implement related patterns separately.
- **Risk:** The app has at least four sub-navigation vocabularies: tabs, chips, category rows, and sidebar-like rails. They need a single pattern map.

### Cards / Containers
- **Default Card:** Governed layer applies 18px radius, subtle steel border, rgba graphite surface, and 6px/16px shadow.
- **Module Cards:** Planner calendar/tasks/habits, Sport panels, Goals command/roadmap/week/action panels, Finance summary tiles, Office mini panels, Travel cards, Work panels, and Notes cards are all close cousins but not one component.
- **Panel Padding:** common range is 18-24px; Planner desktop and Sport reference layouts force exact local values.
- **Risk:** Nested cards and cards-inside-panels appear in dashboards, especially where a module has a rail plus central workspace.

### Navigation
- **Desktop Sidebar:** Primary app navigation is icon-first, hover-expandable, with lock control and footer area.
- **Mobile Nav:** Bottom nav height is `calc(72px + env(safe-area-inset-bottom))`; first four modules show directly, rest go into a sheet.
- **Page Header:** Most modules use `PageHeader` with icon, title, description, and action cluster.
- **Settings Exception:** Settings uses `PageHeader` but not `PageLayout`; subnavigation is older `.nav` inside `.card.session`.

### Module Patterns
- **Planner:** left tasks/habits sidebar plus dominant calendar board; mobile splits into "today" and "calendar" mode with a fixed FAB.
- **Sport:** newest and most custom surface; left cockpit, dominant week board, history/goals cards, many local CSS blocks for screenshot/reference layout.
- **Diet:** meal-column plus right-side summary/hydration/rhythm rail; drawers and custom settings dialogs.
- **Finance:** summary tile strip plus single month panel with segment tabs and segment-specific KPI rail.
- **Goals:** left command panel plus main stage with collapsible roadmap, week plan, and action tree.
- **Office:** KPI strip, category sidebar, central cases panel, right mini panels.
- **Travel:** trip rail plus central tabbed workspace; most content-card heavy and uses imagery.
- **Work:** main task workspace plus side detail/deadline rail; table/list pattern with disabled future view controls.
- **Notes:** category rail plus board/editor mode; card/list view toggle and full-screen editor.
- **Settings:** older card/nav/settings panels; visually more detached from the module dashboard raster.

### Responsive Behavior
- **Desktop / wide:** sidebar is visible; modules use full-height dashboards, fixed/managed scroll areas, and multi-column grids.
- **Laptop / medium (`max-width: 1180px`):** most module grids collapse to one column and page bodies become scrollable.
- **Tablet / narrow (`max-width: 760px`):** sidebar is hidden, mobile bottom nav appears, page headers stack, action clusters wrap, page-body padding becomes 18px plus bottom-nav clearance.
- **Small mobile:** Planner receives special treatment with modebar and FAB; Sport switches to stacked layout and horizontal week columns; Finance actions become full-width; many other modules rely on generic one-column collapse.
- **Height constraints:** `max-height: 820px` and dashboard-height rules reduce gaps and force internal scrolling on dense modules.

### Duplicated / Conflicting Rules To Resolve
- Duplicate token families: `--rt-*`, `--surface-*`, `--bg-*`, `--ink-*`, `--acc-*`, `--tone-*`, and module-specific aliases.
- Multiple card contracts: `.card`, `.lay-card`, `.module-card`, `.surface-card`, module panels, and system-layer `:where(...)` selectors.
- Multiple nav contracts: sidebar nav, `.nav`, `.sub-tabs`, `AppTabs`, `ViewSegmentedControl`, category rows, filter chips.
- Multiple modal/drawer contracts: shared `Modal`, `FinanceDrawer`, Diet drawer, Diet settings dialog, sheets, popovers.
- Many repair blocks and `!important` overrides, especially in `styles.css` and `rootine-system.css`.
- Historical side-stripe pattern still appears as inset left borders or border-left repairs in several older rules; the governed system tries to reduce this to 1px.

### Reusable Patterns To Promote
- `PageLayout` + `PageHeader` as mandatory module shell.
- `AppTabs`, `FilterChips`, `ViewSegmentedControl`, `DateNavigator`, `CountBadge`, `StatusBadge`, `PriorityBadge`.
- Shared card/panel tokens for radius, padding, surface, border, shadow.
- Shared dashboard rails: left rail, right detail rail, central workspace.
- Shared drawer/modal contract across Finance, Diet, Sport, and common Modal.
- Shared responsive breakpoints and scroll/height contract for desktop dashboard versus mobile document flow.

## 6. Do's and Don'ts

### Do:
- **Do** document and preserve the current graphite/ice direction before changing visuals.
- **Do** treat `apps/web` as the active product surface and root-level HTML/CSS as legacy unless explicitly revived.
- **Do** make `PageLayout`, `PageHeader`, shared cards, shared controls, and `rootine-system.css` the future governance layer.
- **Do** standardize page-body padding, module header height, card radius, button height, input height, and subnavigation before polishing individual tabs.
- **Do** audit Planner, Sport, Diet, Finance, Goals, Office, Travel, Work, Notes, and Settings as one system, not isolated pages.
- **Do** keep density where it helps repeated daily scanning.
- **Do** preserve state-first color use: primary action, active selection, focus, current period, progress, success, warning, danger.
- **Do** keep Settings on the fix list; it visually feels the least integrated with the dashboard modules.

### Don't:
- **Don't** redesign yet; this document is an audit of the current UI state.
- **Don't** make Rootine look like a corporate dashboard, SaaS analytics page, or boardroom KPI wall.
- **Don't** make it feel like Notion, a blank block canvas, or a generic productivity template.
- **Don't** polish one tab by adding more local CSS overrides before the shared raster is stabilized.
- **Don't** add another subnavigation pattern; map new needs to tabs, segmented controls, filter chips, or category rails.
- **Don't** introduce more accent colors without naming their role and state meaning.
- **Don't** rely on `!important` as the normal implementation path for new UI.
- **Don't** let legacy beige/green/theme aliases define new design work unless they are deliberately kept as compatibility aliases only.

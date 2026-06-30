# Rootine OS Global Design System

This is the prescriptive design foundation for Rootine OS. It defines the visual and interaction rules every tab should follow before any individual tab receives polish.

It does not redesign any single page. It creates the shared system that future Planner, Sport, Diet, Finance, Goals, Notes, Office, Work, Travel, Documents, and Settings work should inherit.

## 1. Design Direction

**North star:** calm private command center.

Rootine OS should feel like a personal life cockpit: premium, structured, quiet, and precise. The mood is White Lotus calmness meeting Jarvis-like operational clarity: deep blue glass, disciplined modules, subtle green vitality, and no noisy decoration.

Physical scene:

> A focused person uses Rootine OS at a desktop or laptop in evening ambient light, calmly scanning the whole state of their life and making one clear next decision.

Design strategy:

- **Register:** product UI / dashboard.
- **Color strategy:** restrained dark system with selective committed accents.
- **Density:** desktop-first and information-rich, but not cramped.
- **Personality:** elegant, intelligent, controlled.
- **Primary impression:** "I can understand everything important without hunting."

Do not introduce decorative landing-page composition, oversized hero sections, floating ornamental cards, gradient text, playful rounded blobs, or page-specific visual themes.

## 2. Typography Scale

Rootine OS uses a tight product scale. Typography should make dashboards scannable, not theatrical.

Font families:

- **UI / body:** `Inter, Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif`
- **Display / page titles:** `Sora, Inter, system-ui, sans-serif`
- **Data / labels:** `IBM Plex Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

Type tokens:

| Token | Size | Weight | Line height | Letter spacing | Usage |
| --- | ---: | ---: | ---: | ---: | --- |
| `type.display` | 30px | 760 | 1.08 | -0.02em | Page titles only |
| `type.display.mobile` | 28px | 760 | 1.1 | -0.02em | Mobile page titles |
| `type.section` | 18px | 740 | 1.25 | 0 | Module/card headings |
| `type.title` | 15px | 700 | 1.3 | 0 | Row/card primary titles |
| `type.body` | 14px | 500 | 1.45 | 0 | Default interface text |
| `type.body.sm` | 13px | 500 | 1.4 | 0 | Secondary text and compact rows |
| `type.caption` | 12px | 560 | 1.35 | 0 | Metadata, helper text |
| `type.label` | 11px | 700 | 1.2 | 0.08em | Field labels, compact headers |
| `type.metric.lg` | 28px | 760 | 1.05 | -0.02em | Main KPI values |
| `type.metric.md` | 22px | 740 | 1.1 | -0.01em | Secondary KPI values |

Typography rules:

- Page titles appear once per page.
- Do not use display fonts for labels, table cells, buttons, or dense data.
- Use uppercase mono labels sparingly for structure, not as decoration on every element.
- Body copy should remain readable at 14px minimum.
- Long prose should cap around 65-75ch.
- Numeric dashboard values should align visually and use tabular numerals where possible.
- No viewport-scaled typography for app UI.

## 3. Color System

Rootine OS is a dark graphite-blue product system with glassy depth and a restrained green accent.

### Core Palette

| Token | Value | Role |
| --- | --- | --- |
| `color.bg.deep` | `#050b13` | Deepest app background |
| `color.bg.page` | `#081320` | Main page background |
| `color.bg.soft` | `#0d1a29` | Soft background wells |
| `color.shell.top` | `#1a3046` | Sidebar/top shell gradient high point |
| `color.shell.mid` | `#13273a` | Sidebar/top shell base |
| `color.shell.bottom` | `#0d1b2b` | Sidebar/top shell low point |
| `color.surface.base` | `#0f1d2c` | Main panel surface |
| `color.surface.raised` | `rgba(22, 43, 63, 0.90)` | Raised card surface |
| `color.surface.elevated` | `rgba(28, 53, 76, 0.92)` | Active/elevated surface |
| `color.surface.overlay` | `rgba(21, 39, 57, 0.96)` | Modal/sheet surface |
| `color.surface.glass` | `rgba(17, 34, 51, 0.78)` | Glass card surface |
| `color.field` | `rgba(7, 17, 28, 0.76)` | Inputs and controls |
| `color.border.soft` | `rgba(160, 184, 206, 0.12)` | Low emphasis border |
| `color.border.default` | `rgba(166, 195, 220, 0.17)` | Default border |
| `color.border.strong` | `rgba(177, 210, 236, 0.25)` | Hover/raised border |
| `color.border.active` | `rgba(126, 232, 183, 0.50)` | Selected/accent border |

### Text Palette

| Token | Value | Usage |
| --- | --- | --- |
| `color.text.strong` | `#f3f8fb` | Highest emphasis |
| `color.text.primary` | `#e8f0f6` | Main text |
| `color.text.secondary` | `#adbdca` | Descriptions and metadata |
| `color.text.muted` | `#8192a2` | Low emphasis metadata |
| `color.text.label` | `#8ca0b2` | Labels |
| `color.text.disabled` | `#607283` | Disabled text |
| `color.text.inverse` | `#06130e` | Text on bright accent |

### Accent Palette

Primary accent is green for action, focus, active state and progress. Sky-blue is reserved for informational support and cool atmospheric depth.

| Token | Value | Usage |
| --- | --- | --- |
| `color.accent.green` | `#7ee8b7` | Primary actions, selected state, focus |
| `color.accent.green.strong` | `#a7f3d0` | Hovered primary action |
| `color.accent.green.soft` | `rgba(126, 232, 183, 0.12)` | Soft selected background |
| `color.info.sky` | `#7dd3fc` | Informational state and atmosphere |
| `color.info.sky.soft` | `rgba(125, 211, 252, 0.12)` | Informational background |

### Semantic Palette

| Token | Value | Usage |
| --- | --- | --- |
| `color.success` | `#7ee8b7` | Complete, paid, healthy, achieved |
| `color.success.bg` | `rgba(126, 232, 183, 0.12)` | Success background |
| `color.warning` | `#f6d76b` | Due soon, attention |
| `color.warning.bg` | `rgba(246, 215, 107, 0.12)` | Warning background |
| `color.danger` | `#ff8f9a` | Error, destructive, blocked |
| `color.danger.bg` | `rgba(255, 143, 154, 0.12)` | Danger background |
| `color.info` | `#7dd3fc` | Informational |
| `color.info.bg` | `rgba(125, 211, 252, 0.10)` | Informational background |

Color rules:

- Use green for primary action, selection, focus, current state, and calm positive progress.
- Use sky-blue for informational states and subtle atmosphere, not as a second primary accent.
- Do not assign each tab a separate theme color.
- Module-specific colors are allowed only for semantic data categories, chart series, or status states.
- Inactive surfaces stay neutral. Accent color must not flood inactive cards.
- All body text must meet WCAG AA contrast.

## 4. Spacing System

Use an 4px-based spacing scale with semantic layout aliases.

| Token | Value | Usage |
| --- | ---: | --- |
| `space.1` | 4px | Hairline gaps, icon offsets |
| `space.2` | 8px | Tight inline gaps |
| `space.3` | 12px | Compact stack gaps |
| `space.4` | 16px | Standard component padding |
| `space.5` | 20px | Default module gap |
| `space.6` | 24px | Panel padding, page clusters |
| `space.7` | 32px | Section separation |
| `space.8` | 40px | Large page separation |

Layout spacing:

- `layout.page.x`: `clamp(20px, 1.65vw, 32px)`
- `layout.page.y`: `clamp(12px, 1.2vw, 18px)`
- `layout.gap`: `20px`
- `layout.section.gap`: `24px`
- `layout.card.gap`: `16px`
- `layout.card.padding`: `20px`
- `layout.card.padding.compact`: `16px`
- `layout.header.height`: `84px`
- `layout.mobile.x`: `16px`
- `layout.mobile.navHeight`: `calc(72px + env(safe-area-inset-bottom))`

Spacing rules:

- Page margins should feel balanced but efficient. Do not create wide decorative gutters.
- Panels usually use 20-24px padding on desktop, 16-18px on mobile.
- Dense rows use 10-14px vertical padding.
- Header-to-body rhythm should be consistent across tabs.
- Avoid nested cards; use internal dividers, rows, or grouped content instead.
- Use vertical scrolling only where the content truly exceeds the viewport. Prefer fixed dashboard regions with internal scroll areas for long lists.

## 5. Layout System

Rootine OS is desktop-first, with structural responsiveness.

### App Shell

Global shell rules:

- Desktop uses a fixed left navigation rail and a full-height content area.
- Mobile uses bottom navigation and a More sheet.
- The shell must remain visually calmer than content cards.
- Navigation should not compete with page modules.
- Current module, active subnav, and selected rows use one consistent selected state.

### Page Layout

Every page should use:

1. `PageLayout`
2. `PageHeader`
3. `page-body`
4. Shared grid/panel primitives

Page anatomy:

- Page header: title, concise description, global actions, optional date/view controls.
- Page body: full-width dashboard grid or focused work area with shared outer padding.
- Optional rail: category/project/trip/folder selector.
- Main panel: primary work surface.
- Optional inspector: details, metadata, actions.
- Page shell should fill the browser height on desktop and allow normal document flow on mobile.

### Dashboard Grid

Desktop grid patterns:

- **Two-column split:** `minmax(0, 1fr) 340px` for main + side context.
- **Three-column cockpit:** `280-340px rail / minmax(0, 1fr) main / 300-360px inspector`.
- **KPI strip:** 3-5 equal metric tiles above main content.
- **Responsive module grid:** `repeat(auto-fit, minmax(280px, 1fr))` for utility panels.

Layout rules:

- Use grid for page-level two-dimensional structure.
- Use flex for toolbars, rows, and action clusters.
- Avoid full-width panels that produce long unreadable lines.
- Avoid tiny cards spread across the window just to fill space.
- The browser window should feel used, but not packed.
- Main actions should remain visible without forcing unnecessary scroll.
- Prefer internal scroll areas for long lists inside fixed dashboard regions on desktop.
- Collapse rails and inspectors before compressing the primary workspace.

## 6. Component Rules

### Surfaces

Surface hierarchy:

| Component | Background | Border | Radius | Shadow |
| --- | --- | --- | ---: | --- |
| Page | Deep/page background | none | 0 | none |
| Shell | Shell gradient/surface | soft | 0-18px as needed | subtle |
| Panel/module | Deep glass card surface | default | 16px | subtle 6px/14px shadow |
| Card | Raised surface | soft/default | 14px | subtle 3px/8px shadow |
| Tile/row | Inset surface | soft | 12px | none |
| Field/control | Field surface | default | 11-13px | none |
| Modal/sheet | Overlay surface | strong | 22-28px | modal shadow |

Rules:

- Cards and panels should feel modular, not ornamental.
- Use one border plus restrained depth. Do not pair heavy shadow with heavy border.
- Major modules use the shared deep glass surface; small tiles and list rows use a quieter inset surface.
- Standard module padding is 18-22px on desktop, 18px on tablet, and 14px on mobile.
- Standard card/tile padding is 16px for cards and 12px for compact tiles.
- Card headers use a 12px gap, left-aligned title/meta grouping, and trailing actions aligned to the right.
- Card titles use the shared card-title typography; subtitles, metadata, timestamps, and footers use the shared meta typography.
- Card bodies use a 14px vertical gap on desktop and 12px on tablet/mobile.
- Card footers and action rows use a 12px gap, wrap when needed, and keep icon buttons aligned to the header/action edge.
- Hover state strengthens the surface and border without movement.
- Selected/active state uses selected surface plus active green border, preserving semantic meaning.
- Completed state uses success background/border; warning and error states use semantic warning/danger tokens.
- Empty states inside cards use a dashed soft border, quiet inset background, centered text, and optional action.
- Loading states use shared skeleton/shimmer treatment inside the same card radius.
- No colored side stripes wider than 1px.
- No nested cards. Use rows, separators, or section groups inside panels.

### Buttons

Variants:

- `primary`: one main action per region.
- `secondary`: standard contained action.
- `ghost`: low-emphasis action.
- `danger`: destructive action.
- `icon`: compact tool/action button.

Rules:

- Primary button height: 44px.
- Secondary/ghost height: 42px.
- Icon button target: 42px square minimum.
- Buttons use the same radius as controls.
- Buttons with icons use consistent 14-16px icons.
- Do not create page-specific button shapes.

### Inputs And Forms

Rules:

- All inputs use shared `Field` structure: label, control, helper/error when needed.
- Inputs are at least 42px high; major form inputs may be 48-52px.
- Field labels use `type.label`.
- Required markers, errors, and helper text must be visually consistent.
- Forms in modals/drawers use shared `FormGrid` and `FormActions`.
- Use native controls where possible; do not invent custom form behavior for style.

### Navigation And Subnavigation

Patterns:

- Primary navigation: app shell rail / top nav / mobile bottom nav, all using the same selected-state language.
- Page-level tabs: `AppTabs`.
- Panel-level tabs: `SubTabs`.
- View switcher: `ViewSegmentedControl`.
- Status/category filtering: filter chips.
- Rail/list selection: selectable row/card.

Rules:

- Primary nav containers use a 48px navigation rhythm; primary nav items are 40px high on pointer devices and at least 44px on touch devices.
- Primary nav item padding is horizontal 13px with an 18px icon slot, 4px item gap, 12px radius, and no active underline or side stripe.
- Mobile bottom navigation uses five equal columns, a safe-area-aware shell, 20px icons, and the same active/hover/focus colors as desktop navigation.
- Sub-navigation containers use a 42px rhythm with 4px internal padding and 4px item gaps.
- Subtab and segmented-control items are 34px high on desktop, 36px on mobile, horizontally padded 12px, and use a 10px radius.
- One selected-state language across nav, tabs, chips, and rows.
- Active state is soft green accent background plus active border and stronger text, never page-specific colors.
- Hover state is the shared hover surface and stronger text without movement.
- Focus state is always the shared green focus ring.
- Disabled state uses reduced opacity, no hover behavior, and `not-allowed` cursor where applicable.
- Tabs do not become cards.
- Chips are filters, not primary navigation.
- Page-level tabs should stay close to the content they change.
- Long Polish and English labels must truncate or scroll inside the nav/subnav region rather than widen the page.

### Data And Status

Rules:

- KPI cards use `MetricTile` structure: label, value, optional delta/context.
- Status badges use semantic tones only.
- Progress uses green for achieved/healthy states, sky-blue for informational neutral progress, warning/danger for risk.
- Tables and dense lists should prioritize alignment, row hover, and readable metadata over decorative cards.

### Overlays

Rules:

- Use modals for focused interruptive tasks.
- Use drawers/sheets for contextual editing or inspection.
- Do not use modal as the first answer when inline editing or a detail panel is better.
- Overlay title, body, footer, close button, focus trap, and escape behavior are required.

## 7. Interaction Rules

State model:

| State | Visual rule |
| --- | --- |
| Default | Neutral surface, readable text, quiet border |
| Hover | Slightly stronger border/background, no jumpy movement |
| Active/pressed | Subtle inset or darker surface |
| Selected | Accent border plus soft accent background |
| Focus | Visible green focus ring, never removed |
| Disabled | Reduced opacity, no hover transform, cursor reflects disabled |
| Loading | Skeletons or inline progress; avoid blank content |
| Error | Danger text/border/background with clear recovery |
| Success | Green confirmation, brief and calm |

Motion rules:

- Most transitions: 120-180ms.
- Larger overlays/sheets: 180-220ms.
- Use easing: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Motion communicates state: opening, closing, selecting, saving, loading.
- No decorative page-load choreography.
- Respect `prefers-reduced-motion`.

Feedback rules:

- Primary actions must show disabled/loading/success states when async.
- Destructive actions require confirmation unless undo is available.
- Empty states should teach the next action.
- Error states should explain what happened and how to recover.

## 8. Responsive Rules

Breakpoints:

| Breakpoint | Rule |
| --- | --- |
| `>= 1600px` | Spacious desktop: increase gutters, panel padding, and minimum module width without stretching content awkwardly |
| `1181-1599px` | Standard desktop: multi-column dashboards, visible sidebar, internal scroll regions where useful |
| `901-1180px` | Small laptop: collapse tertiary columns before squeezing primary content |
| `761-900px` | Tablet: one or two columns only, touch-safe controls, stacked rails when needed |
| `521-760px` | Mobile: single-column page body, bottom nav, horizontally scrollable subnav, normal page scroll |
| `381-520px` | Phone: one primary action row, full-width forms/actions, no horizontal page scroll |
| `<= 380px` | Very small phone: reduce spacing only; keep content and actions available |
| `height <= 760px` | Short browser: allow page scroll and reduce header height |

Desktop rules:

- Preserve dense dashboards without forcing page-level scroll for every panel.
- Side rails should be 280-340px unless content demands otherwise.
- Inspectors should be 300-360px.
- Header actions may wrap, but should remain visually grouped.

Laptop rules:

- Reduce outer page margins before reducing content clarity.
- Collapse secondary panels before compressing main content.
- Use internal scroll for long rail lists.

Tablet rules:

- Prefer stacked sections over squeezed three-column grids.
- Keep tabs and segmented controls horizontally scrollable only when labels genuinely overflow.
- Keep touch targets at least 42px.

Mobile rules:

- Bottom nav safe area is mandatory.
- Page title and primary action should remain visible near the top.
- Avoid sticky stacked headers that consume too much vertical space.
- Convert rail selectors to horizontal chips, sheets, or compact lists.
- Use one primary action, with secondary actions in menus when space is tight.
- No text or buttons may overflow their containers.
- Tables and wide grids use internal horizontal scroll wrappers, never page-level horizontal scroll.
- Touch inputs, buttons, icon buttons, tabs, and chips must keep at least 44px hit targets.
- Hover-only affordances must also have click/tap-visible state.

## 9. Token Names To Make Canonical

Future implementation should converge around these semantic tokens:

```css
:root {
  --rt-color-bg-page: #081320;
  --rt-color-bg-deep: #050b13;
  --rt-color-surface-panel: rgba(17, 34, 51, 0.78);
  --rt-color-surface-card: rgba(18, 35, 52, 0.88);
  --rt-color-surface-field: rgba(7, 17, 28, 0.76);
  --rt-color-border: rgba(166, 195, 220, 0.17);
  --rt-color-border-strong: rgba(177, 210, 236, 0.25);
  --rt-color-border-active: rgba(126, 232, 183, 0.50);
  --rt-color-text-primary: #e8f0f6;
  --rt-color-text-secondary: #adbdca;
  --rt-color-text-muted: #8192a2;
  --rt-color-accent: #7ee8b7;
  --rt-color-accent-strong: #a7f3d0;
  --rt-color-success: #7ee8b7;
  --rt-color-warning: #f6d76b;
  --rt-color-danger: #ff8f9a;

  --rt-space-1: 4px;
  --rt-space-2: 8px;
  --rt-space-3: 12px;
  --rt-space-4: 16px;
  --rt-space-5: 20px;
  --rt-space-6: 24px;
  --rt-space-7: 32px;
  --rt-space-8: 40px;

  --rt-radius-control: 11px;
  --rt-radius-card: 16px;
  --rt-radius-panel: 18px;
  --rt-radius-modal: 24px;
  --rt-radius-pill: 999px;

  --rt-shadow-card: 0 6px 16px rgba(0, 0, 0, 0.14);
  --rt-shadow-panel: 0 10px 26px rgba(0, 0, 0, 0.18);
  --rt-shadow-modal: 0 34px 90px rgba(0, 0, 0, 0.56);

  --rt-type-display: 30px;
  --rt-type-section: 18px;
  --rt-type-body: 14px;
  --rt-type-label: 11px;
}
```

Existing legacy aliases may remain during migration, but new styling should use semantic `--rt-color-*`, `--rt-space-*`, `--rt-radius-*`, `--rt-shadow-*`, and `--rt-type-*` names.

## 10. Future Polish Checklist

Before polishing any individual tab, check:

- Does the page use `PageLayout` and `PageHeader`?
- Are page margins and grid gaps using global layout tokens?
- Are panels using the shared panel/card contract?
- Are buttons using the shared variants?
- Are forms using shared field and action patterns?
- Are tabs/chips/segmented controls using the shared subnav language?
- Are selected, hover, focus, disabled, loading, error, and empty states defined?
- Does the page avoid tab-specific visual theming?
- Does the layout make efficient use of desktop width?
- Does it collapse cleanly below 1180px, 900px, 760px, and 520px?

If a page needs a new visual rule, first ask whether it is truly domain-specific or whether it belongs in this global system.

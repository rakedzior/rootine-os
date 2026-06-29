---
name: Rootine OS
description: A private graphite life operating system with ice-blue operational accents.
colors:
  graphite-bg: "#0d1117"
  graphite-deep: "#080d13"
  graphite-soft: "#101721"
  surface-base: "#141d29"
  surface-raised: "#182232"
  surface-elevated: "#1b2838"
  surface-overlay: "#202831"
  text-strong: "#f1f5f9"
  text-primary: "#e6edf5"
  text-secondary: "#a7b4c2"
  text-muted: "#7c8a9a"
  ice: "#7dd3fc"
  ice-strong: "#38bdf8"
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
  body:
    fontFamily: "Inter, Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.45
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, SF Mono, Menlo, monospace"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  xs: "8px"
  sm: "10px"
  md: "13px"
  lg: "16px"
  panel: "18px"
  xl: "22px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  panel: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.graphite-deep}"
    rounded: "{rounded.sm}"
    padding: "0 18px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.panel}"
    padding: "22px"
  chip-active:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.text-strong}"
    rounded: "{rounded.sm}"
    height: "30px"
---

# Design System: Rootine OS

## 1. Overview

**Creative North Star: "Private Command Graphite"**

Rootine OS is a premium personal command center, not a corporate dashboard and not a blank productivity canvas. Its visual system is graphite-first, restrained, dense, and exact: dark operational surfaces, soft tonal layering, and rare ice-blue accents used for current state, primary actions, and focus.

The system should feel like one coherent private operating room for life operations. Modules may have different content densities, but they must share the same raster: panel rhythm, control shape, typography, graphite surfaces, and ice selection language.

**Key Characteristics:**
- Dense but calm product UI, optimized for repeated daily use.
- Graphite surfaces with blue/ice state accents only.
- Strong module continuity: every tab belongs to the same machine.
- Visual treatment clarifies state before it decorates.

## 2. Colors

The palette is cool graphite with a single ice-blue operational accent.

### Primary
- **Ice Accent**: The primary action, selected state, focus, and current-period color. Use it rarely; its scarcity makes it useful.

### Secondary
- **Semantic Status Colors**: Success, warning, and danger exist for real state only. They are not palette decoration.

### Neutral
- **Graphite Backgrounds**: Deep page backgrounds and raised panels form the main structure.
- **Cool Text Ramp**: Strong text for headings, primary text for working content, secondary/muted text for labels and metadata.
- **Soft Borders**: Borders are low-contrast graphite/blue-gray strokes that define structure without making the app feel boxed-in.

### Named Rules
**The Ice Is State Rule.** Ice-blue marks selection, focus, current state, and primary action. Do not use it as decorative glow.

**The No Orange Rule.** Do not introduce orange, tan, warm beige, or generic black/orange mobile-task-app styling.

## 3. Typography

**Display Font:** Sora with Inter/system fallback  
**Body Font:** Inter / Plus Jakarta Sans with system fallback  
**Label/Mono Font:** IBM Plex Mono with UI monospace fallback

**Character:** The type system is product-dense and controlled: strong sans headings, readable body text, and compact mono labels for metadata, dates, counters, and system controls.

### Hierarchy
- **Display** (760, 30px, 1.08): Module titles and primary screen headings.
- **Headline** (740, 18-24px, 1.15): Card titles, modal titles, and major panels.
- **Title** (700, 14-16px, 1.25): Row titles, task names, and compact panel headings.
- **Body** (500, 14px, 1.45): Repeated task, habit, note, and setting content.
- **Label** (700, 10-11px, 0.08em, often uppercase): Metadata, weekday labels, counters, and compact system labels.

### Named Rules
**The Product Type Rule.** Do not use theatrical display typography in controls, labels, or data. Typography must serve scanning.

## 4. Elevation

Rootine uses tonal layering and restrained shadows. Panels are separated by surface color, border strength, and subtle shadow, not by heavy glassmorphism or dramatic glow. Elevated modals may use stronger shadow, but cards and controls should stay quiet at rest.

### Shadow Vocabulary
- **Card Shadow** (`0 6px 16px rgba(0, 0, 0, 0.14)`): Standard module cards and panels.
- **Panel Shadow** (`0 10px 26px rgba(0, 0, 0, 0.18)`): Larger system panels where hierarchy needs reinforcement.
- **Modal Shadow** (`0 34px 90px rgba(0, 0, 0, 0.56)`): Dialogs and overlays only.

### Named Rules
**The Tonal Depth Rule.** Prefer surface changes and borders before shadows. Shadow is hierarchy, not decoration.

## 5. Components

### Buttons
- **Shape:** Compact rounded controls, usually 10-13px radius.
- **Primary:** Ice background with graphite text, used for the main action on a surface.
- **Hover / Focus:** Slight surface shift or ice border/ring, never dramatic glow.
- **Secondary / Ghost:** Graphite field background with soft border and muted text.

### Chips
- **Style:** Dense segmented controls and filter chips with low-height rhythm, soft borders, and graphite backgrounds.
- **State:** Selected chips use an ice border or faint ice fill. Inactive chips remain neutral and quiet.

### Cards / Containers
- **Corner Style:** Panels use about 18px radius; nested controls use smaller radii.
- **Background:** Raised graphite surfaces, not translucent glass by default.
- **Shadow Strategy:** Low ambient shadow plus inset highlight only when it helps hierarchy.
- **Border:** Soft blue-gray borders define edges.
- **Internal Padding:** 20-24px on desktop panels, tighter on compact/mobile components.

### Inputs / Fields
- **Style:** Dark inset field surfaces with 10-13px radius.
- **Focus:** Ice border/ring with no color flood.
- **Disabled:** Muted graphite text and lower border contrast.

### Navigation
- Sidebar and mobile navigation use icon-first compact controls. Active module state uses ice-blue border/fill, while inactive modules stay graphite-muted.

### Planner Calendar
- The calendar is a desktop board on large screens and an agenda-assisted compact view on mobile.
- Month/date navigation belongs inside the calendar card. View selection is `Dzisiaj / Tydzień / Miesiąc`; task filters remain in the task panel.

## 6. Do's and Don'ts

### Do:
- **Do** keep Rootine graphite-first with ice-blue accents for state and action.
- **Do** keep controls compact, aligned, and single-line when the information is scan-first.
- **Do** preserve one raster across Planner, Goals, Sport, Diet, Finance, Travel, Office, Work, and Notes.
- **Do** use density when it helps the owner scan obligations and next actions.
- **Do** make module differences come from information architecture, not new visual themes.

### Don't:
- **Don't** make Rootine look like a corporate dashboard, SaaS analytics page, or boardroom KPI wall.
- **Don't** make it feel like Notion, a blank block canvas, or a generic productivity template.
- **Don't** introduce orange, beige, black/orange task-app styling, purple gradients, decorative glow, or heavy glassmorphism.
- **Don't** use generic card polish when the issue is hierarchy, spacing, or component governance.
- **Don't** use accent color without state meaning.

---
name: Rootine OS
description: A dark, premium personal life operating system — "Graphite Cockpit": graphite base, deep-navy support, restrained muted-emerald signal.
colors:
  accent-emerald: "#4bae88"
  accent-emerald-ink: "#86d9b7"
  accent-emerald-solid: "#3f9d78"
  on-accent: "#06130d"
  graphite-canvas: "#0e1512"
  graphite-surface: "#161e1a"
  graphite-surface-2: "#1d2621"
  graphite-surface-3: "#26312b"
  ink: "#e7ede9"
  ink-2: "#a6b3ac"
  ink-3: "#7a877f"
  ink-4: "#5f6b64"
  info-navy: "#5b83b6"
  success: "#46b088"
  warning: "#d9a860"
  danger: "#e07a6f"
  event-navy: "#5b83b6"
  event-emerald: "#46b088"
  event-clay: "#c79a6a"
  event-lavender: "#9a8cc2"
typography:
  display:
    fontFamily: "Sora, Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora, Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Sora, Inter, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "-0.005em"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.02em"
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-5: "20px"
  space-6: "24px"
  space-8: "32px"
  space-10: "40px"
  page-pad: "28px"
components:
  button-primary:
    backgroundColor: "{colors.accent-emerald}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: "0 18px"
  button-primary-hover:
    backgroundColor: "{colors.accent-emerald-solid}"
    textColor: "{colors.on-accent}"
  card:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  input:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: Rootine OS

## 1. Overview

**Creative North Star: "The Graphite Cockpit"**

Rootine OS is a **dark-first** personal life operating system. The primary identity is a premium graphite cockpit: a deep, warm-graphite base with a green-blue undertone (`#0e1512` canvas, `#161e1a` panels), carrying a single **muted emerald** signal (`#4bae88`). It should read like well-made control software — calm, dense where it counts, composed under load — not a movie HUD and not a cold admin panel. Dark mode is not a skin here; it is the product. A white-lotus warm-light theme exists as the one supported alternative, but every surface is designed graphite-first.

Two influences balance the mood. "**White Lotus**" contributes humanity: the graphite carries a faint warmth and the emerald is desaturated, never clinical. "**Jarvis**" contributes clarity and precision: modular structure, intelligent hierarchy, responsive states, restrained signal — expressed through information design, never through neon or sci-fi decoration. The daily experience is a focused cockpit: fast to scan, highly legible, information-dense where useful, minimal friction to act.

What this system explicitly rejects: neon/cyberpunk glow and HUD lines; pure black and cold corporate gray; gamified habit-app energy (streak confetti, mascots, badges); generic SaaS dashboards (purple gradient hero cards, icon-heading-text grids, meaningless "insight" widgets); and Notion/ClickUp configuration overload. The line to walk: **dark and focused without becoming cold or heavy; dense without cluttered; warm and premium without playful or decorative.**

**Key Characteristics:**
- Graphite base with a green-blue undertone; depth by tonal layering, not heavy shadow.
- One restrained muted-emerald signal (≤ ~10% of any screen) plus a muted, natural status/event palette.
- Sora display + Inter body; compact 14px base tuned for glanceable, dense screens.
- Subtle borders, soft atmospheric surfaces, calm contrast.
- Fully token-driven so the whole app (and the light alt) stays coherent from one source.

## 2. Colors

A graphite foundation with a green-blue undertone, one muted emerald signal, and a desaturated natural status palette. No pure black, no pure white, no neon.

### Primary
- **Muted Emerald** (`#4bae88`): The single brand signal. Primary actions, active/selected states, selected navigation, positive progress, focus rings, small status indicators. Restrained by rule — its scarcity is what makes it read as precision rather than decoration.
- **Emerald Ink** (`#86d9b7`): Lighter emerald for accent *text* and highlights on dark surfaces where the base emerald wouldn't carry enough contrast.
- **Emerald Solid** (`#3f9d78`): The deeper emerald for hover/active on primary controls. Text on emerald uses **On-Accent** (`#06130d`), a near-black warm graphite.

### Secondary
- **Muted Success** (`#46b088`) / **Amber Warning** (`#d9a860`) / **Clay Danger** (`#e07a6f`) / **Deep Navy Info** (`#5b83b6`): The status family, all desaturated toward the graphite world — natural, never signal-bright. Each ships with an `-ink` (text) and `-soft` (tinted background) sibling. Deep navy is the designated *support* tone alongside emerald.

### Tertiary
- **Event Tones** — Navy (`#5b83b6`), Emerald (`#46b088`), Clay (`#c79a6a`), Muted Lavender (`#9a8cc2`): A four-color categorical set for calendar events and tags, each with a soft tinted background pair, tuned to sit on graphite without competing with the emerald signal.

### Neutral
- **Graphite Canvas** (`#0e1512`): The app background — the deep base everything rests on. Not black.
- **Panel Surface** (`#161e1a`): The primary raised surface for cards and panels.
- **Surface Layers** (`#1d2621` elevated, `#26312b` overlay): Higher surfaces, stepped by tone to convey depth without heavy shadow.
- **Ink Ramp** — Ink (`#e7ede9`), Ink-2 (`#a6b3ac`), Ink-3 (`#7a877f`), Ink-4 (disabled): warm off-white → muted; never `#fff`.
- **Borders**: hairlines at low opacity in the graphite hue (`#26312b` default, `#1e2723` soft), so lines belong to the surface rather than cutting across it.

### Named Rules
**The One Emerald Rule.** There is exactly one brand signal — Muted Emerald. It carries interaction, identity, and positive state; it does not decorate. If emerald is doing more than ~10% of a screen, something is over-accented. Most of the interface stays graphite and navy.

**The No-Pure, No-Neon Rule.** No `#000`, no `#fff`, no neon green, no glow. Text is warm off-white; the darkest surface is warm graphite; the emerald is desaturated. Purity reads cold and neon reads cyberpunk — both are anti-references.

## 3. Typography

**Display Font:** Sora (with Inter, system-ui fallback)
**Body Font:** Inter (with Plus Jakarta Sans, system-ui fallback)
**Mono Font:** IBM Plex Mono (with SF Mono, Menlo fallback)

**Character:** Sora brings geometric confidence to headings without feeling corporate; Inter keeps body text neutral and legible at small sizes on dark surfaces. IBM Plex Mono appears only for numeric/tabular and code-like data (counts, times, macros).

### Hierarchy
- **Display** (Sora, 650, 32px): Rare — top-of-page or dashboard hero figures.
- **Headline** (Sora, 650, 28px): Screen/module titles.
- **Title** (Sora, 600, 18–22px): Card and section headers.
- **Body** (Inter, 400, 14px): Default reading text. The compact base is deliberate — these are information-dense product screens.
- **Label** (Inter, 600, 11px): Field labels, chips, meta — functional, never a decorative tracked eyebrow.
- **Meta / Mono** (IBM Plex Mono, 10–12px): Timestamps, counts, macros, numeric data.

### Named Rules
**The Compact-Base Rule.** Body is 14px, not 16px. This is a cockpit, not an article. Hierarchy comes from weight (400 → 600 → 650) and the Sora/Inter role split, not from inflating sizes.

## 4. Elevation

Depth is carried primarily by **tonal layering**, not shadow. Surfaces step canvas (`#0e1512`) → panel (`#161e1a`) → elevated (`#1d2621`) → overlay (`#26312b`); a raised element reads as raised because its tone lifts. Shadows are soft and low, reserved for elements that genuinely float (popovers, dropdowns, modals).

### Shadow Vocabulary
- **Hairline** (`--sh-1`): Resting cards — barely there.
- **Lifted** (`--sh-2`): Hover on interactive surfaces.
- **Raised** (`--sh-3`): Persistent elevated containers.
- **Pop** (`--sh-pop`): Popovers, dropdowns, modals only.
- **Focus Ring** (`--ring`): Emerald-tinted focus indicator (`0 0 0 3px` emerald-soft).

### Named Rules
**The Tone-First Rule.** Reach for a surface-tone step before a shadow. On a dark base, a tight black drop shadow disappears or muddies; let tone do the lifting. Shadows are for things that truly float.

## 5. Components

### Buttons
- **Shape:** Medium radius (`12px`).
- **Primary:** Emerald background, on-accent (near-black) text, 40px control height, Inter ~13px / weight 650. Hover → Emerald Solid; emerald focus ring. Used sparingly so the signal stays rare.
- **Secondary / Ghost:** Graphite surface or transparent with a quiet hairline border; ink text. The default for most actions.

### Cards / Containers
- **Corner Style:** Generous `20px` for primary cards; `12px` for nested/compact.
- **Background:** Panel surface (`#161e1a`) on the graphite canvas.
- **Shadow Strategy:** Hairline at rest; tonal layering does the depth work.
- **Border:** Quiet graphite hairline — present, never assertive. **Never a side-stripe accent border** (banned tell).
- **Internal Padding:** `20px`, tightening to `12–16px` in dense modules.

### Inputs / Fields
- **Style:** Surface background, quiet hairline border, `12px` radius, 14px Inter, muted placeholder.
- **Focus:** Border shifts toward the emerald line and a `3px` emerald-soft ring appears — no harsh glow.
- **Error / Disabled:** Error uses the danger token's border + soft background; disabled drops text to Ink-4 and mutes the surface.

### Navigation
- **Style:** Persistent desktop nav showing all 9 modules (Start, Work, Sport, Finance, Goals, Diet, Notes, Travel, Office). Default items muted (Ink-2); hover lifts to Ink; the active item carries the emerald signal (text and/or a soft emerald background), never a heavy underline. Secondary modules present but visually lower priority. Mobile collapses to a compact bar around the priority flows (tasks+calendar, quick meal, start workout, add note).

### Theming (Signature System)
Every color, shadow, and radius is a CSS custom property re-declared under `[data-theme="dark"]` (canonical) and `:root` / `[data-theme="light"]` (white-lotus alt). New surfaces must be authored against tokens (`var(--surface)`, `var(--acc)`, `var(--ink)`, `var(--r-card)`) and the themeable accent channel `rgb(var(--acc-rgb) / α)` for accent tints — never literal hex — so they theme automatically. This is the backbone of "one coherent system."

## 6. Do's and Don'ts

### Do:
- **Do** author every surface against semantic tokens and `rgb(var(--acc-rgb) / α)` for accent tints, so it themes across dark/light for free.
- **Do** convey depth by stepping surface tone first; add shadow only for elements that genuinely float.
- **Do** keep the emerald signal rare and earned — interaction, identity, and positive state only (≤ ~10% of a screen); keep most of the UI graphite and navy.
- **Do** keep body text at 14px and build hierarchy from weight and the Sora/Inter split.
- **Do** lead each surface with "what matters now?" (orient before act); prioritize signal over inventory.

### Don't:
- **Don't** use neon green, glow, hologram/HUD lines, or fake sci-fi panels. Advanced ≠ cyberpunk.
- **Don't** use `#000` or `#fff` or cold corporate gray. The base is warm graphite; text is warm off-white.
- **Don't** add gamified flourishes — no streak confetti, mascots, badges, or celebratory bounce/elastic motion.
- **Don't** fall into the generic SaaS-dashboard look: no gradient hero cards, no default purple, no icon-heading-text card grids, no meaningless "insight" widgets.
- **Don't** create Notion/ClickUp clutter — no everything-at-once density, no nested config dumped on primary surfaces.
- **Don't** use `border-left`/`border-right` greater than 1px as a colored accent stripe; carry tone with a leading icon, a soft tint, or a full hairline.
- **Don't** use gradient text (`background-clip: text`) or decorative glassmorphism.
- **Don't** hardcode hex values in new components; that breaks theming and drifts the system.

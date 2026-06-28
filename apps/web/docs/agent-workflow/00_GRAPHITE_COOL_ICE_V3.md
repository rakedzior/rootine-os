# Rootine OS — Graphite Cool Ice v3 Design System

## 1. General design direction

Graphite Cool Ice v3 is the default visual system for Rootine OS.

The interface should feel:

- premium
- calm
- focused
- modern
- clean
- slightly futuristic
- professional
- non-gaming
- non-childish
- comfortable for long daily use

Rootine OS is a personal operating system, not a flashy lifestyle app.

The design should feel like a serious productivity, planning and self-management tool.

Core visual principle:

90% graphite surfaces
8% cool ice accents
2% special colors

Bright colors must never dominate large areas.

Large surfaces must remain dark graphite.

Ice/cyan/teal accents should be used only for:

- active states
- focus rings
- selected elements
- primary actions
- checkboxes
- small tags
- status markers
- important highlights

Avoid:

- neon-heavy styling
- large glowing blue/cyan panels
- gaming-style gradients
- pure black
- pure white
- random hardcoded hex colors

## 2. Core semantic palette

Use semantic tokens everywhere.

Preferred CSS variables:

:root {
  --surface-base: #0D131B;
  --surface-raised: #141D29;
  --surface-elevated: #1B2838;
  --surface-overlay: #25364A;
  --surface-calendar: #111A24;

  --border-subtle: #25364A;
  --border-soft: #1F2E3F;
  --border-active: #7DD3FC;

  --text-primary: #E6EDF5;
  --text-secondary: #A7B4C2;
  --text-muted: #78889A;
  --text-disabled: rgba(230, 237, 245, 0.38);

  --accent-ice: #7DD3FC;
  --accent-ice-strong: #38BDF8;
  --accent-teal: #5EEAD4;

  --status-success: #34D399;
  --status-warning: #FBBF24;
  --status-danger: #F87171;

  --accent-special: #A78BFA;
  --accent-hot: #F472B6;
}

## 3. Surface hierarchy

Depth is created through gradually lighter graphite surfaces, not strong shadows.

Use this hierarchy:

- 0dp app background: surface.base / #0D131B
- 1dp main panels: surface.raised / #141D29
- 2dp nested cards: surface.elevated / #1B2838
- 3dp overlays, modals, drawers: surface.overlay / #25364A
- calendar grid: surface.calendar / #111A24

Rules:

- Higher surfaces are slightly lighter.
- Do not use pure black backgrounds.
- Do not use glow as primary elevation.
- Use subtle borders instead of strong shadows.
- Cards should feel premium and disciplined.

Recommended default card:

background: var(--surface-raised);
border: 1px solid var(--border-subtle);
border-radius: 18px;

Recommended soft shadow:

box-shadow:
  0 12px 32px rgba(0, 0, 0, 0.22),
  inset 0 1px 0 rgba(255, 255, 255, 0.03);

## 4. Typography

Preferred fonts:

- Headings: Sora / Inter Tight / Plus Jakarta Sans
- Body: Inter / Plus Jakarta Sans
- Numeric / mono: IBM Plex Mono / JetBrains Mono

Recommended tokens:

--font-display: "Sora", "Inter", system-ui, sans-serif;
--font-body: "Inter", "Plus Jakarta Sans", system-ui, sans-serif;
--font-mono: "IBM Plex Mono", "JetBrains Mono", monospace;

Recommended type scale:

- display: 32px
- h1: 28px
- h2: 22px
- h3: 18px
- body: 14px
- small: 12px
- caption: 11px
- micro: 10px

Font weights:

- page title: 650–700
- section title: 600–650
- card title: 600
- body: 400–500
- labels: 600
- metadata: 400–500
- numbers/metrics: 600–700

Use uppercase labels only for small metadata sections such as:

- DZISIAJ
- TEN TYDZIEŃ
- NAWYKI
- REKORDY
- PLANOWANE
- ZAPLANOWANE

Do not overuse uppercase.

## 5. Layout principles

The UI should be modular, spacious and dashboard-like.

Preferred structure:

- sidebar / navigation
- top utility bar
- main content
- panels / cards / drawers

Large screens should use available width and height logically.

Avoid:

- modules ending visually at 2/3 screen height
- excessive empty unused space
- cramped forms
- overloaded dashboards

Use an 8px spacing system:

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px

Radius system:

- small buttons: 10–12px
- inputs: 12px
- cards: 16–20px
- large panels: 20–24px
- badges: pill radius

Avoid overly bubbly corners.

## 6. Navigation styling

Sidebar:

background: var(--surface-raised);
border-right: 1px solid var(--border-soft);

Active navigation item:

background: rgba(125, 211, 252, 0.10);
border: 1px solid rgba(125, 211, 252, 0.26);
border-left: 2px solid var(--accent-ice);
color: var(--text-primary);

Inactive navigation item:

color: var(--text-secondary);
background: transparent;

Hover:

background: rgba(230, 237, 245, 0.04);
color: var(--text-primary);

Sidebar group labels:

font-size: 10px;
letter-spacing: 0.10em;
text-transform: uppercase;
color: var(--text-muted);

Icons:

- use Lucide / Phosphor / Heroicons outline
- stroke width 1.75–2.0
- size 16–20px
- inactive color: text-secondary
- active color: accent-ice

Avoid inconsistent or cartoon-like icons.

## 7. Top utility bar

The top bar should be quiet and functional.

It may include:

- global search
- weather
- current time/date
- profile/avatar
- quick settings
- theme toggle

Style:

height: 56px;
background: rgba(13, 19, 27, 0.86);
backdrop-filter: blur(16px);
border-bottom: 1px solid var(--border-soft);

Weather/time should be compact and not dominate.

## 8. Page headers

Avoid huge page headers.

Preferred compact header:

[icon] Page name

Optional subtitle only when useful.

Page icon:

width: 44px;
height: 44px;
border-radius: 14px;
background: rgba(125, 211, 252, 0.10);
border: 1px solid rgba(125, 211, 252, 0.25);
color: var(--accent-ice);

## 9. Cards and panels

Default card:

background: var(--surface-raised);
border: 1px solid var(--border-subtle);
border-radius: 20px;
padding: 20px;
color: var(--text-primary);

Nested card:

background: var(--surface-elevated);
border: 1px solid var(--border-subtle);
border-radius: 14px;
padding: 14px;

Selected card:

background: rgba(125, 211, 252, 0.08);
border: 1px solid rgba(125, 211, 252, 0.55);

Hover state:

border-color: rgba(125, 211, 252, 0.35);
background: #162334;

## 10. Buttons

Primary button:

background: var(--accent-ice);
color: #07111A;
border: 1px solid rgba(125, 211, 252, 0.65);
border-radius: 12px;
font-weight: 650;

Primary hover:

background: var(--accent-ice-strong);
box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.12);

Secondary button:

background: var(--surface-elevated);
color: var(--text-primary);
border: 1px solid var(--border-subtle);

Ghost button:

background: transparent;
color: var(--text-secondary);

Ghost hover:

background: rgba(230, 237, 245, 0.05);
color: var(--text-primary);

Destructive button:

background: rgba(248, 113, 113, 0.12);
color: var(--status-danger);
border: 1px solid rgba(248, 113, 113, 0.35);

## 11. Inputs and forms

Inputs should be calm, compact and clear.

Input:

background: var(--surface-base);
border: 1px solid var(--border-subtle);
border-radius: 12px;
color: var(--text-primary);
padding: 10px 12px;

Placeholder:

color: var(--text-muted);

Focus:

border-color: var(--accent-ice);
box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.12);

Labels:

font-size: 12px;
font-weight: 600;
color: var(--text-secondary);

Forms should not be overloaded. Use sections, drawers and progressive disclosure.

## 12. Tags, badges and chips

Default tag:

border-radius: 999px;
padding: 3px 8px;
font-size: 11px;
font-weight: 600;
background: rgba(167, 180, 194, 0.10);
color: var(--text-secondary);

Work / neutral tag:

background: rgba(125, 211, 252, 0.12);
color: var(--accent-ice);

Success tag:

background: rgba(52, 211, 153, 0.12);
color: var(--status-success);

Urgent tag:

background: rgba(244, 114, 182, 0.14);
color: #F9A8D4;

Premium tag:

background: rgba(167, 139, 250, 0.14);
color: var(--accent-special);

Use pink/hot color very rarely.

## 13. Checkboxes, toggles and selections

Checkbox unchecked:

background: transparent;
border: 1px solid var(--border-subtle);

Checkbox checked for completion:

background: var(--status-success);
border-color: var(--status-success);
color: #06111A;

For selected filters, active calendar days or non-completion selections, use accent-ice.

Toggle on:

background: rgba(125, 211, 252, 0.22);
border-color: rgba(125, 211, 252, 0.55);

Toggle knob:

background: var(--accent-ice);

## 14. Calendar styling

Calendar container:

background: var(--surface-raised);
border: 1px solid var(--border-subtle);
border-radius: 20px;

Calendar cells:

background: var(--surface-calendar);
border: 1px solid var(--border-soft);

Today / selected day:

background: rgba(125, 211, 252, 0.08);
border: 1px solid rgba(125, 211, 252, 0.70);

Day number badge:

background: var(--accent-ice);
color: #06111A;

Tasks inside calendar:

background: rgba(52, 211, 153, 0.14);
color: var(--status-success);
border: 1px solid rgba(52, 211, 153, 0.30);

Avoid filling entire calendar cells with bright cyan.

## 15. Planner convention

Planner should focus on:

- tasks
- habits
- calendar
- today/tomorrow/week/month filters

Preferred layout:

Left panel: Tasks + Habits
Right panel: Calendar

Task list item:

- checkbox
- title
- optional tags
- date/status on the right
- hover actions
- edit on click
- delete/copy in context menu

Task row:

border-bottom: 1px solid var(--border-soft);
padding: 10px 0;

Habit section:

- compact
- preferably text-based
- not icon-heavy

Recommended habit layout:

[✓] 8K kroków       [ ] Czytanie
[✓] Woda 2L         [ ] Trening
[ ] Bez cukru       [✓] Medytacja

Habit tile:

background: var(--surface-elevated);
border: 1px solid var(--border-subtle);
border-radius: 12px;
padding: 10px 12px;

Completed habit:

background: rgba(52, 211, 153, 0.10);
border-color: rgba(52, 211, 153, 0.45);

Habit section header should show progress:

Nawyki 3 / 6

## 16. Sport convention

Sport should be one consolidated panel, not many disconnected tabs.

Core sections:

1. This week training plan
2. Templates and planning
3. Training history
4. Records

Active session should be hidden until user starts workout.

Weekly training card:

- day name
- date
- plus button
- planned workout cards
- drag and drop support if feasible
- menu alternative for non-drag users

Workout card:

background: var(--surface-elevated);
border: 1px solid var(--border-subtle);
border-radius: 14px;

Today:

border-color: rgba(125, 211, 252, 0.70);
background: rgba(125, 211, 252, 0.06);

Completed workout:

border-color: rgba(52, 211, 153, 0.40);
background: rgba(52, 211, 153, 0.08);

Primary sport actions:

- + Dodaj trening
- + Zaplanuj blok

Active session:

- each set can be checked off
- checking a set starts rest timer
- timer uses cool ice accent
- completed sets use success green
- current set uses ice border
- rest timer controls include pause, resume, add time, skip

## 17. Diet / Nutrition convention

Diet should feel calm, clean and data-oriented.

Use:

- food logging cards
- macro progress
- meal sections
- water tracker
- daily summary

Avoid large colorful macro panels.

Macro colors:

- protein: accent-ice
- carbs: status-warning
- fat: accent-special
- water: accent-teal

Progress bars:

height: 8px;
border-radius: 999px;
background: var(--surface-elevated);

## 18. Goals convention

Goals should use folder-like long-term structures.

Recommended sections:

- Cele
- Roadmapa celów
- Plan na ten tydzień

Goal cards:

- title
- short description
- progress
- next action
- due timeframe
- expandable nested tasks

Avoid big KPI blocks.

Important milestones can use accent-special, not hot pink.

## 19. Notes convention

Notes should be quiet and readable.

Use:

- list/grid of notes
- tags
- pinned notes
- search
- editor drawer

Note card:

background: var(--surface-raised);
border: 1px solid var(--border-subtle);
border-radius: 16px;

Pinned note:

border-color: rgba(125, 211, 252, 0.45);

Long-form editor can use a slightly lighter content well, but app chrome remains dark.

## 20. Work convention

Work should resemble a professional project management system.

Support:

- company selector
- projects
- tasks
- subtasks
- list view
- board view
- calendar view
- timeline/Gantt view if present

Status examples:

- Todo: muted
- In progress: accent-ice
- Blocked: status-warning
- Done: status-success
- Urgent: accent-hot

Use chips, not large colored columns.

Kanban columns:

background: var(--surface-raised);
border: 1px solid var(--border-subtle);

Task cards:

background: var(--surface-elevated);
border-radius: 14px;

## 21. Office / Bureau convention

Biuro should feel administrative and organized.

Possible sections:

- sprawy
- dokumenty
- umowy
- auto
- ubezpieczenia
- UoP
- B2B

Use folder/list style.

Important dates use warning. Completed items use success. Missing items use danger.

## 22. Travel convention

Travel should use trip folders.

Trip card:

- destination
- dates
- next booking
- packing status
- budget summary

Use accent-teal or accent-ice for travel states.

Avoid over-coloring maps or imagery.

## 23. Documents convention

Documents should be archive-like, clean and trustworthy.

Use:

- folders
- document cards
- expiry dates
- file type badges
- status indicators

Do not make this module playful.

## 24. Modals, drawers and overlays

Desktop drawers should slide from the right.

Drawer:

background: var(--surface-overlay);
border-left: 1px solid var(--border-subtle);
box-shadow: -16px 0 48px rgba(0, 0, 0, 0.28);

Modal:

background: var(--surface-overlay);
border: 1px solid var(--border-subtle);
border-radius: 24px;

Backdrop:

background: rgba(5, 8, 12, 0.62);
backdrop-filter: blur(8px);

Drawer sections should have clear labels and subtle separators.

## 25. Empty states

Empty states should be calm, compact and useful.

Avoid huge illustrations.

Example:

Brak treningów w tym tygodniu.
Dodaj trening albo zaplanuj blok.

[+ Dodaj trening] [+ Zaplanuj blok]

Icon container:

background: rgba(125, 211, 252, 0.08);
border: 1px solid rgba(125, 211, 252, 0.20);
color: var(--accent-ice);

## 26. Loading states

Use skeletons on graphite surfaces.

Skeleton:

background: linear-gradient(
  90deg,
  var(--surface-raised),
  var(--surface-elevated),
  var(--surface-raised)
);

Avoid bright loaders.

## 27. Error states

Errors should be visible but not aggressive.

Error card:

background: rgba(248, 113, 113, 0.10);
border: 1px solid rgba(248, 113, 113, 0.35);
color: #FCA5A5;

Do not use pure red large surfaces.

## 28. Toasts and notifications

Toast:

background: var(--surface-overlay);
border: 1px solid var(--border-subtle);
border-radius: 14px;

Success toast:

border-color: rgba(52, 211, 153, 0.38);

Warning toast:

border-color: rgba(251, 191, 36, 0.38);

Error toast:

border-color: rgba(248, 113, 113, 0.38);

## 29. Data visualization

Charts should be subtle and integrated.

Chart grid:

stroke: rgba(167, 180, 194, 0.10);

Main line:

stroke: var(--accent-ice);

Positive line:

stroke: var(--status-success);

Warning line:

stroke: var(--status-warning);

Do not use rainbow palettes.

Use 1–3 colors maximum.

## 30. Motion and interaction

Motion should be subtle, fast and functional.

Recommended transition:

transition:
  background-color 160ms ease,
  border-color 160ms ease,
  color 160ms ease,
  transform 160ms ease,
  opacity 160ms ease;

Hover lift:

transform: translateY(-1px);

No bouncing. No playful motion.

Drawer animation:

220ms cubic-bezier(0.2, 0.8, 0.2, 1);

## 31. Accessibility

Rules:

- no pure black as main app background
- no pure white text
- maintain strong contrast
- use off-white text
- use color plus labels/icons, not color alone
- do not rely only on hover
- every hover action must also be available through click/tap
- focus states must be visible
- disabled states must be clearly disabled
- large bright areas must be avoided

Focus ring:

outline: none;
box-shadow: 0 0 0 3px rgba(125, 211, 252, 0.25);

## 32. Mobile and future iOS compatibility

Rules:

- do not rely only on hover
- drag and drop must have menu alternative
- right drawers become bottom sheets on mobile
- cards should be tappable
- hidden hover actions must also exist in a three-dot menu
- touch targets should be at least 44px
- weekly views should become horizontal scroll or vertical day list
- avoid desktop-only shortcuts as the only way to perform an action

## 33. Final visual summary

Graphite Cool Ice v3 should look like:

- dark graphite shell
- slightly lighter cards
- even lighter overlays
- off-white text
- muted blue-gray metadata
- cool ice highlights
- teal secondary accents
- green success states
- amber warnings
- soft red errors
- violet premium states
- pink only for urgent/special cases

The interface should feel like a polished productivity operating system: calm, controlled, modern and premium.

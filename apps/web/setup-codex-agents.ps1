$ErrorActionPreference = "Stop"

function Write-Utf8File {
    param(
        [string]$Path,
        [string]$Content
    )

    $Directory = Split-Path -Path $Path -Parent

    if ($Directory -and -not (Test-Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory -Force | Out-Null
    }

    [System.IO.File]::WriteAllText(
        (Join-Path (Get-Location) $Path),
        $Content,
        [System.Text.UTF8Encoding]::new($false)
    )
}

function Write-CodexAgent {
    param(
        [string]$File,
        [string]$Name,
        [string]$Description,
        [string]$Instructions,
        [string]$SandboxMode = ""
    )

    $SandboxLine = ""

    if ($SandboxMode -ne "") {
        $SandboxLine = "sandbox_mode = `"$SandboxMode`"`n"
    }

    Write-Utf8File ".codex\agents\$File" @"
name = "$Name"
description = "$Description"
$SandboxLine
developer_instructions = """
$Instructions
"""
"@
}

New-Item -ItemType Directory -Path ".codex\agents" -Force | Out-Null
New-Item -ItemType Directory -Path "docs\agent-workflow\modules" -Force | Out-Null

Write-Utf8File "AGENTS.md" @'
# Rootine OS — Codex Project Instructions

## Product context

Rootine OS is an existing web application for personal tracking and life management.

The app contains modules such as:

- Start / Planner
- Habits
- Sport
- Nutrition
- Goals
- Notes
- Office / Admin
- Work
- Travel
- Documents

The visual UI already exists. Do not redesign the application unless a small adjustment is required to make a broken interaction usable.

## Design system

The default design system is Graphite Cool Ice v3.

Before making any UI-related change, read:

- docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md

Core visual rule:

- 90% graphite surfaces
- 8% cool ice accents
- 2% special colors

The application should feel premium, calm, focused, modern, professional and slightly futuristic.

Avoid:

- neon/gaming look
- large cyan/blue panels
- childish UI
- pure black
- pure white
- random hardcoded colors
- heavy glow
- too many colors on one screen
- accidental redesign

## Non-negotiable implementation rules

1. Every visible interactive element must work:
   - buttons
   - icons
   - checkboxes
   - inputs
   - selects
   - dropdowns
   - tabs
   - modals
   - drawers
   - context menus
   - calendar actions
   - add/edit/delete/archive actions

2. Do not leave final mock data in implemented flows.

3. Use Supabase for persistent user data unless a module explicitly says otherwise.

4. Every private table must include `user_id`.

5. Add or update RLS policies for every private table.

6. Implement loading, empty, error and success states.

7. Prefer soft delete or archive over hard delete unless the module spec explicitly requires hard delete.

8. Do not modify global layout, routing, theme, shared UI primitives, auth or Supabase client configuration without a clear reason.

9. Do not break existing UI conventions.

10. Do not implement unrelated features while working on a module.

11. Do not replace the current style with a generic Tailwind/shadcn/default dashboard look.

12. Keep implementation practical and maintainable.

## Database rules

Before changing database schema:

1. Inspect existing Supabase setup.
2. Check existing migrations.
3. Check existing services, hooks and types.
4. Update `docs/agent-workflow/02_SUPABASE_SCHEMA.md`.
5. Create or update migration files.
6. Describe migration impact in the final report.

## Required checks after implementation

Run, if available:

- npm run lint
- npm run build
- npm run test

If a command does not exist or fails due to unrelated existing issues, explain it clearly.

## Final report format

At the end of every task, return:

- Scope completed
- Files changed
- Database changes
- Functional changes
- Tests/checks run
- Known issues
- Decisions needed from the user
- Suggested next task
'@

Write-Utf8File ".codex\config.toml" @'
[agents]
max_threads = 6
max_depth = 1
'@

Write-Utf8File "docs\agent-workflow\00_GRAPHITE_COOL_ICE_V3.md" @'
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
'@

Write-Utf8File "docs\agent-workflow\01_PRODUCT_RULES.md" @'
# Rootine OS — Product Rules

## Core principle

Rootine OS is a practical personal operating system.

It should help the user manage life modules without feeling overloaded.

## Main modules

- Start / Planner
- Habits
- Sport
- Nutrition
- Goals
- Notes
- Office / Admin
- Work
- Travel
- Documents

## UX principles

1. The UI already exists. Preserve it.
2. Do not redesign screens unless an interaction is impossible to implement without a small UI adjustment.
3. Avoid overloaded dashboards.
4. Prefer one focused main panel and contextual details in modals, drawers or detail panels.
5. Every visible element that looks clickable must either work or be clearly disabled.
6. Keep workflows fast:
   - quick add
   - inline edit where appropriate
   - minimal required fields
   - progressive disclosure for advanced options
7. Use consistent states:
   - loading
   - empty
   - error
   - saving
   - saved
   - archived
   - paused
   - active/inactive

## Data principles

1. User data is private by default.
2. Every user-owned table should have user_id.
3. Prefer soft delete / archive over hard delete.
4. Important historical data should not disappear accidentally.
5. Keep relations explicit and queryable.
6. Avoid duplicating business logic across modules.

## Acceptance principle

A module is not finished until:

- all visible buttons work
- CRUD works
- data persists in Supabase
- empty/loading/error states exist
- the UI remains consistent with Graphite Cool Ice v3
- build/lint pass or known unrelated issues are documented
'@

Write-Utf8File "docs\agent-workflow\02_ARCHITECTURE.md" @'
# Rootine OS — Architecture Notes

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
'@

Write-Utf8File "docs\agent-workflow\03_SUPABASE_SCHEMA.md" @'
# Rootine OS — Supabase Schema

## Purpose

This file is the source of truth for database tables, relationships, RLS assumptions and module data contracts.

Agents must update this file whenever they add or change Supabase schema.

## Global conventions

Every private user-owned table should include:

- id uuid primary key default gen_random_uuid()
- user_id uuid not null references auth.users(id) on delete cascade
- created_at timestamptz not null default now()
- updated_at timestamptz not null default now()
- optional archived_at timestamptz
- optional deleted_at timestamptz
- optional status text

## RLS convention

For user-owned tables:

alter table table_name enable row level security;

create policy "Users can select own table_name"
on table_name for select
using (auth.uid() = user_id);

create policy "Users can insert own table_name"
on table_name for insert
with check (auth.uid() = user_id);

create policy "Users can update own table_name"
on table_name for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own table_name"
on table_name for delete
using (auth.uid() = user_id);

## Planned modules

### Planner / Tasks

Potential tables:

- tasks
- task_recurrence_rules
- task_instances

Core fields:

- title
- description
- date
- start_time
- end_time
- priority
- status
- source
- parent_task_id
- archived_at
- completed_at

### Habits

Potential tables:

- habits
- habit_recurrence_rules
- habit_completions
- habit_pauses

Core fields:

- name
- description
- is_active
- status
- recurrence_type
- recurrence_interval
- days_of_week
- time_of_day
- start_date
- end_date
- paused_from
- paused_until

### Notes

Potential tables:

- notes
- note_categories
- note_tags
- note_tag_links

Core fields:

- title
- body
- category_id
- pinned
- archived_at

### Documents

Potential tables:

- documents
- document_categories
- document_files

Core fields:

- title
- category
- file_path
- expiration_date
- status
- notes

### Work

Potential tables:

- work_companies
- work_projects
- work_tasks
- work_task_notes
- work_links

Core fields:

- project_id
- parent_task_id
- title
- description
- status
- priority
- due_date

### Travel

Potential tables:

- trips
- trip_itinerary_items
- trip_lodging
- trip_transport
- trip_packing_items
- trip_documents
- trip_budget_items
- trip_notes

### Sport

Potential tables:

- sport_sessions
- sport_templates
- sport_exercises
- sport_session_exercises
- sport_sets
- body_measurements

### Nutrition

Potential tables:

- nutrition_days
- food_entries
- meals
- water_entries
- body_weight_entries

### Goals

Potential tables:

- goals
- goal_milestones
- goal_progress_entries

## Agent instruction

Before adding a table, check:

1. Does a similar table already exist?
2. Does the module already have types/services?
3. Does this data need history?
4. Should delete mean archive instead?
5. What indexes are needed?
6. What RLS policies are needed?

Document final schema here after implementation.
'@

Write-Utf8File "docs\agent-workflow\04_MODULE_OWNERSHIP.md" @'
# Rootine OS — Module Ownership

## General rule

One implementation agent should work on one module at a time.

Avoid allowing two implementation agents to edit the same feature module in parallel.

## Global files

Only the Orchestrator, Supabase/Data Agent or Integration Agent should modify global files unless explicitly instructed.

Global files may include:

- routing
- app shell
- theme
- design tokens
- shared UI primitives
- Supabase client
- auth
- global state
- global types

## Planner Agent

Allowed:

- planner/start pages
- planner components
- planner hooks
- planner services
- planner types
- planner Supabase migrations

Not allowed without approval:

- global layout
- global theme
- auth
- unrelated modules

## Habits Agent

Allowed:

- habits pages
- habits components
- habits hooks
- habits services
- habits types
- habits Supabase migrations
- main overview integration for active habits, only if needed

## Notes Agent

Allowed:

- notes pages
- notes components
- notes hooks
- notes services
- notes types
- notes Supabase migrations

## Documents Agent

Allowed:

- documents pages
- documents components
- document metadata
- document storage integration
- document Supabase migrations

## Work Agent

Allowed:

- work pages
- work components
- companies/projects/tasks/subtasks
- work notes
- work links
- work Supabase migrations

## Travel Agent

Allowed:

- travel pages
- trips
- plan/itinerary
- lodging
- transport
- packing
- budget
- travel documents
- travel notes
- travel Supabase migrations

## Sport Agent

Allowed:

- sport pages
- sport tabs
- workout session flow
- templates
- exercises
- sets
- measurements
- sport history
- sport Supabase migrations

## Nutrition Agent

Allowed:

- nutrition pages
- food entries
- meals
- macros
- water tracker
- weight/measurements if part of nutrition UI
- nutrition Supabase migrations

## Goals Agent

Allowed:

- goals pages
- goals
- milestones
- progress
- goals Supabase migrations

## QA Agent

Read-only by default.

Allowed:

- inspect code
- inspect diff
- run tests
- produce issue reports

Not allowed unless explicitly asked:

- editing implementation files

## Integration Agent

Allowed:

- deduplicate hooks/services/types/components
- extract shared utilities
- align module patterns
- improve naming consistency
- update docs

Not allowed:

- redesign UI
- change business behavior silently
- broad rewrites without clear reason
'@

Write-Utf8File "docs\agent-workflow\05_TASK_BOARD.md" @'
# Rootine OS — Agent Task Board

## Status legend

- TODO
- IN_PROGRESS
- QA
- BLOCKED
- DONE

## Recommended implementation order

1. Orchestrator audit
2. Supabase/data foundation
3. Planner
4. Habits
5. Notes
6. Documents
7. Work
8. Travel
9. Sport
10. Nutrition
11. Goals
12. QA regression
13. Integration/refactor

## Tasks

### 001 — Repository audit

Status: TODO  
Agent: orchestrator_agent  
Goal: Identify routes, modules, mock data, interactions and implementation gaps.

### 002 — Supabase foundation

Status: TODO  
Agent: supabase_data_agent  
Goal: Create or validate shared schema, RLS, migrations and data access conventions.

### 003 — Planner implementation

Status: TODO  
Agent: planner_agent  
Goal: Implement task/calendar/quick-add/task-detail/recurrence flows.

### 004 — Habits implementation

Status: TODO  
Agent: habits_agent  
Goal: Implement habit CRUD, active state, recurrence, completion and calendar history.

### 005 — Notes implementation

Status: TODO  
Agent: notes_agent  
Goal: Implement notes CRUD, categories, tags, search and editor state.

### 006 — Documents implementation

Status: TODO  
Agent: documents_agent  
Goal: Implement documents CRUD, metadata, categories and file storage if present.

### 007 — Work implementation

Status: TODO  
Agent: work_agent  
Goal: Implement projects, tasks, nested subtasks, statuses, notes and links.

### 008 — Travel implementation

Status: TODO  
Agent: travel_agent  
Goal: Implement trips, itinerary, lodging, transport, packing, documents, budget and notes.

### 009 — Sport implementation

Status: TODO  
Agent: sport_agent  
Goal: Implement sport sessions, templates, exercises, sets, history and measurements.

### 010 — Nutrition implementation

Status: TODO  
Agent: nutrition_agent  
Goal: Implement food entries, meals, macros, water and weight/measurement tracking.

### 011 — Goals implementation

Status: TODO  
Agent: goals_agent  
Goal: Implement goals, milestones and progress.

### 012 — QA regression

Status: TODO  
Agent: qa_agent  
Goal: Verify build, lint, behavior, Supabase integration and UI consistency.

### 013 — Integration/refactor

Status: TODO  
Agent: integration_agent  
Goal: Deduplicate shared patterns after module implementation.
'@

Write-Utf8File "docs\agent-workflow\06_QA_CHECKLIST.md" @'
# Rootine OS — QA Checklist

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
'@

Write-Utf8File "docs\agent-workflow\07_AGENT_REPORT_TEMPLATE.md" @'
# Rootine OS — Agent Report Template

Use this format at the end of every agent task.

## Scope completed

Describe what was implemented or reviewed.

## Files changed

List important changed files.

## Database changes

List:

- migrations
- tables
- columns
- policies
- indexes
- storage buckets

If no database changes were made, write: None.

## Functional changes

List user-facing functionality added or changed.

## UI/design changes

List any visual changes.

Confirm whether Graphite Cool Ice v3 was preserved.

## Tests/checks run

Include exact commands:

- npm run lint
- npm run build
- npm run test

Describe results.

## Known issues

List issues that remain.

## Decisions needed

List any product or technical decisions needed from the user.

## Suggested next task

Recommend the next task/agent.
'@

Write-Utf8File "docs\agent-workflow\modules\planner.md" @'
# Module Spec — Planner / Start

## Goal

Implement the main planning experience: tasks, calendar interactions, quick add, task details and recurrence.

## Required functionality

- Task list.
- Calendar day selection.
- Add task from calendar.
- Add task from quick input.
- Open task details.
- Edit task.
- Delete/archive task.
- Change status:
  - planned
  - in progress
  - completed
  - cancelled/archived if needed
- Set date.
- Set time.
- Set priority.
- Optional description.
- Recurring tasks.
- Planned / active / completed filtering if visible in UI.

## Graphite Cool Ice v3 rules

- Planner should focus on tasks, habits and calendar.
- Prefer left panel for Tasks + Habits and right panel for Calendar if current layout allows it.
- Calendar cells should use surface-calendar.
- Selected day should use subtle ice border, not full bright fill.
- Task rows should be compact and calm.
- Habit tiles should be compact and text-based, not icon-heavy.

## Important UX rules

- Calendar and task list should remain synchronized.
- Task details should not hide quick-add flow unless the UI explicitly requires it.
- If a detailed window opens from a task/calendar action, all save/cancel/delete actions must work.
- Do not redesign the existing planner layout.

## Data needs

Potential tables:

- tasks
- task_recurrence_rules
- task_instances

## Acceptance criteria

- User can create a task.
- User can edit a task.
- User can complete a task.
- User can delete/archive a task.
- User can refresh the page and still see saved tasks.
- Calendar state matches task state.
- Build/lint pass or issues are documented.
'@

Write-Utf8File "docs\agent-workflow\modules\habits.md" @'
# Module Spec — Habits

## Goal

Implement a simple, practical habit tracker with CRUD, active visibility, recurrence and completion history.

## Required functionality

- List all habits.
- Add habit.
- Edit habit.
- Delete/archive habit.
- Active/inactive checkbox.
- Pause/stop habit.
- Configure recurrence:
  - selected days of week
  - every X weeks
  - every X months
  - specific time
  - start date
  - optional end date
- Mark habit as completed.
- Show completion history on calendar after selecting a habit.
- Show active habits in the main overview if this UI exists.

## Out of scope unless already visible

- Advanced KPI analytics.
- Complex streak dashboards.
- Overloaded charts.

## Graphite Cool Ice v3 rules

- Habit tiles should be compact.
- Use graphite elevated cards.
- Completion should use status-success.
- Active or selected habit can use subtle ice border.
- Avoid large colorful habit cards.
- Avoid icon overload.

## Data needs

Potential tables:

- habits
- habit_recurrence_rules
- habit_completions
- habit_pauses

## Acceptance criteria

- User can create a habit.
- User can edit a habit.
- User can archive/delete a habit.
- User can activate/deactivate a habit.
- User can pause a habit.
- User can define recurrence.
- User can mark completion.
- Completion history persists.
- Active habits appear where expected.
'@

Write-Utf8File "docs\agent-workflow\modules\notes.md" @'
# Module Spec — Notes

## Goal

Implement a clean notes module with categories, search and editing.

## Required functionality

- List notes.
- Create note.
- Edit note.
- Delete/archive note.
- Select active note.
- Search notes.
- Filter by category.
- Add/edit categories if UI supports it.
- Tags if UI supports them.
- Large editor/details view if UI supports it.

## UX rules

- Keep the module simple.
- Do not overload the overview.
- Active note should be clearly selected.
- Empty state should encourage creating the first note.

## Graphite Cool Ice v3 rules

- Notes should be quiet and readable.
- Note cards use surface-raised with subtle border.
- Pinned/active notes can use subtle ice border.
- Long-form editor may use slightly lighter content well.
- Do not make note cards colorful.

## Data needs

Potential tables:

- notes
- note_categories
- note_tags
- note_tag_links

## Acceptance criteria

- Notes persist after refresh.
- Search/filter works.
- Editor saves changes.
- Delete/archive works.
- Empty/loading/error states exist.
'@

Write-Utf8File "docs\agent-workflow\modules\documents.md" @'
# Module Spec — Documents

## Goal

Implement document tracking: metadata, categories, lifecycle states and file storage if present.

## Required functionality

- List documents.
- Add document.
- Edit document.
- Delete/archive document.
- Categorize document.
- Add expiration date if UI supports it.
- Add notes if UI supports it.
- Upload file if the UI already has upload flow.
- Open/download file if storage is implemented.

## Graphite Cool Ice v3 rules

- Documents should feel archive-like, clean and trustworthy.
- Use folders, document cards, expiry dates and file type badges.
- Do not make this module playful.
- Use warning for expiring documents.
- Use danger only for missing/expired critical items.
- Use calm graphite surfaces.

## Data needs

Potential tables:

- documents
- document_categories
- document_files

Potential storage:

- Supabase Storage bucket for user documents.

## Security rules

- Do not expose documents across users.
- Use RLS.
- Do not store secrets in client code.

## Acceptance criteria

- User can create a document record.
- User can edit metadata.
- User can archive/delete.
- User can persist and retrieve records.
- File behavior works if present in UI.
'@

Write-Utf8File "docs\agent-workflow\modules\work.md" @'
# Module Spec — Work

## Goal

Implement a practical work/project/task system similar to a simplified Asana.

## Required functionality

- Companies/workspaces if UI supports them.
- Projects.
- Tasks.
- Nested subtasks.
- Task statuses.
- Deadlines.
- Notes per task.
- Links per task/project if UI supports them.
- Active selected task/project.
- Filters if visible.

## Nested subtasks

Use parent_task_id where possible.

Do not attempt infinite UI recursion if the current UI cannot support it safely.

Implement the data model in a way that can support nested subtasks.

## Graphite Cool Ice v3 rules

- Work should look professional, not colorful.
- Statuses should be chips, not large colored blocks.
- Kanban columns use surface-raised.
- Task cards use surface-elevated.
- In progress uses accent-ice.
- Done uses success.
- Blocked uses warning.
- Urgent uses hot very rarely.

## Data needs

Potential tables:

- work_companies
- work_projects
- work_tasks
- work_task_notes
- work_links

## Acceptance criteria

- User can create projects.
- User can create tasks.
- User can create subtasks.
- User can change statuses.
- User can edit/delete/archive work items.
- Data persists after refresh.
'@

Write-Utf8File "docs\agent-workflow\modules\travel.md" @'
# Module Spec — Travel

## Goal

Implement the travel module as a structured trip workspace.

## Required sections

- Trips.
- Plan / itinerary.
- Lodging.
- Transport.
- Packing.
- Documents.
- Budget.
- Notes.

## Required functionality

- Create trip.
- Edit trip.
- Archive/delete trip.
- Trip status:
  - planned
  - ongoing
  - completed
- Add itinerary item.
- Add lodging item.
- Add transport item.
- Add packing item.
- Add travel document metadata.
- Add budget item.
- Add travel note.

## Graphite Cool Ice v3 rules

- Travel should use trip folders.
- Use accent-teal or accent-ice for travel states.
- Avoid over-coloring maps or imagery.
- Trip cards should remain graphite.
- Budget, packing and dates should use small badges/status indicators.

## UX rules

- Do not overload the overview.
- Tabs/buttons must work.
- Keep details contextual.

## Data needs

Potential tables:

- trips
- trip_itinerary_items
- trip_lodging
- trip_transport
- trip_packing_items
- trip_documents
- trip_budget_items
- trip_notes

## Acceptance criteria

- User can create and manage trips.
- Each visible travel tab works.
- Data persists after refresh.
- Empty/loading/error states exist.
'@

Write-Utf8File "docs\agent-workflow\modules\sport.md" @'
# Module Spec — Sport

## Goal

Implement sport tracking: sessions, templates, exercises, sets, history and measurements.

## Required functionality

Depending on visible UI:

- Sport dashboard.
- Start workout/session.
- Training templates.
- Exercise list.
- Session exercises.
- Sets:
  - reps
  - weight
  - rest
  - RIR
  - notes
- Training history.
- Measurements.
- Sport-specific tabs.
- Pain/comments if UI supports it.

## Graphite Cool Ice v3 rules

- Sport should use one consolidated panel where possible.
- Avoid too many disconnected tabs.
- Active session should stay hidden until user starts workout.
- Current set uses ice border.
- Completed sets use success.
- Rest timer uses cool ice accent.
- Do not overcomplicate analytics.
- Avoid rainbow charts.

## UX rules

- Keep workout flow fast.
- Preserve current UI.
- Checking a set should start rest timer if timer exists.
- Timer controls should include pause/resume/add time/skip if visible or already planned.

## Data needs

Potential tables:

- sport_sessions
- sport_templates
- sport_exercises
- sport_session_exercises
- sport_sets
- body_measurements

## Acceptance criteria

- User can start a session.
- User can add exercise/set data.
- User can save session.
- User can view history.
- Data persists after refresh.
'@

Write-Utf8File "docs\agent-workflow\modules\nutrition.md" @'
# Module Spec — Nutrition

## Goal

Implement nutrition tracking: meals, food entries, calories, macros, water and body metrics if visible.

## Required functionality

- Add food entry.
- Edit food entry.
- Delete food entry.
- Assign entry to meal.
- Track calories.
- Track protein/carbs/fat.
- Daily summary.
- Water tracker.
- Body weight/measurements if visible.
- Search/filter if visible.

## Calculation rules

- Keep calculations deterministic.
- Store base values clearly:
  - kcal
  - protein
  - carbs
  - fat
  - amount
  - unit
- Avoid hidden magic calculations.

## Graphite Cool Ice v3 rules

- Diet should be calm, clean and data-oriented.
- Avoid large colorful macro panels.
- Use subtle rings/bars.
- Protein: accent-ice.
- Carbs: status-warning.
- Fat: accent-special.
- Water: accent-teal.

## Data needs

Potential tables:

- nutrition_days
- meals
- food_entries
- water_entries
- body_weight_entries

## Acceptance criteria

- Food entries persist.
- Daily summary updates correctly.
- Water tracker persists.
- Edit/delete works.
- Empty/loading/error states exist.
'@

Write-Utf8File "docs\agent-workflow\modules\goals.md" @'
# Module Spec — Goals

## Goal

Implement goal tracking with milestones and progress.

## Required functionality

- List goals.
- Create goal.
- Edit goal.
- Archive/delete goal.
- Goal status.
- Milestones if visible.
- Progress entries if visible.
- Deadline if visible.
- Notes if visible.

## Graphite Cool Ice v3 rules

- Goals should use folder-like long-term goal structures.
- Avoid large KPI blocks.
- Progress uses subtle ice bars/rings.
- Important milestones can use accent-special.
- Avoid hot pink unless truly urgent/special.

## Data needs

Potential tables:

- goals
- goal_milestones
- goal_progress_entries

## Acceptance criteria

- User can create a goal.
- User can update progress.
- User can archive/delete.
- Data persists after refresh.
'@

Write-CodexAgent `
    -File "orchestrator_agent.toml" `
    -Name "orchestrator_agent" `
    -Description "Lead engineer and product orchestrator for Rootine OS. Audits repo, creates implementation plans, divides work between module agents, and prevents conflicts." `
    -SandboxMode "read-only" `
    -Instructions @'
You are the Lead Engineer / Orchestrator for Rootine OS.

Your job:
- audit the repository;
- identify routes, pages, components, hooks, services, mock data and broken interactions;
- create implementation backlog per module;
- define dependencies between modules;
- prevent file ownership conflicts;
- write clear tasks for module agents;
- do not implement code unless explicitly asked.

Always read:
- AGENTS.md
- docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md
- docs/agent-workflow/01_PRODUCT_RULES.md
- docs/agent-workflow/02_ARCHITECTURE.md
- docs/agent-workflow/03_SUPABASE_SCHEMA.md
- docs/agent-workflow/04_MODULE_OWNERSHIP.md

Output:
- module map;
- missing functionality;
- implementation order;
- branch/worktree plan;
- risks;
- acceptance criteria;
- list of agents that should handle each workstream.
'@

Write-CodexAgent `
    -File "supabase_data_agent.toml" `
    -Name "supabase_data_agent" `
    -Description "Supabase and data model agent for Rootine OS. Designs tables, relations, RLS, migrations and data access patterns." `
    -Instructions @'
You are the Supabase/Data Agent for Rootine OS.

Your job:
- design and implement database schema;
- create Supabase migrations;
- define user_id ownership;
- define RLS policies;
- design indexes;
- design enums;
- distinguish active, archived, paused and deleted states;
- document schema in docs/agent-workflow/03_SUPABASE_SCHEMA.md.

Do not redesign UI.

Before implementation:
- inspect current Supabase setup;
- inspect existing services/hooks/types;
- check whether tables already exist.

After implementation:
- run lint/build/tests if available;
- report all schema changes and migration files.

Always preserve Graphite Cool Ice v3 if any UI-related change is needed.
'@

Write-CodexAgent `
    -File "planner_agent.toml" `
    -Name "planner_agent" `
    -Description "Implementation agent for Planner/Start module: tasks, calendar, quick add, task details and recurring task behavior." `
    -Instructions @'
You are the Planner Agent for Rootine OS.

Scope:
- planner/start page;
- tasks;
- calendar interactions;
- quick add;
- task details modal/drawer;
- recurring tasks;
- planned/in-progress/completed task states;
- integration with active habits if already defined.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/planner.md;
- preserve existing UI;
- implement all visible interactions;
- use Supabase;
- remove mock data from final flows;
- implement loading/error/empty states;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/planner.md.

Design:
- use graphite surfaces;
- use ice only for selected/focused/primary states;
- avoid large blue panels;
- calendar cells should remain graphite;
- selected day uses subtle ice border/tint.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "habits_agent.toml" `
    -Name "habits_agent" `
    -Description "Implementation agent for Habits module: CRUD, active state, pause, recurrence and completion history." `
    -Instructions @'
You are the Habits Agent for Rootine OS.

Scope:
- habits list;
- add habit;
- edit habit;
- delete/archive habit;
- active/inactive checkbox;
- pause/stop habit;
- recurrence by days of week;
- recurrence every X weeks/months;
- specific time;
- completion tracking;
- calendar history after selecting a habit;
- visibility of active habits in the main overview.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/habits.md;
- preserve existing UI;
- implement all visible interactions;
- use Supabase;
- no fake final data;
- include validation and empty/loading/error states;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/habits.md.

Design:
- compact habit tiles;
- no overloaded KPI dashboard;
- completion uses success green;
- active/selected uses subtle ice border;
- no large cyan/blue habit panels.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "notes_agent.toml" `
    -Name "notes_agent" `
    -Description "Implementation agent for Notes module: notes CRUD, categories, tags, search, editor and active note state." `
    -Instructions @'
You are the Notes Agent for Rootine OS.

Scope:
- notes list;
- create note;
- edit note;
- delete/archive note;
- categories;
- tags;
- search/filter;
- active selected note;
- large note editor/details view;
- note metadata.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/notes.md;
- preserve existing UI;
- implement all visible interactions;
- use Supabase;
- avoid overengineering;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/notes.md.

Design:
- quiet and readable;
- graphite note cards;
- subtle ice for active/pinned states;
- no colorful note grid;
- editor remains calm and focused.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "documents_agent.toml" `
    -Name "documents_agent" `
    -Description "Implementation agent for Documents module: document records, categories, metadata, storage and lifecycle states." `
    -Instructions @'
You are the Documents Agent for Rootine OS.

Scope:
- document list;
- add document;
- edit document metadata;
- delete/archive document;
- categories;
- expiration dates;
- reminders if existing UI supports them;
- file upload/download if Supabase Storage is present;
- document preview/open action where feasible.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/documents.md;
- preserve existing UI;
- use Supabase and Supabase Storage where appropriate;
- do not store secrets;
- implement loading/error/empty states;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/documents.md.

Design:
- archive-like, clean and trustworthy;
- graphite surfaces;
- subtle file type badges;
- warning for expiry;
- danger only for critical issues.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "work_agent.toml" `
    -Name "work_agent" `
    -Description "Implementation agent for Work module: companies, projects, tasks, nested subtasks, statuses, notes and deadlines." `
    -Instructions @'
You are the Work Agent for Rootine OS.

Scope:
- companies/workspaces if present;
- projects;
- tasks;
- nested subtasks if existing architecture allows it;
- statuses;
- deadlines;
- task notes;
- links;
- filters;
- active selected task/project.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/work.md;
- preserve existing UI;
- use Supabase;
- model nested subtasks safely with parent_task_id;
- avoid hard delete unless explicitly required;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/work.md.

Design:
- professional project-management feel;
- use chips for statuses;
- no large colorful kanban columns;
- in progress uses accent-ice;
- blocked uses warning;
- done uses success;
- urgent uses hot rarely.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "travel_agent.toml" `
    -Name "travel_agent" `
    -Description "Implementation agent for Travel module: trips, plan, lodging, transport, packing, documents, budget and notes." `
    -Instructions @'
You are the Travel Agent for Rootine OS.

Scope:
- trip list;
- trip details;
- plan/itinerary;
- lodging;
- transport;
- packing;
- travel documents;
- travel budget;
- travel notes;
- statuses such as planned/ongoing/completed.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/travel.md;
- preserve existing UI;
- use Supabase;
- avoid overloaded dashboard logic;
- every visible tab/button must work;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/travel.md.

Design:
- trip folders;
- graphite cards;
- teal/ice for travel states;
- no overcolored maps;
- budget/packing/dates as subtle badges.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "sport_agent.toml" `
    -Name "sport_agent" `
    -Description "Implementation agent for Sport module: training sessions, templates, exercises, sets, history, measurements and analysis." `
    -Instructions @'
You are the Sport Agent for Rootine OS.

Scope:
- sport dashboard;
- training templates;
- start workout/session;
- exercises;
- sets/reps/weight/rest/RIR;
- pain/comments if UI supports it;
- training history;
- measurements;
- sport-specific tabs;
- analysis views if already present in UI.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/sport.md;
- preserve existing UI;
- use Supabase;
- do not redesign analytics;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/sport.md.

Design:
- one consolidated sport panel where feasible;
- workout cards use elevated graphite;
- current set uses ice border;
- completed sets use success;
- rest timer uses cool ice;
- charts use max 1–3 colors.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "nutrition_agent.toml" `
    -Name "nutrition_agent" `
    -Description "Implementation agent for Nutrition module: meals, food entries, calories, macros, water and body metrics." `
    -Instructions @'
You are the Nutrition Agent for Rootine OS.

Scope:
- food entries;
- meals;
- calories;
- protein/carbs/fat;
- daily summary;
- water tracker;
- body weight/measurements if present;
- search/add/edit/delete flows.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/nutrition.md;
- preserve existing UI;
- use Supabase;
- keep calculations transparent and deterministic;
- do not use fake final data;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/nutrition.md.

Design:
- calm and data-oriented;
- no large colorful macro panels;
- protein uses ice;
- carbs use warning;
- fat uses special violet;
- water uses teal.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "goals_agent.toml" `
    -Name "goals_agent" `
    -Description "Implementation agent for Goals module: goals, milestones, progress, status and deadlines." `
    -Instructions @'
You are the Goals Agent for Rootine OS.

Scope:
- goals list;
- add goal;
- edit goal;
- archive/delete goal;
- milestones;
- progress entries;
- status;
- deadline;
- notes if present.

Rules:
- read AGENTS.md;
- read docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md;
- read docs/agent-workflow/modules/goals.md;
- preserve existing UI;
- use Supabase;
- keep goal tracking simple and practical;
- do not edit unrelated modules;
- update docs/agent-workflow/modules/goals.md.

Design:
- folder-like goal structures;
- no big KPI blocks;
- progress uses subtle ice bars/rings;
- special milestones can use violet;
- hot pink only for rare urgent/special cases.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-CodexAgent `
    -File "qa_agent.toml" `
    -Name "qa_agent" `
    -Description "Read-only QA agent for checking functionality, regressions, UI consistency, build, lint and acceptance criteria." `
    -SandboxMode "read-only" `
    -Instructions @'
You are the QA Agent for Rootine OS.

Your job:
- review the current branch against main;
- check whether the implementation matches AGENTS.md and module specs;
- check if every visible interaction works;
- check loading, empty, error and success states;
- check Supabase integration assumptions;
- check for regressions;
- check UI consistency with Graphite Cool Ice v3;
- do not make code changes unless explicitly asked.

Always read:
- AGENTS.md
- docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md
- docs/agent-workflow/06_QA_CHECKLIST.md

Output:
- PASS/FAIL;
- issues by severity;
- reproduction steps;
- affected files;
- suggested fix;
- whether the branch is merge-ready.
'@

Write-CodexAgent `
    -File "integration_agent.toml" `
    -Name "integration_agent" `
    -Description "Integration and refactor agent for unifying shared hooks, services, types, components and module boundaries after feature branches." `
    -Instructions @'
You are the Integration/Refactor Agent for Rootine OS.

Your job:
- inspect recently implemented modules;
- find duplicated hooks, services, types and UI patterns;
- extract reusable code only where it reduces complexity;
- preserve business behavior;
- preserve UI;
- avoid broad rewrites;
- update docs if shared architecture changes.

Always read:
- AGENTS.md
- docs/agent-workflow/00_GRAPHITE_COOL_ICE_V3.md
- docs/agent-workflow/02_ARCHITECTURE.md
- docs/agent-workflow/04_MODULE_OWNERSHIP.md

Do not:
- redesign UI;
- change behavior without explaining why;
- change database schema unless necessary and documented;
- replace Graphite Cool Ice v3 with a generic UI style.

Final checks:
- npm run lint;
- npm run build;
- npm run test if available.

Final report:
Use docs/agent-workflow/07_AGENT_REPORT_TEMPLATE.md.
'@

Write-Host ""
Write-Host "DONE: Codex agent workflow files created with Graphite Cool Ice v3 design system."
Write-Host ""
Write-Host "Created:"
Write-Host "- AGENTS.md"
Write-Host "- .codex/config.toml"
Write-Host "- .codex/agents/*.toml"
Write-Host "- docs/agent-workflow/*.md"
Write-Host "- docs/agent-workflow/modules/*.md"
Write-Host ""
Write-Host "Next commands:"
Write-Host "git status"
Write-Host "git add AGENTS.md .codex docs/agent-workflow setup-codex-agents.ps1"
Write-Host "git commit -m `"chore: add Codex agent workflow and design system`""
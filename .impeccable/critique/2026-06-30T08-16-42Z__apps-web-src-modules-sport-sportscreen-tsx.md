---
target: apps/web/src/modules/sport/SportScreen.tsx
score: 23
p0: 0
p1: 4
p2: 2
agentA: 019f178e-d8d8-7d23-98a2-0d0b5822bd8b
agentB: 019f178f-3969-75b2-a264-2bbebc480dff
detectorTotal: 0
mode: dual-agent
timestamp: 2026-06-30T08-16-42Z
slug: apps-web-src-modules-sport-sportscreen-tsx
---
Method: dual-agent (A: 019f178e-d8d8-7d23-98a2-0d0b5822bd8b · B: 019f178f-3969-75b2-a264-2bbebc480dff)

## Design Health Score

| Heuristic | Score | Note |
| --- | ---: | --- |
| Visibility/status | 2/4 | Active training exists, but saves, moves and destructive actions do not feel sufficiently acknowledged. |
| Real-world fit | 3/4 | Training language is mostly natural; cycle/block/progression layer gets dense. |
| Control/freedom | 2/4 | Modals close, but drag moves, deletes and session exits need stronger recovery. |
| Consistency/standards | 3/4 | Good shared surface language; some clickable divs and icon-only controls weaken it. |
| Error prevention | 2/4 | Template validation helps; records/session/cycle actions need safeguards. |
| Recognition over recall | 2/4 | MoreMenu and small icon actions hide frequent operations. |
| Efficiency | 2/4 | Templates, copy and recurrence help, but no visible keyboard/bulk path. |
| Minimalism | 2/4 | Coherent but too many equal-weight panels compete. |
| Error recovery | 2/4 | Toasts exist, but accidental high-impact changes remain thin. |
| Help/context | 1/4 | Empty states exist; complex training planning needs stronger guidance. |

Total: 23/40. Acceptable, but not yet premium. The domain model is strong; the screen needs governed hierarchy.

## Anti-Patterns Verdict

Moderate AI-slop risk. Not because it is visually off-brand: graphite and ice accents are mostly intact. The risk is structural: the screen reads like a generic productivity dashboard with training terms added, rather than a focused sport cockpit.

Detector result: CLI detector returned 0 findings for `SportScreen.tsx` and components. Browser overlay did report 7 issues, but it ran against the auth screen, so those findings are not attributable to Sport. A parent QA-auth visual pass confirmed the actual Sport screen layout on desktop and mobile.

## What Works

- Strong feature base: workouts, templates, cycles, progression, history, records and active session mode.
- Rootine visual language is present: graphite panels, cold blue accents, restrained fitness tone.
- Active session mode is the right product instinct: when training starts, the interface should become focused and stateful.
- The weekly board has a useful mental model and scales better than a purely list-based planner.

## Priority Issues

1. P1 — Equal-weight dashboard hierarchy. Cycle banner, week board, templates, history and records all compete. On desktop, the week board is large but empty; the bottom three panels feel equally important even when they are secondary. Fix with `$impeccable layout apps/web/src/modules/sport/SportScreen.tsx`.

2. P1 — Mobile starts with administration before training. Three CTAs, cycle empty state and week navigation consume the first viewport before the user reaches today’s training content. Fix with `$impeccable adapt Sport tab`.

3. P1 — Block planning flow is overloaded. Creating a block exposes goal, dates, weekday rhythm, conflicts, templates, progression and duration too early. Fix with `$impeccable shape Sport block planning flow`.

4. P1 — Interaction accessibility is brittle. There are clickable rows/divs, title-only icon buttons, drag-biased movement, hidden date input patterns and tiny day add buttons. Fix with `$impeccable audit apps/web/src/modules/sport`.

5. P2 — Missing training intelligence layer. The screen stores many objects but does not clearly answer: what should I do next, how is the cycle going, what changed recently, what deserves attention? Fix with `$impeccable bolder apps/web/src/modules/sport/SportScreen.tsx`.

6. P2 — Destructive and high-impact changes need more recovery. Delete, end/cancel session, archive and repeated workout changes need clearer confirmation, scope labels, undo or post-action feedback. Fix with `$impeccable harden apps/web/src/modules/sport`.

## Persona Red Flags

Alex, power user: frequent actions are hidden behind MoreMenu and there is no obvious keyboard/bulk workflow.

Sam, accessibility-sensitive user: icon-only controls, tiny add targets and drag assumptions create friction.

Rootine owner: the screen says “training database” more than “private training cockpit.” It needs one stronger spine.

## Recommended Direction

Make Sport answer one primary question in three seconds: “What is my next training move?” Then let cycle, templates, history and records orbit that answer instead of competing with it.

Recommended command order:
1. `$impeccable layout apps/web/src/modules/sport/SportScreen.tsx`
2. `$impeccable adapt Sport tab`
3. `$impeccable shape Sport block planning flow`
4. `$impeccable harden apps/web/src/modules/sport`

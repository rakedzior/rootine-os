---
target: Sport tab
total_score: 24
p0_count: 0
p1_count: 2
timestamp: 2026-06-30T14-14-52Z
slug: apps-web-src-modules-sport-sportscreen-tsx
---
Method: dual-agent (A: 019f18dc-2986-7a43-bbb3-5e4be1456023 · B: 019f18dc-7a25-73d0-98c8-9b56a6f599c1)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Status exists, but async create/move/complete actions need clearer in-progress and success feedback. |
| 2 | Match System / Real World | 3 | Training concepts fit, but some status/microcopy still feels implementation-led. |
| 3 | User Control and Freedom | 3 | Edit/delete/scope flows are mostly safe; undo and keyboard alternatives are still thin. |
| 4 | Consistency and Standards | 2 | Visual system is coherent, but Sport-specific CSS override layers create responsive contradictions. |
| 5 | Error Prevention | 2 | Destructive confirmations exist; planning conflicts and recurring changes need clearer previews. |
| 6 | Recognition Rather Than Recall | 2 | Main actions are visible, but too many similar add paths make the first decision harder. |
| 7 | Flexibility and Efficiency | 3 | Templates, duplicate, drag/drop, and session start are useful power paths. |
| 8 | Aesthetic and Minimalist Design | 3 | Strong graphite cockpit, but repeated empty columns and panels add noise. |
| 9 | Error Recovery | 2 | Mutation failure and recovery feedback are not consistently visible at page level. |
| 10 | Help and Documentation | 2 | Empty states help, but cycles/blocks/progression need inline explanation or preview. |
| **Total** | | **24/40** | **Acceptable: strong foundation, significant UX/layout fixes needed.** |

## Anti-Patterns Verdict

**Does it look AI-generated?** Not immediately. The graphite/ice system has a real product identity and avoids generic SaaS beige/purple sludge. The risk is subtler: it feels like a dashboard assembled by repeated panel patterns rather than a training cockpit shaped around one primary training decision.

**LLM assessment:** The biggest AI-slop tell is structural sameness: boxed panel after boxed panel, seven repeated empty day columns, many `+` affordances, and a hierarchy where the largest object is often an empty calendar. Color and type are mostly on-brand; composition and state strategy are weaker.

**Deterministic scan:** CLI detector on `apps/web/src/modules/sport/SportScreen.tsx` returned exit code `0` and `[]`, so no source-file findings.

**Visual overlay evidence:** Browser overlay injection succeeded in fallback Playwright, but not in a user-visible Human tab because the in-app browser bridge failed before tab creation (`missing field sandboxPolicy`). Overlay console reported 57 findings: `ai-color-palette` 29, `low-contrast` 14, `gpt-thin-border-wide-shadow` 14, `nested-cards` 6, `dark-glow` 2, `cramped-padding` 1, `overused-font` 1, `repeating-stripes-gradient` 1. Likely false positives: graphite/ice palette and Inter usage are intentional product-system choices; some low-contrast hits appear to sample gradient/ice areas incorrectly. Still worth reviewing: nested cards, border+shadow accumulation, and repeated empty-state panels.

## Overall Impression

Sport has the right atmosphere and enough real product mechanics to feel useful: sessions, templates, cycles, status changes, drag/drop, history, goals. But the first screen currently answers “what does the week grid look like?” more loudly than “what training should I do next?” The strongest opportunity is to make Sport training-first, with the calendar serving planning instead of dominating the experience.

## What's Working

1. **The register is close to Rootine OS.** Dark graphite surfaces, restrained ice accents, and compact controls feel private, focused, and premium.
2. **The feature model has substance.** Start session, edit, duplicate, move, complete, template, cycle, history, and goals make this more than a static mockup.
3. **Some empty-state copy lands well.** “Zaplanuj dzisiejszy ruch” and “Brak aktywnego cyklu treningowego” feel personal rather than corporate.

## Priority Issues

**[P1] Mobile layout is breaking under full-height rules**

**Why it matters:** Assessment B found on 390px mobile that `.sport-dashboard-left` rendered at `h=0`, `.sport-today-card` at only `46px`, and content visually collided with the week section. This turns the primary mobile path into a layout failure, not just a dense screen.

**Fix:** Remove desktop full-height behavior from mobile/tablet. At mobile breakpoints, make `.sport-dashboard-layout` normal document flow: `height: auto`, `grid-template-rows: none/auto`, no inherited `minmax(0, 1fr)` pressure, and week board as a contained horizontal section.

**Suggested command:** `$impeccable adapt Sport tab`

**[P1] The primary hierarchy is calendar-first, not training-first**

**Why it matters:** The largest first-screen object is often seven empty columns. For Sport, the main question should be “what is next and what state is my training block in?” not “what can I drop into each day?”

**Fix:** Promote Today/Next Training as the command object, make the week board adaptive: compact when empty or low-data, expanded when there is a real plan. Let cycle and goals act as supporting state, not competing panels.

**Suggested command:** `$impeccable layout Sport tab`

**[P2] Duplicate add paths inflate cognitive load**

**Why it matters:** The user sees `+ Nowy trening`, `+ Dodaj trening`, “Wybierz szablon”, per-day `+`, “+ Zaplanuj cykl treningowy”, and `+ Dodaj szablon` together. That is too many ways to start before the product clarifies the object being created.

**Fix:** Create one primary “Dodaj trening” entry point that routes inside the drawer. Demote per-day adds to contextual affordances, and keep template/cycle creation as setup utilities.

**Suggested command:** `$impeccable distill Sport tab`

**[P2] Serious training actions need stronger feedback**

**Why it matters:** Moving, completing, creating, copying, and starting sessions affect personal training records. Silent mutation side effects reduce trust.

**Fix:** Add explicit feedback: saving state for status changes, ghost/drop confirmation when moving workouts, loading state when starting a session, and toast/inline confirmation for copy/delete.

**Suggested command:** `$impeccable harden Sport tab`

**[P3] Microcopy and accessibility labels need a polish pass**

**Why it matters:** The UI is Polish, but some labels are implementation-shaped or ASCII-only, such as “Szczegoly treningu”. Internal status names should not leak into a premium personal OS surface.

**Fix:** Normalize status language and ARIA labels: `Do zrobienia`, `W toku`, `Zrobione`, `Pominięte`; restore Polish diacritics in labels; add tooltips/labels for icon-only controls where needed.

**Suggested command:** `$impeccable clarify Sport tab`

## Persona Red Flags

**Alex, power user:** Templates, duplication, drag/drop, and session start are promising. Red flags: no visible keyboard accelerators; too many add buttons slow the expert path; drag/drop planning is pointer-first.

**Sam, accessibility-dependent user:** Icon buttons mostly have labels, but drag/drop lacks an obvious keyboard alternative. The hidden date input behind an icon may be awkward for screen reader and keyboard users. Today/selected/drop states rely heavily on color and position.

**Casey, mobile user:** The current mobile layout evidence is the biggest issue. The Today stack can collapse/overlap, the week scroller dominates early, and primary actions are top-heavy rather than thumb-zone friendly.

**Rootine owner, repeated daily operator:** This user wants a fast private command surface. The current empty state repeatedly says “Brak treningu” and presents setup/planning utilities as equal-weight panels, so it can feel like unfinished configuration instead of a confident daily cockpit.

## Minor Observations

- `0 / 0` in weekly goals is technically true but emotionally dead. Use “Brak celu na ten tydzień” until there is a denominator.
- Repeating “Brak treningu” seven times creates visual noise. One empty-week message plus quiet day affordances would be calmer.
- The page header copy is serviceable but generic; Sport could sound more operational and stateful.
- The CSS has many generations of Sport overrides in `rootine-system.css`, increasing regression risk and making responsive fixes brittle.
- Overlay findings around nested cards and border+shadow pairings align with the visual sense that the screen is becoming panel-heavy.

## Questions to Consider

- What if the first screen were “next training decision” rather than “week calendar”?
- Should templates and cycles be daily cockpit items, or setup utilities?
- Should the week board expand only once there is actual plan density?
- What should empty Sport feel like: an invitation to configure, or a calm proof that no training is planned?

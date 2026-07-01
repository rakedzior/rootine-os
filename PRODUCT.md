# PRODUCT.md

## Product

**Rootine OS**

## Category

Personal life operating system / all-in-one personal command center.

Rootine OS is not a habit toy, generic dashboard, finance app, workout app, notes app, or project management tool. It is a unified personal operating surface for managing daily life across multiple areas with one account, one design system, and one calm cockpit.

---

## Users

Rootine OS is for individuals who want to manage their whole life in one coherent place:

- work
- sport
- finance
- goals
- diet / nutrition
- notes
- travel
- household and office administration

The product is public and account-based, so anyone can sign up. First-run onboarding, sensible defaults, empty states, and progressive disclosure matter.

A new user should understand the product quickly without needing to configure everything upfront.

The core user is a returning daily power user. They open the app to orient themselves, understand what matters today, and act quickly. They are not looking for entertainment, gamification, or motivational noise. They want a calm, trustworthy cockpit for real personal data and daily decisions.

Rootine OS should support:

- desktop PWA / Windows usage
- mobile iOS usage via Capacitor
- quick glance-and-go moments
- longer planning and review sessions

The product should be **desktop-first**, because the full cockpit experience, planning, review, module management, and multi-area workflows are strongest on a larger screen.

Mobile is still critical, but should focus on fast daily actions rather than full administration.

Mobile priority flows:

1. To-do list with calendar
2. Quick meal entry
3. Starting today’s planned workout series
4. Quick note capture

---

## Product Purpose

Rootine OS is a personal “life operating system”: a single account and unified design system for nine core modules:

1. Start dashboard
2. Work
3. Sport
4. Finance
5. Goals
6. Diet / Nutrition
7. Notes
8. Travel
9. Office / Administration

The Start dashboard is the central orientation layer. It aggregates the most relevant signals from every module so the user can immediately understand what matters today:

- tasks
- calendar events
- planned training
- nutrition status
- notes
- work items
- goals
- deadlines
- travel items
- admin obligations
- key personal metrics

Each module provides depth, but the product should never feel like nine separate apps stitched together. Rootine OS should feel like one calm, coherent operating surface where every module belongs to the same system.

Deep per-user configurability is a core part of the product. Users should be able to show, hide, reorder, and simplify modules or features based on how they actually live. However, configuration should not be forced upfront. The default experience should be opinionated, clean, and immediately usable.

During onboarding, the product should ask the user which **subpages / areas** they want to use first. Full module configuration should live later in settings. This keeps onboarding lightweight while still making the product feel personally relevant from the first session.

Success means users trust Rootine OS with their real data and return to it daily because it gives them clarity, control, and continuity — one reliable surface instead of a dozen scattered apps.

---

## Product Positioning

Rootine OS should feel like:

**A focused personal cockpit for daily life.**

It should help the user answer:

1. What do I need to do today?
2. What is scheduled?
3. What needs attention?
4. What changed?
5. What should I do next?
6. Where do I go deeper?

The product should not be judged by how many features are visible at once. It should be judged by whether the user feels clearer, calmer, and more in control after opening it.

---

## Core Product Loop

The daily loop is:

1. Open Start dashboard
2. See today’s calendar and tasks
3. Understand what matters now
4. Take quick actions
5. Go deeper into a module only when needed
6. Return later without losing context

Rootine OS should optimize for repeated daily use, not one-time setup complexity.

The app should feel useful even when the user only has 30 seconds.

---

## Module Priority

The most important modules for daily value are:

1. Start
2. Work
3. Sport
4. Diet / Nutrition
5. Notes

Secondary modules:

6. Goals
7. Finance
8. Travel
9. Office / Administration

This priority should influence:

- dashboard hierarchy
- onboarding
- mobile shortcuts
- navigation emphasis
- empty states
- quick actions
- module summary prominence

The product should still feel coherent across all modules, but the core daily loop should be built around Start, Work, Sport, Diet, and Notes.

---

## Module Scope

### 1. Start Dashboard

The Start dashboard is the primary daily orientation surface.

It should answer:

- What matters today?
- What is next?
- What is overdue?
- What should I do now?
- What has changed?
- Which module needs attention?

The Start dashboard should be centered around **calendar + tasks**.

This is the primary daily orientation model.

The most important Start dashboard elements are:

1. Today’s calendar
2. Today’s tasks
3. Quick task add
4. Upcoming deadlines / next actions
5. Lightweight summaries from Sport, Diet, Notes, Work, and other modules

The Start dashboard should not begin as a generic grid of module cards. It should behave more like a practical daily command center where the user first sees their day, then the surrounding signals.

Preferred hierarchy:

- Calendar and to-do list are the center of gravity
- Other module summaries support the day view
- Quick actions should be close to the calendar/task workflow
- Secondary modules should be visible but not visually dominant

The core Start question is:

**“What do I need to do today, and what is scheduled?”**

Only after that should the dashboard answer:

**“What else needs attention across my life?”**

---

### 2. Work

The Work module supports personal work planning and project/task management.

It should help the user structure:

- companies
- projects
- tasks
- subtasks
- notes
- links
- statuses
- deadlines

It should feel more like a focused personal work cockpit than a heavy enterprise project management tool.

It should not feel like Jira, ClickUp, or a complex corporate project system.

The Work module should support practical execution:

- what is active
- what is blocked
- what is due
- what needs review
- where supporting notes or links are stored

---

### 3. Sport

The Sport module is focused on training.

Current scope:

- planned workouts
- workout templates
- today’s training
- exercise tracking
- sets
- reps
- weight
- RIR
- rest
- comments
- workout history
- training progress
- training calendar

Health, rehabilitation, sleep, symptoms, and medical tracking are not part of the core scope for now.

Future possible expansion:

- Garmin integration
- read-only training / activity sync
- better performance analysis based on external data

For now, Sport should work as a strong manual training tracker without depending on integrations.

The Sport module should be fast during workouts. It should not require excessive taps, long forms, or heavy configuration in the middle of training.

---

### 4. Finance

The Finance module is a manual personal finance tracker.

Current scope:

- manual income tracking
- manual expense tracking
- manual category tracking
- monthly overview
- recurring costs
- larger financial obligations
- simple planning and review

There should be no banking integrations in the current scope.

The product is personal-first and should avoid complex financial automation or bank connectivity at this stage.

Finance should feel useful and calm, not like accounting software.

---

### 5. Goals

The Goals module supports long-term direction, progress tracking, and personal priorities.

It should be calm and structured. It should not feel like a gamified achievement system.

Avoid:

- badges
- confetti
- streak pressure
- motivational gimmicks
- childish encouragement
- forced productivity language

Goals should help the user remember direction, not pressure them.

---

### 6. Diet / Nutrition

The Diet module supports food logging and nutrition awareness.

Positive reference: **MyFitnessPal**, especially for practical food logging, meal entry, and macro visibility.

Current scope:

- manual meal logging
- quick meal entry
- calories
- protein
- carbs
- fat
- daily summary
- reusable meals
- common foods
- simple nutrition progress

The Diet module should prioritize speed and practicality. The user should be able to add food quickly, especially on mobile.

The Diet module should feel lighter, calmer, and more premium than MyFitnessPal. It should not feel overloaded with ads, social features, promotions, or noisy health content.

---

### 7. Notes

The Notes module is for quick capture and structured personal notes.

It should support:

- fast entry
- tags or categories
- simple search
- easy retrieval
- lightweight organization

It should not become a heavy document editor.

Mobile note capture is one of the most important mobile flows.

The user should be able to open the app, add a note, and leave quickly.

---

### 8. Travel

The Travel module supports trip planning and travel organization.

It may include:

- trip folders
- plans
- flights
- hotels
- reservations
- budgets
- packing
- documents
- attractions
- maps
- notes
- post-trip costs

Travel is useful, but lower priority than Start, Work, Sport, Diet, and Notes.

It should feel like a calm travel folder, not a travel inspiration app.

---

### 9. Office / Administration

The Office / Administration module supports personal admin.

It may include:

- documents
- contracts
- insurance
- household matters
- car matters
- B2B admin
- UoP admin
- recurring obligations
- important dates
- personal records

The current name is acceptable.

It should feel practical and trustworthy, not like a cold enterprise admin panel.

---

## Brand Personality

Rootine OS should feel:

- professional
- calm
- trustworthy
- premium
- focused
- warm
- efficient
- competent

The product should behave like well-made software that respects the user’s time, attention, and data.

The emotional tone is quiet confidence, not excitement.

The daily experience should feel like a **focused cockpit**:

- fast to scan
- highly legible
- information-dense where useful
- minimal friction to act
- calm under load
- structured without feeling rigid

The “White Lotus” warm-light influence should give the interface humanity: soft warmth, restrained elegance, and premium calm.

The “Jarvis” influence should appear through clarity, precision, responsiveness, dark surfaces, modular control, and intelligent information hierarchy — not through sci-fi decoration, neon overload, or visual noise.

Rootine OS should feel advanced, but not futuristic for its own sake. It should feel like a mature personal system that helps the user stay composed and in control.

---

## Default Visual Direction

Rootine OS should use **dark mode as the default and primary identity**.

Dark mode is not an alternative theme. It is the main product identity.

The visual foundation should be **graphite-first**, supported by deep navy and muted emerald accents.

The interface should not feel:

- pure black
- neon
- cyberpunk
- cold corporate gray
- generic SaaS purple
- playful
- decorative

It should feel like a premium dark cockpit:

- calm
- focused
- dense
- trustworthy
- warm
- mature
- personal

Preferred base direction:

- charcoal and graphite as the main base
- deep navy support tones
- dark desaturated teal / emerald undertones
- muted emerald highlights used sparingly
- low-contrast layered depth
- soft atmospheric surfaces
- subtle borders
- calm contrast
- controlled accent colors

The preferred visual direction is inspired by a dark organic emerald/graphite texture:

- dark graphite foundation
- deep green-blue shadows
- muted emerald atmosphere
- soft organic depth
- subtle layering
- quiet premium mood

The emerald accent should be **subtle and controlled**.

Use emerald for:

- primary actions
- active states
- selected navigation
- positive progress
- key highlights
- small status indicators
- focused interaction states

Do not let emerald dominate the UI.

Most of the interface should remain graphite, navy, and dark neutral.

Suggested emotional tone:

**Graphite calm + muted emerald precision.**

---

## Language

The default product language is **Polish**.

English can be considered later, but the current product should be designed, written, and structured primarily for Polish users.

Copy should be:

- clear
- practical
- concise
- calm
- mature
- non-hype
- non-gamified

Avoid overly motivational language.

Good copy direction:

- “Dodaj zadanie”
- “Zaplanuj trening”
- “Dodaj posiłek”
- “Zapisz notatkę”
- “Sprawdź dzisiejszy plan”
- “Uzupełnij brakujące informacje”
- “Otwórz dzisiejszy trening”
- “Dodaj szybki wpis”

Avoid:

- “Let’s crush it!”
- “Great job!”
- “You’re on fire!”
- “Keep the streak alive!”
- “Brawo, mistrzu!”
- “Nie zatrzymuj serii!”

The copy should feel like a competent assistant, not a motivational coach.

---

## Positive References

Rootine OS should not copy other products directly, but these references are useful for product behavior.

### TickTick

Relevant for:

- to-do list
- calendar integration
- daily task planning
- fast capture
- practical recurring tasks
- clean productivity workflow

TickTick is a strong reference for the relationship between tasks and calendar.

Rootine OS should learn from TickTick’s practicality, but should feel more premium, darker, calmer, and more integrated across life modules.

### MyFitnessPal

Relevant for:

- food logging
- quick meal entry
- macro visibility
- reusable foods / meals
- practical nutrition tracking

MyFitnessPal is a useful reference for Diet / Nutrition, but Rootine OS should feel calmer, more premium, and more integrated with the rest of the life operating system.

Rootine OS should avoid the noisy, ad-heavy, commercial feel often associated with consumer nutrition apps.

---

## Anti-References

Avoid the following directions.

### Gamified or playful habit apps

Examples: Finch, Habitica.

Do not use:

- mascots
- streak confetti
- badges as motivation
- loud celebratory motion
- childlike illustrations
- overly cheerful copy
- playful rewards
- cartoon-like onboarding

Rootine OS is not a motivational toy. It is a serious personal operating system.

---

### Generic SaaS dashboard clones

Avoid default modern SaaS clichés:

- purple gradient hero cards
- generic icon-heading-text card grids
- overused glassmorphism
- startup-style hype copy
- decorative analytics widgets without clear purpose
- dashboards that look like templates
- meaningless “insight” cards

Rootine OS should not look like a generic SaaS dashboard.

---

### Cluttered life-management tools

Examples: Notion / ClickUp maximalism.

Avoid:

- everything-at-once density
- deeply nested panels on primary surfaces
- configuration overload
- too many equal-weight cards
- visual hierarchy that depends only on icons and labels
- forcing users to build their own system before getting value

The app can be powerful, but power should sit one layer down.

---

### Cold enterprise admin tools

Avoid:

- sterile gray panels
- corporate table-heavy layouts without warmth
- dense admin screens with no visual rhythm
- interfaces that feel built only for compliance or back-office work
- lifeless forms
- heavy admin chrome

Rootine OS must feel trustworthy and structured, but still personal and warm.

---

### Neon cyberpunk / sci-fi UI

Avoid:

- bright neon green
- excessive glow
- hologram effects
- fake sci-fi panels
- decorative HUD lines
- aggressive contrast
- futuristic styling without functional purpose

Rootine OS may be inspired by a cockpit, but it should not look like a movie interface.

---

## Design Direction

The line to walk:

**Dense and efficient without feeling cluttered. Warm and premium without becoming playful or decorative. Advanced without looking gimmicky. Dark and focused without becoming cold or heavy.**

The interface should use:

- strong hierarchy
- clear spatial rhythm
- subtle depth
- warm dark surfaces
- calm contrast
- reusable module patterns
- concise copy
- purposeful actions
- visible system state
- fast scanning paths

Every screen should make it obvious:

1. What matters now
2. What has changed
3. What needs action
4. Where to go deeper

The app should feel quiet, capable, and composed.

---

## Design Principles

### 1. Orient before act

Every surface should first answer:

**“What matters now?”**

Only then should it answer:

**“What can I do?”**

The Start dashboard is the model for the whole product: aggregate, prioritize, summarize, then link out.

Do not lead with raw navigation or generic feature cards when there is meaningful user data to surface.

---

### 2. Calm density

Rootine OS should show enough information to be useful without becoming visually exhausting.

Density should come from:

- good hierarchy
- clear grouping
- predictable spacing
- consistent typography
- progressive disclosure
- smart defaults

Avoid increasing density by simply adding more cards, borders, buttons, or nested panels.

---

### 3. Quiet confidence

Trust is earned through restraint.

The product should look and behave like software that can safely handle real personal data:

- tasks
- work
- finances
- training
- nutrition
- notes
- documents
- travel
- life administration

Avoid hype, gimmicks, exaggerated animations, and copy that over-promises.

The product should feel stable, composed, and dependable.

---

### 4. One coherent system

All nine modules must feel like one product.

A user should not feel that Work, Sport, Diet, Finance, Travel, and Notes were designed separately.

They should share:

- layout logic
- navigation patterns
- card structures
- typography
- spacing
- interaction states
- empty states
- action hierarchy
- data-density rules

A new module should feel inevitable, not bolted on.

---

### 5. Configurable, not overwhelming

Rootine OS should support deep customization, but complexity must be staged.

Defaults should be:

- clean
- opinionated
- useful immediately
- safe for a first-time user
- strong enough for daily use

Advanced configuration should be available one layer down through settings, module controls, and progressive disclosure.

Do not dump setup decisions in the user’s face during onboarding.

---

### 6. Signal over inventory

Do not show data just because it exists.

Prioritize data that helps the user make a decision, notice a change, or take action.

A dashboard should not become a warehouse of widgets.

Every module summary should answer one of these:

- Is anything urgent?
- Is anything overdue?
- What changed?
- What is planned next?
- What needs review?
- What is the current status?
- What is the recommended next action?

---

### 7. Fast action, slow configuration

Daily actions should be fast:

- add task
- start workout
- log meal
- add note
- check calendar
- review today
- open next work item
- mark something done

Configuration should be powerful but slower, calmer, and less prominent.

The product should optimize for repeated daily use, not one-time setup complexity.

---

### 8. Desktop depth, mobile speed

Desktop should provide the full cockpit experience:

- planning
- review
- dashboard scanning
- module management
- larger calendars
- larger task views
- cross-module context
- configuration

Mobile should prioritize fast actions:

- check today
- add task
- add meal
- start workout
- add note
- mark done
- capture quickly

Mobile should not try to expose every desktop feature with the same density.

---

### 9. Calendar and tasks anchor the day

Rootine OS is a life operating system, but the daily experience must be anchored in time and action.

The Start dashboard should not be a passive overview. It should be centered on the user’s calendar and task list, because these define what the user actually needs to do today.

Other modules should feed useful signals into this daily view, but they should not compete with the calendar/task center unless something is urgent, overdue, or directly relevant to today.

---

### 10. Dark mode is the product identity

Dark mode should not be treated as a skin or optional theme.

Rootine OS should be designed from the ground up as a dark graphite/navy product with muted emerald precision.

The dark theme must remain readable, warm, and structured.

Avoid both extremes:

- too black and harsh
- too gray and corporate

The right mood is:

**premium graphite cockpit with restrained emerald signal.**

---

## Navigation

All nine main modules should be visible in the main desktop navigation from the start:

1. Start
2. Work
3. Sport
4. Finance
5. Goals
6. Diet
7. Notes
8. Travel
9. Office

The product should not hide Finance, Travel, or Office by default on desktop.

They can be visually lower priority, but they should still be available as part of the full personal operating system.

Desktop navigation should communicate the full scope of Rootine OS immediately.

Mobile can use a more compact structure.

Mobile priority remains:

1. To-do list with calendar
2. Quick meal entry
3. Start today’s workout
4. Add note

---

## Onboarding Principles

Because Rootine OS is a public product, onboarding must make the product understandable without requiring full configuration.

Onboarding should:

- explain the product as a personal operating system
- start in Polish
- use the dark navy / graphite / emerald visual identity from the beginning
- ask which subpages / areas the user wants to use first
- avoid forcing all modules at once
- avoid long forms
- avoid bank, health, or external integration setup
- use empty states that show value and next action
- make the Start dashboard useful even with little data

The onboarding should not feel like building a Notion workspace.

It should feel like activating a useful personal system with sensible defaults.

A good first session should end with the user understanding:

- what Rootine OS is
- which areas are available
- what they can do today
- how to add their first useful data
- why they should return tomorrow

---

## Empty State Principles

Empty states matter because every public user starts with no data.

Empty states should be practical, calm, and action-oriented.

They should:

- explain what belongs in the module
- show one clear primary action
- avoid decorative filler
- avoid motivational fluff
- avoid making the product feel broken or unfinished
- offer examples where helpful

Example tone:

- “Dodaj pierwsze zadanie.”
- “Zaplanuj pierwszy trening.”
- “Dodaj pierwszy posiłek.”
- “Utwórz folder podróży.”
- “Zapisz pierwszą notatkę.”
- “Dodaj dokument, który możesz potrzebować później.”
- “Dodaj pierwszy projekt.”
- “Utwórz miesięczny przegląd finansów.”

Empty states should feel useful, not empty.

---

## Data and Integrations

Rootine OS is personal-first.

The current phase should avoid complex integrations unless they clearly support daily use.

Current direction:

- Finance is manual only
- Diet is manual / reusable-entry focused
- Sport is manual training tracking
- Garmin may be considered later
- No bank integrations for now
- No complex automation required for first release

The product should not depend on external integrations to feel valuable.

Integrations can be added later if they improve the core loop without adding noise.

---

## Accessibility & Inclusion

Formal accessibility is not the primary focus in the current phase. Shipping speed is prioritized.

Baseline usability hygiene still applies:

- avoid obvious contrast failures
- keep body text readable against dark tinted surfaces
- use reasonable interactive target sizes
- do not hide essential content behind motion
- keep core flows usable without excessive precision
- avoid tiny text for important information
- maintain clear visual states for active, hover, selected, disabled, and completed items

Full WCAG AA conformance, complete keyboard and focus coverage, and reduced-motion parity are deferred for a dedicated hardening phase.

---

## Product Success Criteria

Rootine OS succeeds if it becomes a daily orientation layer the user trusts.

The product should help the user:

- understand the day quickly
- see what matters across life areas
- reduce scattered tools and mental overhead
- act without friction
- return consistently
- configure depth without losing simplicity
- trust the system with meaningful personal data
- manage daily life from one calm cockpit

The product should not be judged by how many features are visible at once.

It should be judged by whether the user feels clearer, calmer, and more in control after opening it.

---

## Final Product Summary

Rootine OS is a dark, premium, personal-first life operating system.

It brings together Start, Work, Sport, Finance, Goals, Diet, Notes, Travel, and Office into one coherent cockpit.

The Start dashboard is anchored by calendar and tasks. Other modules feed useful signals into that daily view.

The visual identity is graphite-first, supported by deep navy and muted emerald accents.

The product should feel calm, competent, structured, warm, and trustworthy.

It should avoid gamification, generic SaaS styling, Notion-like configuration overload, cold enterprise admin patterns, and neon sci-fi visuals.

Rootine OS exists to help the user orient fast, act quickly, and stay in control of daily life.
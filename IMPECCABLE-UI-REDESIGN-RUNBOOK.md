# IMPECCABLE UI Redesign Runbook

This file is the project-local command plan for continuing the UI redesign from a phone or any Codex chat surface.

Use it like this:

1. Say: `next step of the plan`
2. Codex should open this file.
3. Codex should run the first unchecked step.
4. After finishing, Codex should update that step from `[ ]` to `[x]`.

Do not run these commands in the terminal. They are chat prompts for Codex / IMPECCABLE.

Status legend:

- `[x]` Done
- `[~]` In progress
- `[ ]` Not done / next work
- `NEXT` First recommended unfinished step

## Current Next Step

`NEXT`: Step 10, standardize buttons, inputs, forms, and action controls.

```text
/impeccable layout

Focus only on buttons, inputs, forms and action controls across the app.

Context:
The app contains many actions: adding tasks, editing items, deleting items, selecting workouts, changing statuses, opening details, saving forms and managing records. These controls must look and behave consistently.

Your task:
Standardize all button, input, form and action styles.

Please standardize:
1. Primary buttons.
2. Secondary buttons.
3. Ghost buttons.
4. Icon buttons.
5. Danger/delete buttons.
6. Success/confirm buttons.
7. Disabled buttons.
8. Button height.
9. Button padding.
10. Button radius.
11. Button typography.
12. Button hover, active and focus states.
13. Input height.
14. Input padding.
15. Input border.
16. Input focus state.
17. Placeholder styling.
18. Labels and helper text.
19. Form group spacing.
20. Inline action groups.
21. Three-button action rows.
22. Small detail/edit/delete icon actions.

Important constraints:
- Do not change business logic.
- Do not remove actions.
- Make action hierarchy clearer.
- Prefer shared components and tokens.
```

---

## Phase 0: Usage Rule

Each command should be sent as one Codex chat message:

```text
/impeccable command

Detailed prompt here.
```

---

## Phase 1: Understand The Current Project

- [x] Step 1: Document current design from code.
- [x] Step 2: Extract current reusable UI patterns.

## Phase 2: Create One Global Design System

- [x] Step 3: Define unified design system.
- [x] Step 4: Normalize typography globally.
- [x] Step 5: Normalize colors globally.
- [x] Step 6: Normalize global layout and spacing.
- [x] Step 7: Normalize responsiveness.

## Phase 3: Normalize Shared App Structures

- [x] Step 8: Standardize top navigation and subtabs.
- [x] Step 9: Standardize cards and modules.
- [ ] Step 10: Standardize buttons, inputs and actions. `NEXT`
- [ ] Step 11: Re-extract after global cleanup.

### Step 11 Command

```text
/impeccable extract

After the global design cleanup, extract the normalized UI system into reusable components and design tokens.

Context:
The app should now have more consistent typography, colors, layout, navigation, cards, buttons and inputs. I want to reduce duplication and make future tab polishing easier.

Your task:
Refactor reusable UI patterns where safe and useful.

Please extract or consolidate:
1. Page shell component or shared page layout styles.
2. Top navigation component/styles.
3. Sub-navigation component/styles.
4. Card/module component/styles.
5. Section header component/styles.
6. Button variants.
7. Icon button variants.
8. Input/form styles.
9. Empty state component/styles.
10. Loading state component/styles.
11. Status badge styles.
12. Shared spacing tokens.
13. Shared color tokens.
14. Shared typography tokens.
15. Shared radius, border, shadow and glass tokens.
16. Repeated tab-specific CSS that should become shared CSS.

Important constraints:
- Avoid risky refactors.
- Preserve existing functionality.
- Do not change data flow.
- Do not break routing.
- Keep changes focused on reusable UI structure and design-system consistency.
```

---

## Phase 4: Polish Tab By Tab

Use this exact sequence for each tab:

1. `/impeccable critique`
2. `/impeccable layout`
3. `/impeccable polish`

- [ ] Step 12: Start / Planner tab.
- [ ] Step 13: Sport tab.
- [ ] Step 14: Nutrition tab.
- [ ] Step 15: Goals tab.
- [ ] Step 16: Notes tab.
- [ ] Step 17: Office / Admin tab.
- [ ] Step 18: Work tab.
- [ ] Step 19: Travel tab.
- [ ] Step 20: Documents tab.

### Step 12: Start / Planner Tab

```text
/impeccable critique

Review only the Start/Planner tab for UX/UI quality.

Context:
The global design system should already be defined. This step is only for evaluating the Start/Planner tab against that system.

Please review:
1. Page hierarchy.
2. Calendar clarity.
3. Task layout.
4. Today/summary widgets.
5. Module balance.
6. Spacing and rhythm.
7. Card consistency.
8. Button and action clarity.
9. Empty states.
10. Responsive behavior.
11. Whether the page uses available viewport space efficiently.
12. Whether the tab matches the global design system.
13. Any elements that feel visually disconnected from the rest of the app.

Important constraints:
- Do not redesign yet.
- Identify specific issues first.
- Keep the global design system as the standard.
```

```text
/impeccable layout

Improve only the Start/Planner tab layout.

Context:
Use the global design system as the source of truth. Do not create a separate visual style for this tab.

Your task:
Improve layout, spacing, module balance and viewport usage.

Please improve:
1. Page structure.
2. Calendar module layout.
3. Task module layout.
4. Today/summary module placement.
5. Module alignment.
6. Card spacing.
7. Section rhythm.
8. Action placement.
9. Empty-state placement.
10. Responsive reflow.
11. Use of available browser height and width.
12. Reduction of unnecessary scrolling.

Important constraints:
- Keep navigation unchanged unless it violates global rules.
- Keep typography and colors aligned with the global design system.
- Do not change functionality.
- Do not introduce new features.
```

```text
/impeccable polish

Polish only the Start/Planner tab.

Context:
The layout should already be structurally improved. This step is for final visual refinement.

Please refine:
1. Visual hierarchy.
2. Card balance.
3. Micro-spacing.
4. Hover states.
5. Active states.
6. Button alignment.
7. Icon alignment.
8. Calendar readability.
9. Task readability.
10. Empty states.
11. Responsive details.
12. Overall premium feel.

Important constraints:
- Do not introduce a new design direction.
- Do not change functionality.
- Keep the page consistent with the global design system.
```

### Step 13: Sport Tab

```text
/impeccable critique

Review only the Sport tab for UX/UI quality.

Context:
The Sport tab is complex and module-heavy. It includes workout planning, training calendar, workout statuses, selected workout details, templates, history and weekly goals. It must feel consistent with the rest of the app while remaining very usable.

Please review:
1. Overall hierarchy.
2. Main Sport tab navigation or subtabs.
3. Training calendar readability.
4. Workout card design.
5. Completed versus planned workout states.
6. Selected workout details panel.
7. Action buttons such as edit, delete, details or status change.
8. Module density.
9. Spacing and rhythm.
10. Icon usage.
11. Empty states.
12. Responsive behavior.
13. Whether the page uses available viewport space efficiently.
14. Whether the tab matches the global design system.

Important constraints:
- Do not redesign yet.
- Identify specific issues first.
- Keep the global design system as the standard.
```

```text
/impeccable layout

Improve only the Sport tab layout.

Context:
Use the global design system as the source of truth. Do not create a separate design language for Sport.

Your task:
Make the Sport tab cleaner, more premium and easier to use.

Please improve:
1. Sport tab page structure.
2. Training calendar layout.
3. Workout cards.
4. Completed/to-do workout states.
5. Selected workout details panel.
6. Action row for selected workout.
7. Detail/edit/delete icon placement.
8. Module alignment.
9. Card spacing.
10. Section hierarchy.
11. Viewport usage.
12. Responsive behavior.

Specific requirements:
- Training cards in the calendar should look cleaner and more intentional.
- Small action icons should be available for details/edit/delete where appropriate.
- Clicking completed/to-do status should be visually clear.
- The selected workout panel should not feel heavy or chaotic.
- Multiple action buttons should sit in a clean single row where possible.
- The tab should avoid unnecessary scrolling without becoming cramped.

Important constraints:
- Do not change workout logic.
- Do not change database structure.
- Do not change the meaning of statuses.
- Keep all styling aligned with the global design system.
```

```text
/impeccable polish

Polish only the Sport tab.

Context:
The Sport tab layout should already be improved. This step is for final visual quality and consistency.

Please refine:
1. Training calendar visual quality.
2. Workout card hierarchy.
3. Status badges or status states.
4. Selected workout details panel.
5. Action buttons and icon buttons.
6. Micro-spacing.
7. Hover states.
8. Active states.
9. Empty states.
10. Mobile and tablet behavior.
11. Consistency with Planner and the global design system.

Important constraints:
- Do not introduce a new visual style.
- Do not add unnecessary effects.
- Keep the UI premium, calm, structured and highly usable.
```

### Steps 14-20: Remaining Tabs

For each remaining tab, use the same `critique -> layout -> polish` sequence and keep the global design system as the standard.

#### Nutrition Tab

```text
/impeccable critique

Review only the Nutrition tab for UX/UI quality.

Please review:
1. Meal card hierarchy.
2. Macro summary widgets.
3. Water tracker layout.
4. Food input/search areas.
5. Daily summary presentation.
6. Spacing and rhythm.
7. Card consistency.
8. Button and input consistency.
9. Empty states.
10. Responsive behavior.
11. Whether the tab matches the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Nutrition tab layout.

Use the global design system as the source of truth.

Please improve:
1. Meal cards.
2. Macro widgets.
3. Water tracker.
4. Food inputs.
5. Daily summary modules.
6. Grid layout.
7. Card spacing.
8. Section hierarchy.
9. Empty-state placement.
10. Responsive behavior.
11. Use of available viewport space.

Do not change nutrition logic, database structure or integrations.
```

```text
/impeccable polish

Polish only the Nutrition tab.

Please refine:
1. Typography hierarchy.
2. Macro presentation.
3. Meal card readability.
4. Water tracker visual clarity.
5. Button and input alignment.
6. Hover and active states.
7. Empty states.
8. Responsive details.
9. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Goals Tab

```text
/impeccable critique

Review only the Goals tab for UX/UI quality.

Please review:
1. Goal card hierarchy.
2. Progress presentation.
3. Long-term versus short-term goal clarity.
4. Status indicators.
5. Action buttons.
6. Spacing and rhythm.
7. Empty states.
8. Responsive behavior.
9. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Goals tab layout.

Use the global design system as the source of truth.

Please improve:
1. Goal list or grid structure.
2. Goal cards.
3. Progress indicators.
4. Status areas.
5. Action placement.
6. Section hierarchy.
7. Card spacing.
8. Empty-state placement.
9. Responsive behavior.
10. Use of available viewport space.

Do not change goal logic or data structure.
```

```text
/impeccable polish

Polish only the Goals tab.

Please refine:
1. Visual hierarchy.
2. Goal card balance.
3. Progress visual quality.
4. Status readability.
5. Button/icon alignment.
6. Hover and active states.
7. Empty states.
8. Mobile and tablet presentation.
9. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Notes Tab

```text
/impeccable critique

Review only the Notes tab for UX/UI quality.

Please review:
1. Note list hierarchy.
2. Note card readability.
3. Tag display.
4. Search/filter clarity.
5. Editor or input layout.
6. Empty states.
7. Spacing and rhythm.
8. Responsive behavior.
9. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Notes tab layout.

Use the global design system as the source of truth.

Please improve:
1. Notes list/grid.
2. Note cards.
3. Tags.
4. Search and filters.
5. Editor/input area.
6. Action placement.
7. Empty-state placement.
8. Responsive behavior.
9. Use of available viewport space.

Do not change notes functionality or data structure.
```

```text
/impeccable polish

Polish only the Notes tab.

Please refine:
1. Note readability.
2. Tag visual style.
3. Search/filter polish.
4. Card spacing.
5. Button/icon alignment.
6. Hover and active states.
7. Empty states.
8. Responsive details.
9. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Office / Admin Tab

```text
/impeccable critique

Review only the Office/Admin tab for UX/UI quality.

Please review:
1. Information architecture.
2. Admin category cards.
3. Document/contract/insurance/business sections.
4. Action clarity.
5. Card hierarchy.
6. Empty states.
7. Spacing and rhythm.
8. Responsive behavior.
9. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Office/Admin tab layout.

Use the global design system as the source of truth.

Please improve:
1. Category structure.
2. Admin cards/modules.
3. Document and contract sections.
4. Action placement.
5. Section hierarchy.
6. Card spacing.
7. Empty-state placement.
8. Responsive behavior.
9. Use of available viewport space.

Do not change business logic or data structure.
```

```text
/impeccable polish

Polish only the Office/Admin tab.

Please refine:
1. Visual hierarchy.
2. Card balance.
3. Admin section readability.
4. Action buttons and icons.
5. Hover and active states.
6. Empty states.
7. Responsive details.
8. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Work Tab

```text
/impeccable critique

Review only the Work tab for UX/UI quality.

Please review:
1. Company/project/task hierarchy.
2. Task and subtask layout.
3. Status presentation.
4. Deadline visibility.
5. Notes and links display.
6. Action clarity.
7. Empty states.
8. Spacing and rhythm.
9. Responsive behavior.
10. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Work tab layout.

Use the global design system as the source of truth.

Please improve:
1. Company/project/task hierarchy.
2. Task cards or lists.
3. Subtask presentation.
4. Status indicators.
5. Deadline display.
6. Notes and link sections.
7. Action placement.
8. Empty-state placement.
9. Responsive behavior.
10. Use of available viewport space.

Do not change work/task logic or database structure.
```

```text
/impeccable polish

Polish only the Work tab.

Please refine:
1. Visual hierarchy.
2. Task readability.
3. Project structure clarity.
4. Status visual quality.
5. Button/icon alignment.
6. Hover and active states.
7. Empty states.
8. Responsive details.
9. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Travel Tab

```text
/impeccable critique

Review only the Travel tab for UX/UI quality.

Please review:
1. Trip folder hierarchy.
2. Flight/hotel/reservation sections.
3. Packing/budget/document areas.
4. Attraction/map/notes sections.
5. Action clarity.
6. Card hierarchy.
7. Empty states.
8. Spacing and rhythm.
9. Responsive behavior.
10. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Travel tab layout.

Use the global design system as the source of truth.

Please improve:
1. Trip folder layout.
2. Travel category cards.
3. Reservation sections.
4. Packing and budget modules.
5. Document and attraction areas.
6. Action placement.
7. Empty-state placement.
8. Responsive behavior.
9. Use of available viewport space.

Do not change travel logic or data structure.
```

```text
/impeccable polish

Polish only the Travel tab.

Please refine:
1. Visual hierarchy.
2. Trip card balance.
3. Travel section readability.
4. Action buttons and icons.
5. Hover and active states.
6. Empty states.
7. Responsive details.
8. Consistency with the global design system.

Do not introduce a new visual direction.
```

#### Documents Tab

```text
/impeccable critique

Review only the Documents tab for UX/UI quality.

Please review:
1. Document category hierarchy.
2. File/card/list presentation.
3. Metadata readability.
4. Search/filter clarity.
5. Action clarity.
6. Empty states.
7. Spacing and rhythm.
8. Responsive behavior.
9. Consistency with the global design system.

Do not redesign yet. Identify specific issues first.
```

```text
/impeccable layout

Improve only the Documents tab layout.

Use the global design system as the source of truth.

Please improve:
1. Document category layout.
2. Document cards or lists.
3. Metadata display.
4. Search and filters.
5. Action placement.
6. Empty-state placement.
7. Responsive behavior.
8. Use of available viewport space.

Do not change document logic, storage or database structure.
```

```text
/impeccable polish

Polish only the Documents tab.

Please refine:
1. Visual hierarchy.
2. Document readability.
3. Metadata presentation.
4. Search/filter polish.
5. Button/icon alignment.
6. Hover and active states.
7. Empty states.
8. Responsive details.
9. Consistency with the global design system.

Do not introduce a new visual direction.
```

---

## Phase 5: Whole-App Consistency Pass

- [ ] Step 21: Full app design critique.
- [ ] Step 22: Final whole-app polish.

### Step 21 Command

```text
/impeccable critique

Review the entire app across all tabs for design-system consistency.

Context:
All main tabs have now been normalized and polished individually. I need a full-app consistency review to catch remaining mismatches.

Please check:
1. Top navigation size, spacing and behavior.
2. Sub-navigation consistency.
3. Typography hierarchy.
4. Color usage.
5. Card and module styling.
6. Page margins.
7. Grid behavior.
8. Section spacing.
9. Button styles.
10. Icon button styles.
11. Input and form styles.
12. Status states.
13. Empty states.
14. Loading states.
15. Error states.
16. Hover states.
17. Active states.
18. Focus states.
19. Responsive behavior.
20. Whether any tab still feels visually disconnected.

Your output should:
- Identify specific inconsistencies.
- Explain where they appear.
- Recommend exact fixes.
- Prioritize changes that improve whole-app uniformity.

Important constraints:
- Do not introduce a new visual direction.
- Use the existing global design system as the standard.
```

### Step 22 Command

```text
/impeccable polish

Apply a final whole-app UI consistency pass.

Context:
The app should now have a defined global design system and individually polished tabs. This step is for final harmonization across the entire product.

Your task:
Standardize all remaining visual and UX differences between tabs.

Please harmonize:
1. Navigation.
2. Subtabs.
3. Page shells.
4. Page headers.
5. Typography.
6. Spacing.
7. Cards/modules.
8. Colors.
9. Borders.
10. Shadows.
11. Glass effects.
12. Buttons.
13. Icon buttons.
14. Forms.
15. Inputs.
16. Status badges.
17. Empty states.
18. Loading states.
19. Error states.
20. Hover, active, selected and focus states.
21. Responsive behavior.

Important constraints:
- Do not create a new design direction.
- Do not change functionality.
- Do not change data models.
- Do not break routing.
- The app should feel like one coherent premium product.
```

---

## Phase 6: Audit, Harden, Optimize

- [ ] Step 23: Technical UI audit.
- [ ] Step 24: Harden edge cases.
- [ ] Step 25: Optimize after design is stable.

### Step 23 Command

```text
/impeccable audit

Audit the whole app for accessibility, responsiveness, performance and technical UI quality.

Context:
The visual design pass is complete. Now I want to verify that the UI is technically solid and production-ready.

Please audit:
1. Keyboard navigation.
2. Focus states.
3. Color contrast.
4. Text readability.
5. Long Polish and English labels.
6. Text overflow.
7. Empty states.
8. Loading states.
9. Error states.
10. Responsive breakpoints.
11. Mobile layout.
12. Tablet layout.
13. Small laptop layout.
14. Large desktop layout.
15. Layout shifts.
16. Unnecessary horizontal or vertical scroll.
17. Heavy visual effects.
18. Component duplication.
19. Inconsistent CSS rules.
20. Semantic HTML issues where relevant.
21. Performance risks caused by styling or effects.

Please apply safe improvements where appropriate.

Important constraints:
- Do not change business logic.
- Do not change database logic.
- Do not introduce a new design direction.
- Preserve the finalized UI design.
```

### Step 24 Command

```text
/impeccable harden

Harden the app UI for real-world edge cases.

Context:
The app should work well with incomplete data, long labels, many records, no records, different screen sizes and user interaction edge cases.

Please harden:
1. Long Polish labels.
2. Long English labels.
3. Long task names.
4. Long workout names.
5. Long document names.
6. Long project names.
7. Empty lists.
8. Very large lists.
9. Missing data.
10. Loading states.
11. Error states.
12. Disabled states.
13. Small screens.
14. Large screens.
15. Browser resizing.
16. Text overflow.
17. Card overflow.
18. Calendar overflow.
19. Form validation display.
20. Button wrapping.
21. Navigation wrapping.
22. Mobile usability.

Important constraints:
- Keep the global design system intact.
- Do not change business logic.
- Do not remove existing functionality.
- Prefer robust UI behavior over fragile visual perfection.
```

### Step 25 Command

```text
/impeccable optimize

Optimize the app after the UI redesign is stable.

Context:
The design system, tab layouts and visual consistency should now be complete. This step is for cleanup and performance optimization.

Please optimize:
1. Duplicated CSS.
2. Unused CSS.
3. Repeated layout rules.
4. Repeated color values.
5. Repeated typography rules.
6. Repeated card styles.
7. Repeated button styles.
8. Repeated responsive rules.
9. Overly complex selectors.
10. Heavy visual effects.
11. Unnecessary layout nesting.
12. Rendering performance.
13. Maintainability of shared styles.
14. Design-token usage.
15. Component reuse.

Important constraints:
- Preserve the finalized design.
- Do not change functionality.
- Do not change database logic.
- Do not remove necessary styles.
- Keep the app visually identical or better after optimization.
```

---

## Optional Phase 7: Only After The App Is Consistent

- [ ] Step 26: Add subtle motion.
- [ ] Step 27: Add small delight moments.

### Step 26 Command

```text
/impeccable animate

Add subtle, purposeful motion to the app.

Context:
The app design is now consistent. I want light motion that improves perceived quality without making the app distracting or slow.

Please add or refine:
1. Button hover transitions.
2. Card hover transitions.
3. Navigation active-state transitions.
4. Modal or panel transitions if applicable.
5. Loading transitions.
6. Status change transitions.
7. Calendar interaction transitions.
8. Subtle micro-interactions.

Requirements:
- Motion should be calm, premium and minimal.
- Do not add flashy effects.
- Do not hurt performance.
- Respect accessibility preferences such as reduced motion where possible.
```

### Step 27 Command

```text
/impeccable delight

Add small moments of delight to the app without changing the core design direction.

Context:
The app should feel premium and satisfying, but not childish or over-designed.

Please consider subtle improvements for:
1. Completed task states.
2. Completed workout states.
3. Goal progress moments.
4. Empty states.
5. Hover states.
6. First-use hints.
7. Microcopy.
8. Small visual confirmations after actions.

Requirements:
- Keep the app calm and professional.
- Do not add gimmicks.
- Do not introduce a new visual style.
- Do not reduce usability.
```

---

## Recommended Order

Already completed:

```text
/impeccable document
/impeccable extract
/impeccable shape
/impeccable typeset
/impeccable colorize
/impeccable layout
/impeccable adapt
/impeccable layout
/impeccable layout
```

Next:

```text
/impeccable layout
/impeccable extract
```

Then for each tab:

```text
/impeccable critique
/impeccable layout
/impeccable polish
```

Then whole app:

```text
/impeccable critique
/impeccable polish
/impeccable audit
/impeccable harden
/impeccable optimize
```

Optional at the end:

```text
/impeccable animate
/impeccable delight
```

## Practical Principle

Global system first.  
Shared components second.  
Tab polish third.  
Whole-app consistency fourth.  
Audit, harden and optimize fifth.  
Functionality, database and integrations last.

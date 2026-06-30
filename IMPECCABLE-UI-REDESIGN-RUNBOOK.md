# IMPECCABLE UI Redesign Runbook

Project-local plan for continuing the UI redesign from Codex on desktop or mobile.

## How To Use From Mobile

Say:

```text
next step of the plan
```

Codex should:

1. Open this file.
2. Find the first unchecked step marked `[ ]`.
3. Run the prompt for that step.
4. When finished, update that step to `[x]`.
5. Move the `NEXT` marker to the next unchecked step.

Status legend:

- `[x]` Done
- `[~]` In progress
- `[ ]` Not done
- `NEXT` First unfinished step

## Current Next Step

- [ ] Step 22: Final whole-app polish. `NEXT`

```text
/impeccable critique

Apply a final whole-app UI consistency pass.

Context:
The global design system should already be defined. This step is only for evaluating this tab against that system.

Please review:
1. Page hierarchy.
2. Main module clarity.
3. Card and panel consistency.
4. Button and action clarity.
5. Empty states.
6. Loading states.
7. Error states.
8. Spacing and rhythm.
9. Responsive behavior.
10. Whether the page uses available viewport space efficiently.
11. Whether the tab matches the global design system.
12. Any elements that feel visually disconnected from the rest of the app.

Important constraints:
- Do not redesign yet.
- Identify specific issues first.
- Keep the global design system as the standard.
```

---

## Progress Checklist

### Phase 1: Understand The Current Project

- [x] Step 1: Document current design from code.
- [x] Step 2: Extract current reusable UI patterns.

### Phase 2: Create One Global Design System

- [x] Step 3: Define unified design system.
- [x] Step 4: Normalize typography globally.
- [x] Step 5: Normalize colors globally.
- [x] Step 6: Normalize global layout and spacing.
- [x] Step 7: Normalize responsiveness.

### Phase 3: Normalize Shared App Structures

- [x] Step 8: Standardize top navigation and subtabs.
- [x] Step 9: Standardize cards and modules.
- [x] Step 10: Standardize buttons, inputs and actions.
- [x] Step 11: Re-extract after global cleanup.

### Phase 4: Polish Tab By Tab

- [x] Step 12: Start / Planner tab: critique, layout, polish.
- [x] Step 13: Sport tab: critique, layout, polish.
- [x] Step 14: Nutrition tab: critique, layout, polish.
- [x] Step 15: Goals tab: critique, layout, polish.
- [x] Step 16: Notes tab: critique, layout, polish.
- [x] Step 17: Office / Admin tab: critique, layout, polish.
- [x] Step 18: Work tab: critique, layout, polish.
- [x] Step 19: Travel tab: critique, layout, polish.
- [x] Step 20: Documents tab: critique, layout, polish.

### Phase 5: Whole-App Consistency Pass

- [x] Step 21: Full app design critique.
- [ ] Step 22: Final whole-app polish. `NEXT`

### Phase 6: Audit, Harden, Optimize

- [ ] Step 23: Technical UI audit.
- [ ] Step 24: Harden edge cases.
- [ ] Step 25: Optimize after design is stable.

### Optional Phase 7

- [ ] Step 26: Add subtle motion.
- [ ] Step 27: Add small delight moments.

---

## Step 11: Re-Extract After Global Cleanup

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

## Tab Polish Template

For each tab in Phase 4, run these three commands in order.

### Critique

```text
/impeccable critique

Review only the [TAB NAME] tab for UX/UI quality.

Context:
The global design system should already be defined. This step is only for evaluating this tab against that system.

Please review:
1. Page hierarchy.
2. Main module clarity.
3. Card and panel consistency.
4. Button and action clarity.
5. Empty states.
6. Loading states.
7. Error states.
8. Spacing and rhythm.
9. Responsive behavior.
10. Whether the page uses available viewport space efficiently.
11. Whether the tab matches the global design system.
12. Any elements that feel visually disconnected from the rest of the app.

Important constraints:
- Do not redesign yet.
- Identify specific issues first.
- Keep the global design system as the standard.
```

### Layout

```text
/impeccable layout

Improve only the [TAB NAME] tab layout.

Context:
Use the global design system as the source of truth. Do not create a separate visual style for this tab.

Your task:
Improve layout, spacing, module balance and viewport usage.

Please improve:
1. Page structure.
2. Main module layout.
3. Supporting module layout.
4. Module alignment.
5. Card spacing.
6. Section rhythm.
7. Action placement.
8. Empty-state placement.
9. Responsive reflow.
10. Use of available browser height and width.
11. Reduction of unnecessary scrolling.

Important constraints:
- Keep navigation unchanged unless it violates global rules.
- Keep typography and colors aligned with the global design system.
- Do not change functionality.
- Do not introduce new features.
```

### Polish

```text
/impeccable polish

Polish only the [TAB NAME] tab.

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
8. Empty states.
9. Responsive details.
10. Overall premium feel.

Important constraints:
- Do not introduce a new design direction.
- Do not change functionality.
- Keep the page consistent with the global design system.
```

---

## Whole-App Commands

### Step 21: Full App Design Critique

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

### Step 22: Final Whole-App Polish

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

### Step 23: Technical UI Audit

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

### Step 24: Harden Edge Cases

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

### Step 25: Optimize After Design Is Stable

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

## Optional Final Commands

```text
/impeccable animate

Add subtle, purposeful motion to the app.

Requirements:
- Motion should be calm, premium and minimal.
- Do not add flashy effects.
- Do not hurt performance.
- Respect reduced motion.
```

```text
/impeccable delight

Add small moments of delight to the app without changing the core design direction.

Requirements:
- Keep the app calm and professional.
- Do not add gimmicks.
- Do not introduce a new visual style.
- Do not reduce usability.
```

## Practical Principle

Global system first.  
Shared components second.  
Tab polish third.  
Whole-app consistency fourth.  
Audit, harden and optimize fifth.  
Functionality, database and integrations last.

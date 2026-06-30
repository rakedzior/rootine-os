# Codex / IMPECCABLE — Targeted Fix Plan After Global Redesign

Use this file as a step-by-step plan.

Important:
- Paste each step into Codex as a separate message.
- Do not paste the whole file at once.
- Do not run these commands in the terminal.
- Each step starts with an IMPECCABLE command and contains the exact prompt to use.
- Follow the order from Step 1 to Step 13.

---

# Step 1 — Global targeted hardening pass

```text
/impeccable harden

The previous global design pass improved the app, but there are still visible UI regressions and inconsistencies across tabs.

Fix the app with a conservative, targeted pass. Do not redesign the whole app again. Do not introduce a new visual direction. Preserve the current premium blue/glass design system.

Primary goal:
Make all tabs technically solid, visually consistent and usable.

Global issues to fix:
1. Prevent text overflow, clipped text and broken button labels.
2. Prevent buttons from being cut off.
3. Ensure long Polish labels wrap, truncate or resize gracefully.
4. Ensure cards and modules adapt to available page dimensions.
5. Ensure page content uses available viewport width and height consistently across tabs.
6. Ensure modules do not create awkward unused empty space.
7. Ensure all top-level tabs follow the same typography scale.
8. Ensure all section titles, card titles, labels, metadata and buttons use the same design tokens.
9. Ensure icon rendering is correct. If an icon fails, do not show raw fallback text such as "target".
10. Ensure all navigation/sub-navigation controls look like the same component family.
11. Ensure all left-side panels, main panels and KPI modules follow one consistent layout logic.
12. Keep responsive behavior consistent across Planner, Goals, Sport, Diet, Finance/Office, Travel and Work/Firma.

Important constraints:
- Do not change business logic.
- Do not change database logic.
- Do not remove features.
- Do not rename data models.
- Do not introduce mesocycles or advanced training terminology.
- Do not create new visual styles per tab.
- Fix concrete UI issues using the existing design system.
- Prefer shared components/tokens over tab-specific hacks.

Acceptance criteria:
- No visible clipped text in Planner.
- No visible clipped buttons in Planner.
- Icons render as icons, not raw words.
- Every tab uses the same typography hierarchy.
- Every tab uses the available page dimensions consistently.
- Navigation and sub-navigation are visually coherent across the app.
```

---

# Step 2 — Planner: fix clipped text, buttons and overflow

```text
/impeccable harden

Fix only the Planner tab.

Current issues:
1. Text is misaligned.
2. Some text is clipped.
3. Some button labels are clipped.
4. Some modules do not handle available space correctly.
5. Long Polish labels are not handled gracefully.

Task:
Make the Planner tab robust and visually clean without redesigning the whole app.

Fix:
1. Text alignment in all Planner modules.
2. Text overflow in cards, calendar cells, task rows and buttons.
3. Button sizing and wrapping.
4. Icon and label alignment.
5. Calendar item text clipping.
6. Task title clipping.
7. Module internal padding.
8. Card header spacing.
9. Responsive behavior for narrow and medium screens.
10. Dynamic sizing so Planner uses available viewport dimensions consistently.

Rules:
- Use the existing global design system.
- Do not introduce a new visual style.
- Do not change Planner functionality.
- Do not remove buttons.
- Do not hide important information unless truncation with tooltip/title is appropriate.
- Long text should either wrap cleanly or truncate with ellipsis depending on context.
- Buttons must always remain readable and clickable.

Acceptance criteria:
- No Planner text is visibly cut off.
- No Planner button is visibly cut off.
- Calendar items remain readable.
- Task rows remain readable.
- The layout feels consistent with the rest of the app.
```

---

# Step 3 — Goals/Cele: fix raw "target" text instead of icon

```text
/impeccable harden

Fix only the Goals/Cele tab.

Current issue:
The UI shows raw text "target" instead of a proper icon.

Task:
Fix icon rendering in the Goals/Cele tab.

Requirements:
1. Replace the raw "target" text with the correct target/goal icon.
2. Check whether the same icon rendering issue appears elsewhere.
3. If the icon library import is wrong, fix the import.
4. If the icon name is wrong, use the correct icon component.
5. If the fallback renders text, prevent raw fallback text from appearing in the UI.
6. Keep icon size, stroke width, color and alignment consistent with the global design system.

Important constraints:
- Do not redesign the Goals tab.
- Do not change goal functionality.
- Do not change data models.
- Do not introduce a new icon style.
- Use the same icon approach used by the rest of the app.

Acceptance criteria:
- The word "target" is not visible as raw UI text.
- A proper icon is shown instead.
- The icon aligns correctly with nearby labels and cards.
```

---

# Step 4 — Sport: redesign Training Cycles UX concept

```text
/impeccable shape

Redesign only the UX concept for Sport → Training Cycles.

Current problem:
The Training Cycles feature is too complicated and uses unnecessary advanced concepts such as mesocycles. I do not want mesocycles. I want a simple cycle planner.

Desired product behavior:
A training cycle should be simple:
1. User creates a cycle.
2. User chooses the number of weeks, for example 8 weeks, 12 weeks or any custom number.
3. User sees a weekly planner/calendar.
4. User drags workouts/templates into specific days.
5. User can move workouts between days and between weeks.
6. User can duplicate workouts.
7. User can copy a selected day/week.
8. User can apply a workout or pattern to selected weeks.
9. User can apply a workout or pattern to all weeks.
10. User can easily edit or delete a cycle.
11. User can easily rename a cycle.
12. User can see which week is currently selected.
13. User can switch between weeks easily.
14. User can save the cycle.

Explicitly remove from the UX:
- Mesocycles.
- Overly scientific training terminology.
- Complex nested structures.
- Unnecessary advanced periodization controls.
- Complicated setup flows.

Target UX:
Simple, practical, drag-and-drop cycle planning.

Proposed structure:
Left panel:
- Cycle list.
- Create cycle button.
- Selected cycle details.
- Rename/edit/delete actions.

Main area:
- Week selector.
- Week grid with days.
- Drag-and-drop workout slots.
- Workout templates available for dragging.
- Copy/apply controls.

Actions:
- Create cycle.
- Edit cycle.
- Delete cycle.
- Duplicate cycle.
- Apply selected workout/day/week to selected weeks.
- Apply selected workout/day/week to all weeks.
- Drag workout to another day.
- Drag workout to another week if supported.

Important constraints:
- Do not use mesocycle terminology.
- Keep it simple.
- Keep it consistent with the global design system.
- Preserve existing Sport tab style.
- Do not change unrelated Sport features.
- Focus only on Training Cycles UX.
```

---

# Step 5 — Sport: implement simplified Training Cycles layout

```text
/impeccable layout

Implement the simplified layout for Sport → Training Cycles.

Use the UX direction from the previous step:
No mesocycles. No complex periodization. Simple cycle planning.

Required layout:
1. Left panel:
   - List of cycles.
   - Create new cycle button.
   - Selected cycle name.
   - Cycle length.
   - Edit cycle action.
   - Delete cycle action.
   - Duplicate cycle action if available.

2. Main panel:
   - Week selector at the top.
   - Clear display of Week 1, Week 2, Week 3, etc.
   - Weekly calendar/grid with days.
   - Workout cards placed in days.
   - Drag-and-drop affordance for moving workouts.
   - Empty day drop zones.

3. Right or secondary panel if needed:
   - Workout templates.
   - Drag templates into days.
   - Quick actions for applying to selected/all weeks.

Required actions:
1. Create cycle.
2. Choose cycle length: 8 weeks, 12 weeks or custom number.
3. Edit cycle.
4. Delete cycle.
5. Rename cycle.
6. Drag workout into a day.
7. Move workout between days.
8. Duplicate workout.
9. Apply to selected weeks.
10. Apply to all weeks.

Visual requirements:
- Simple, clean, practical.
- Use existing card/module design.
- No overwhelming controls.
- No scientific terminology.
- Clear empty states.
- Clear drag-and-drop states.
- Clear selected week state.
- Clear selected cycle state.

Important constraints:
- Do not touch unrelated Sport sections.
- Do not introduce mesocycles.
- Do not redesign the entire Sport tab.
- Keep typography and colors consistent with the app.
```

---

# Step 6 — Sport: harden simplified Training Cycles

```text
/impeccable harden

Harden only Sport → Training Cycles after simplifying the feature.

Check and fix:
1. Creating a cycle with 8 weeks.
2. Creating a cycle with 12 weeks.
3. Creating a cycle with a custom number of weeks.
4. Editing cycle name.
5. Editing cycle length if supported.
6. Deleting a cycle.
7. Duplicating a cycle if supported.
8. Dragging a workout/template into a day.
9. Moving a workout between days.
10. Moving or copying workouts between weeks if supported.
11. Applying a workout/day/week pattern to selected weeks.
12. Applying a workout/day/week pattern to all weeks.
13. Empty cycle state.
14. Empty week state.
15. Long workout names.
16. Long cycle names.
17. Small screens.
18. Large screens.
19. Button overflow.
20. Text overflow.

Important constraints:
- No mesocycle terminology should remain visible.
- No broken drag/drop states.
- No clipped buttons.
- No clipped labels.
- Keep the design consistent with the rest of the Sport tab.
```

---

# Step 7 — Diet: move date selector, fix typography and module sizing

```text
/impeccable layout

Fix only the Diet/Nutrition tab.

Current issues:
1. The date/day selector takes too much space in the main content area.
2. Move the date/day selector to the top bar, to the left of "Własne posiłki".
3. Main modules should adapt better to available page dimensions.
4. Typography feels inconsistent compared to other tabs.
5. Meal labels such as "Śniadanie", "Obiad" etc. look too small or visually strange.
6. Layout is generally acceptable, but visual consistency needs improvement.

Task:
Adjust the Diet/Nutrition tab without redesigning it from scratch.

Required changes:
1. Move the day/date selector to the top action bar.
2. Place it to the left of "Własne posiłki".
3. Free up main content space previously occupied by date selection.
4. Make modules dynamically adapt to the available page width and height.
5. Align Diet typography with the global design system.
6. Improve meal section titles:
   - Śniadanie
   - Obiad
   - Kolacja
   - Przekąski
   - Custom meals if present.
7. Make meal headings visually consistent with card titles/section headers used elsewhere.
8. Ensure macro cards, meal cards and food rows use consistent text sizes.
9. Ensure buttons and inputs match the rest of the app.
10. Ensure the tab does not feel visually separate from Planner/Sport/Goals.

Important constraints:
- Do not change nutrition functionality.
- Do not change database logic.
- Do not remove "Własne posiłki".
- Do not change meal logic.
- Do not introduce a new style.
- Keep the existing layout direction, but refine spacing and typography.

Acceptance criteria:
- Date selector appears in the top bar to the left of "Własne posiłki".
- Main screen has more available space.
- Meal headings look intentional and consistent.
- The tab typography matches the rest of the app.
- Modules resize cleanly with the page.
```

---

# Step 8 — Finance/Payments/Office: compact left KPI module and improved sections

```text
/impeccable shape

Redesign only the Finance/Payments area layout concept.

Current issues:
1. Large KPI cards at the top do not work well.
2. The tabs "Płatności", "Budżet", "JDG", "Historia" look very poor.
3. The layout should be more consistent with the rest of the app.
4. KPI information should not dominate the top of the page.

Desired layout:
Left side:
- Small KPI module.
- Under it, one additional useful compact module.
- KPI values should be compact, readable and secondary.

Right side / main content:
- Main payments screen.
- Payments should be the primary visible workspace.
- Tabs or sections such as "Płatności", "Budżet", "JDG", "Historia" should look premium and consistent.

Required concept:
1. Move KPI summary from large top cards into a compact left-side module.
2. Add a second compact left-side module below KPI if useful.
3. Use the right/main panel for payment-related content.
4. Redesign "Płatności", "Budżet", "JDG", "Historia" navigation so it looks consistent with the global subtab system.
5. Avoid huge KPI cards.
6. Avoid ugly tab styling.
7. Keep the layout practical and business-like.

Important constraints:
- Do not change finance/payment logic.
- Do not change database structure.
- Do not remove sections.
- Do not introduce a separate visual style.
- Keep the same global design system.
```

---

# Step 9 — Finance/Payments/Office: implement improved layout

```text
/impeccable layout

Implement the improved Finance/Payments area layout.

Required changes:
1. Convert the large top KPI cards into a compact left-side module.
2. Place another useful compact module below the KPI module if appropriate.
3. Make the right side the main workspace for payments.
4. Improve the visual design of these sections:
   - Płatności
   - Budżet
   - JDG
   - Historia
5. Make these sections use the same subtab/navigation style as the rest of the app.
6. Ensure the main payments screen has enough space.
7. Ensure KPI information is visible but not dominant.
8. Ensure the page fills available width and height consistently.
9. Ensure no buttons or text are clipped.

Important constraints:
- Keep all existing functionality.
- Do not remove tabs.
- Do not change payment data logic.
- Do not create a new design system.
- Keep visual style consistent with Planner, Sport and Diet.
```

---

# Step 10 — Travel: fix category selector and page dimensions

```text
/impeccable layout

Fix only the Travel tab.

Current issues:
1. Page content does not use available dimensions as well as the other tabs.
2. The category selector for "Planer", "Noclegi", "Transport" and similar categories looks very poor.
3. The Travel tab feels less polished and less consistent than the other tabs.

Task:
Improve Travel tab layout and category navigation while keeping functionality unchanged.

Required changes:
1. Make Travel page content stretch/adapt to available viewport dimensions like the other tabs.
2. Improve the category selector visually.
3. Categories such as:
   - Planer
   - Noclegi
   - Transport
   - and any other travel categories
   should use a clean, consistent sub-navigation or segmented-control pattern.
4. Category selector should not look like raw buttons or disconnected UI.
5. Main content area should align with the global page shell.
6. Cards/modules should follow the shared card system.
7. Spacing should match the rest of the app.
8. Typography should match the global hierarchy.
9. Empty states should look intentional.
10. Responsive behavior should be consistent with other tabs.

Important constraints:
- Do not change travel functionality.
- Do not remove categories.
- Do not change data models.
- Do not introduce a new visual style.
- Use the global design system.
```

---

# Step 11 — Work/Praca: move top KPI cards into compact left module

```text
/impeccable layout

Fix only the Work/Praca tab KPI layout.

Current issue:
The top KPI cards such as "Do zrobienia", "W trakcie", "Terminy w tym miesiącu" and "Urlop" should not appear as large KPI cards at the top.

Desired layout:
These indicators should become a small compact module on the left side instead.

Required changes:
1. Remove the large top KPI-card layout.
2. Create a compact left-side module containing:
   - Do zrobienia
   - W trakcie
   - Terminy w tym miesiącu
   - Urlop
3. Keep these values readable but visually secondary.
4. Add another useful compact module below it if appropriate.
5. Use the right/main content area for the main work/project/task screen.
6. Ensure the layout is consistent with the global design system.
7. Ensure the page fills available viewport dimensions properly.
8. Ensure no text or buttons are clipped.

Important constraints:
- Do not remove the KPI information.
- Do not change work/task logic.
- Do not change database structure.
- Do not introduce a new visual direction.
- Keep the layout consistent with other left-panel/main-panel tabs.
```

---

# Step 12 — Firma/Company: move company and project selection into left panel

```text
/impeccable layout

Fix only the Firma/Company/Work project selection layout.

Current issue:
The layout is generally good, but it is not consistent enough with the desired left-panel/main-panel structure. Company selection and project selection should be part of the left panel.

Desired layout:
Left panel:
- Company selection.
- Project selection.
- Relevant compact summary or filters if useful.

Main panel:
- Selected project/task/content workspace.

Required changes:
1. Move "Wybór firmy" into the left panel.
2. Move "Wybór projektu" into the left panel.
3. Make company and project selectors visually consistent with the global form/input style.
4. Keep the main content area focused on the selected project/task/workspace.
5. Ensure the left panel does not become too wide.
6. Ensure the left panel has consistent spacing, typography and module styling.
7. Ensure selected company/project states are clear.
8. Ensure the layout works on desktop, laptop and smaller screens.
9. Ensure no text, buttons or selectors are clipped.

Important constraints:
- Do not change company/project logic.
- Do not change database structure.
- Do not remove existing selectors.
- Do not introduce a new visual style.
- Keep the design consistent with the rest of the app.
```

---

# Step 13 — Final targeted UI QA audit

```text
/impeccable audit

Run a targeted UI QA audit after the latest fixes.

Check these exact acceptance criteria:

Planner:
- No clipped text.
- No clipped buttons.
- Calendar/task text behaves correctly.

Goals:
- No raw "target" text is visible.
- Proper icon is rendered.

Sport:
- Training Cycles are simple.
- No mesocycle terminology is visible.
- User can create/edit/delete cycles.
- User can choose 8 weeks, 12 weeks or custom length.
- User can drag workouts into days.
- User can duplicate/move workouts.
- User can apply patterns to selected or all weeks.

Diet:
- Date selector is in the top bar to the left of "Własne posiłki".
- Meal headings have correct typography.
- Modules adapt to available page dimensions.
- Diet tab typography matches the rest of the app.

Finance/Payments:
- KPI summary is a compact left-side module.
- Main payments workspace is on the right.
- "Płatności", "Budżet", "JDG", "Historia" look consistent and premium.

Travel:
- Content uses available page dimensions.
- Category selector looks clean and consistent.
- "Planer", "Noclegi", "Transport" and similar categories do not look ugly or disconnected.

Work/Praca:
- "Do zrobienia", "W trakcie", "Terminy w tym miesiącu", "Urlop" are not large top KPI cards.
- They are placed in a compact left-side module.

Firma:
- Company selection is in the left panel.
- Project selection is in the left panel.
- Main panel is focused on selected work/project content.

Global:
- No clipped text.
- No clipped buttons.
- Typography is consistent.
- Modules use available viewport dimensions.
- Navigation and subtabs are consistent.
- No tab feels visually disconnected.

Apply safe fixes where possible.
Do not redesign the whole app again.
Do not introduce a new design direction.
Do not change business logic or database logic.
```

---

# Final instruction for Codex behavior

Use this rule during the whole process:

```text
Treat every step above as a separate implementation checkpoint.

After each step:
1. Make only the requested changes.
2. Do not redesign unrelated tabs.
3. Do not introduce a new visual style.
4. Preserve existing functionality.
5. Prefer small, targeted fixes.
6. Confirm what files were changed.
7. Mention any uncertainty or follow-up issue before moving to the next step.
```

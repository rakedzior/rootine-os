# Module Spec â€” Nutrition

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
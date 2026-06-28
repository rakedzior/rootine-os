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
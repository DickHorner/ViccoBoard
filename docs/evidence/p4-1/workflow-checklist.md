# P4-1 Shuttle Run Workflow Checklist

Timestamp: 2026-02-11T15:56:00Z

Status: NOT VERIFIED (runtime execution not performed in this environment)

## Steps
1. Open Shuttle grading screen for a class and select a Shuttle Run config and grading table.
2. Start the shuttle timer, observe current level/lane updates.
3. Stop a student during an active segment; verify the level/lane is captured.
4. Save results and reload the screen.

## Expected vs Actual
- Timer start/stop behavior:
  - Expected: Timer starts, pauses, resumes, and finishes with level/lane updates.
  - Actual: NOT VERIFIED.
- Audio signal behavior:
  - Expected: Beep sounds at segment transitions and finish (when enabled).
  - Actual: NOT VERIFIED.
- Result save + reload persistence:
  - Expected: Saved results reappear after reload.
  - Actual: NOT VERIFIED.

## File References
- Shuttle UI + timer + save: apps/teacher-ui/src/views/ShuttleGradingEntry.vue
- Shuttle schedule helper: apps/teacher-ui/src/utils/shuttle-run-schedule.ts
- Shuttle schedule tests: apps/teacher-ui/tests/shuttle-run-schedule.test.ts

## Notes
Provide actual observations and timestamps to update this evidence file.

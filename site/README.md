# Magnanimous Useful Tools Studio

A free, private browser-based productivity workspace published as a static site.

## Tools
- **Tasks:** add, search, complete, filter and clear completed tasks.
- **Notes:** create, search, edit, copy and delete notes.
- **Planner:** save dated appointments and reminders, with upcoming and past items.
- **Focus timer:** 5, 15, 25, 45 and 60-minute focus sessions, pause/reset and a short break.
- **Habits:** create daily habits and record daily check-ins.
- **Calculator:** safe two-number arithmetic (+, -, *, /, %); no code evaluation.
- **Unit converter:** length, weight, volume and temperature.
- **Text tools:** word/character/line counts, case conversion, whitespace cleanup and clipboard copy.
- **JSON formatter:** parse, validate and pretty-print JSON without executing it.
- **Backup & restore:** export tasks, notes, planner and habits; restore a validated backup after confirmation.
- **Light/dark theme:** saved in this browser.

## Privacy and limits
- Tasks, notes, plans, habits and theme are stored in localStorage on the current browser/device.
- No account, server database, analytics, API keys, paid provider, or external AI service.
- Data does not sync between devices. Use Backup & restore to preserve or move it.
- Restore accepts Magnanimous Studio JSON backups up to 5 MB, asks before replacing local data, sanitizes malformed records, validates calendar dates, and writes all four collections as one rollback-protected operation.
- Clearing browser storage can remove local data.
- Preact and Preact Hooks load from esm.sh; internet access is required for the initial app load.
- The focus timer runs while the page remains open; it is not a background notification service.

## Development and QA
- Framework development source: ../studio/.
- Static production source: this folder.
- smoke-test.mjs exercises creation, editing, deletion, filtering, clipboard, calculation and JSON errors, planner and habit updates, timer controls, conversion, backup restore/rejection/sanitization, corrupted storage, quota failures, page errors, and mobile overflow.
- .github/workflows/studio-smoke-tests.yml runs syntax and Chromium browser checks using an isolated temporary test install, so it does not invoke the Preact repository's package build lifecycle.

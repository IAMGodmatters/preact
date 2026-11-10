# Magnanimous Useful Tools Studio

Free browser-based workspace published as a static site.

## Tools
- Task manager: add, search, complete, filter and clear completed tasks.
- Notes: create, search, edit and delete notes.
- Calculator: safe two-number arithmetic (+, -, *, /, %); no code evaluation.
- Text tools: word/character/line counts, case conversion, whitespace cleanup and clipboard copy.
- JSON formatter: parse, validate and pretty-print JSON without executing it.
- Export backup: download notes and tasks as a JSON file.
- Light/dark theme.

## Privacy and limits
- Notes, tasks and theme are stored in localStorage on the current browser/device.
- No account, server database, analytics, API keys, paid provider, or external AI service.
- Data does not sync between devices. Use Export backup to preserve it.
- Clearing browser storage can remove local data.
- Preact and Preact Hooks load from esm.sh; internet access is required for the initial app load.

## Local development
Run the existing Vite project under ../studio for framework development. The static production source is in this folder.

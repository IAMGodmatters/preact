# Magnanimous Preact Studio

A standalone, lightweight productivity workspace inside the `IAMGodmatters/preact` repository. It does not replace or modify the main Magnanimous AI application.

## Tools

- Tasks — add, complete and remove tasks.
- Notes — create, edit and remove notes.
- Planner — add and remove dated plans.
- Focus Timer — 25-minute focus and 5-minute break sessions.
- Habits — track daily completion.
- Calculator — evaluate basic arithmetic with a safe parser (no dynamic code execution).
- Unit Converter — length, weight, volume and temperature.
- Text Tools — word/character/line counts, case conversion, trimming and reverse.
- JSON Formatter — validate, format and minify JSON.
- Backup & Restore — export and restore a portable JSON backup.
- Light/Dark theme — theme preference is saved locally.

## Local development

```bash
cd studio
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The GitHub Actions workflow builds `studio/dist` and publishes it to GitHub Pages under `/preact/`.

## Storage, privacy and limits

- All workspace data stays in the browser's local storage on the current device and browser profile.
- There is no server database, account sync, analytics, external AI, API key, payment, or metered provider.
- Export a backup before clearing browser data or moving to another device. Restore replaces the current browser's workspace after confirmation.
- The focus timer runs only while the page is open; it does not run in the background after the browser closes.
- The first production load requires an internet connection to retrieve the site. After loading, the bundled app itself makes no network requests.
- This standalone Preact app remains separate from the main Magnanimous production application. Integration into the main platform requires a separate compatibility, security and accessibility review.

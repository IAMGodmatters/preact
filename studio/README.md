# Magnanimous Preact Studio

A standalone, lightweight Preact playground inside the `IAMGodmatters/preact` fork. It does not replace or modify the main Magnanimous AI application.

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

The GitHub Actions workflow builds this app and publishes the `studio/dist` output to GitHub Pages. The production base path is `/preact/`.

## Scope and safety

- Uses Preact and Preact Hooks directly.
- Keeps the demo isolated in `studio/`.
- No API keys, accounts, payments, or metered services are required.
- No user data is sent to a backend; the interactive examples run in the browser.
- Integration into the main Magnanimous platform requires a separate compatibility and accessibility review.

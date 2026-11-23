# PunchLab

## Goal
Mobile-first PWA that helps users improve real-time humour through daily practice:
a 5-minute timed drill (10 lines, rotating joke structures), then a Judge step
(pick best 2, rewrite, self-rate), a journal of observations, a weekly structure
focus, sharing + reaction logging, and progress stats. Local-only in v1
(no backend, no login). An optional AI coach (Phase 6) needs explicit approval and
a server-side proxy; never put an API key in client code.

## Stack
- Vite + React 19 + TypeScript (strict, no `any`)
- Tailwind CSS v4 via `@tailwindcss/vite` (theme tokens in `src/index.css`)
- Dexie (IndexedDB) for all storage, including uploaded images (as Blobs)
- vite-plugin-pwa (`generateSW`, autoUpdate) for installability/offline
- react-router-dom for screens
- Vitest + jsdom + fake-indexeddb for tests

## Folder structure
```
public/            icons (favicon.svg, pwa-192/512.png, apple-touch-icon.png)
src/
  main.tsx         entry
  App.tsx          routes
  index.css        Tailwind import + dark theme tokens
  components/      small, typed, reusable UI (AppShell, BigButton, ...)
  screens/         one file per route-level screen
  db/              Dexie schema (db.ts) and data helpers + tests
  lib/             pure logic (timer, structures, stats) + tests
  test/setup.ts    loads fake-indexeddb for tests
```

## Commands
- `npm run dev`        start dev server
- `npm test`           run unit tests once (`npm run test:watch` to watch)
- `npm run build`      typecheck + production build (outputs `dist/`, incl. service worker)
- `npm run preview`    serve the production build
- `npm run lint`       oxlint

## UI rules
- Dark mode only by default; colours come from `@theme` tokens.
- Tap targets >= 48px (primary buttons 56px, `min-h-14`).
- Single column, `max-w-md`, designed for ~380px wide, thumb-reachable actions at the bottom.
- Text inputs must accept Hinglish/English/Devanagari; never strip non-ASCII.

## Conventions
- Keep components small; put logic in `src/lib` as pure functions with tests.
- Dexie schema changes: add a new `this.version(n)`; never edit an old version.
- Work in phases; after each: `npm test`, `npm run build`, fix errors, then stop for review.

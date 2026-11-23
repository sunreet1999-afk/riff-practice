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
  components/      small, typed, reusable UI (AppShell, BottomNav, BigButton, ...)
  screens/         one file per route-level screen
  db/              Dexie schema (db.ts), repo.ts data access + tests
  hooks/           React hooks (useNow, useObjectUrl)
  lib/             pure logic (timer, structures, stats) + tests
  test/setup.ts    loads fake-indexeddb for tests
```

## Routes
- `/` Home: today's prompt, streak, Start Drill, resume an unfinished session
- `/prompt` add today's prompt (text situation or photo + optional caption); `/prompt?note=ID` pre-fills from a journal note
- `/sessions` finished sessions, newest first; `/sessions/:id` detail (prompt, best lines with Share + Log reaction, all 10 lines)
- After Judge saves, the app opens `/sessions/:id` so the picks can be shared right away
- `/journal` quick-add observation notes; "Use as prompt" opens `/prompt?note=ID`
- `/drill/:id` 5-min drill, 10 slots; earlier lines lock; timer from `session.endsAt` (wall clock)
- `/judge/:id` pick best 2, optional rewrite with live grapheme count, rate 1–5, save

## Data (Dexie, `src/db/db.ts`, accessed via `src/db/repo.ts`)
- `prompts`: `{ id, dateKey, createdAt, kind: 'text'|'image', text, image?: Blob, noteId? }`
- `notes`: `{ id, createdAt, text, usedAt? }` (`usedAt` set when a prompt is saved from the note)
- `reactions`: `{ id, sessionId, slot, structure, text, reaction: 'laughed'|'smiled'|'none'|'flat', note, method: 'share'|'copy'|'manual', createdAt }`; many per line allowed

## Structure of the week
- `src/lib/week.ts`: ISO week; rotation over 9 structures (Free choice excluded) using a continuous week count, so it doesn't reset at New Year.
- `src/content/structureGuide.ts`: 2-line explanation + one ORIGINAL example per structure. Never paste jokes from other sources.
- Shown on Home and as a "★ This week" badge on the matching drill slot.

## Sharing
- `src/lib/share.ts`: Web Share API, falling back to clipboard; closing the share sheet = 'cancelled'. Shares only the line (rewrite if present), never the prompt.
- `sessions`: `{ id, promptId, dateKey, status: 'drilling'|'judging'|'done', startedAt, endsAt, finishedAt?, activeSlot, lines[10], picks[] }`
- Streak = consecutive local days with >= 1 `done` session; a run ending yesterday stays alive until today ends.
- Multiple drills per day are allowed. Locked lines are persisted as you go (`lockLines`).

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

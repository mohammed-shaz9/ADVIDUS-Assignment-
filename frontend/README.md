# ADVIDUS frontend

React 19 · TypeScript · Vite 8 · Chart.js. Talks to the API in `../backend` over REST and Socket.IO.
Project-wide docs: [`../README.md`](../README.md) · design notes and limits: [`../docs/HANDOVER.md`](../docs/HANDOVER.md).

```bash
npm install
npm run dev          # http://localhost:5180 (API URL from VITE_API_URL, default http://localhost:5050/api)
npm run typecheck && npm run lint && npm run build
```

## Where things are

| Path | What |
|---|---|
| `src/pages/` | one file per tab; non-dashboard pages are lazy-loaded |
| `src/components/` | `activity` · `agents` · `common` (Pager, ErrorState, Skeleton…) · `dashboard` · `layout` · `tasks` · `users` |
| `src/hooks/` | data and realtime hooks (below) |
| `src/contexts/AuthContext.tsx` | JWT, the single shared socket, 60 s session guard, logout on `user.status_changed` |
| `src/services/api.ts` | typed HTTP client; list calls take an `AbortSignal` |
| `src/index.css` | the whole design system (table of contents at the top of the file) |

## Rules for lists (the app targets 60,000 users)

1. Never fetch or filter a whole collection in the browser. Use `usePagedList(fetcher, filterKey)`; change `filterKey` whenever a filter or search term changes (it resets to page 1 and drops stale responses).
2. Debounce typing with `useDebouncedValue(value, 300)`.
3. Refresh from events, not timers: `useSocketRefetch(events, refetch)` coalesces bursts into one request. Keep a slow fallback with `useVisibleInterval(fn, 60_000)`, which pauses while the tab is hidden.
4. Wrap every `<table>` in `.table-wrap`, show loading (`Skeleton`), error (`ErrorState` with Retry) and empty states.
5. Do not add `setInterval`, and do not cache big payloads in `localStorage` (`utils/cache.ts` is for small values only).

## Styling rules (`src/index.css`)

- Use tokens (`var(--brand-500)`, spacing, radii, `--t-colors`…), never raw colours or durations.
- Add component rules only in section 4, each under its own banner. Keep existing class names; the TSX depends on them.
- Transition named properties, never `all`. `backdrop-filter` only on the shell and overlays. No shadows on list rows.
- Breakpoints are mobile-first: 640 / 900 / 1200 px (icon-rail sidebar under 900, bottom tab bar under 640).

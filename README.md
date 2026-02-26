# The Great Controversy Web App

Static, multi-language book reader built with React + Vite.

## Common scripts

- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## Extraction scripts (text sources)

### Single-language extractors

- `npm run extract:sr` — Serbian
- `npm run extract:fa` — Farsi
- `npm run extract:af` — Afrikaans
- `npm run extract:hi` — Hindi
- `npm run extract:bn` — Bengali
- `npm run extract:id` — Indonesian

### Multi-language extractors

- `npm run extract:all` — sequential run (safe default)
- `npm run extract:all:parallel` — parallel run (default concurrency: 3)
- `npm run extract:all:parallel:2` — parallel run with concurrency 2
- `npm run extract:all:parallel:4` — parallel run with concurrency 4
- `npm run extract:all:parallel:6` — parallel run with concurrency 6 (turbo mode)

### Recommendation

- Use `extract:all` when you want the most predictable behavior.
- Use `extract:all:parallel` (or `:2/:4/:6`) when you want faster updates and your network/API limits can handle concurrent requests.

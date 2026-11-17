# Design

## Context

`dev:e2e` is `vite --mode e2e --port 5173 --strictPort`; Vite then loads `.env`, `.env.e2e` and `.env.e2e.local`, the last written by `test-env:start` with the local URL and anon key. `.env` is loaded in every mode, so if `.env.e2e.local` is missing, an `e2e`-mode run silently uses the production values from `.env`. Vite gives variables already present in `process.env` priority over files, which is how `playwright.mock.config.ts` injects dummy values into `npm run dev`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- `npm run dev` is the single obvious command and is local-only.
- Impossible to reach production by accident through `dev`.

**Non-Goals:**
- Auto-starting Docker or the Supabase stack from `dev`.
- Serving edge functions locally.

## Decisions

1. **Reuse Vite mode `e2e`, no new env mechanism.** `dev` becomes `tsx scripts/test-env/dev.ts`, which runs the guard then spawns `vite --mode e2e --port 5173 --strictPort` passing extra args. Alternative: write `.env.development.local` from `test-env:start`. Rejected: it makes plain `vite` implicitly local and leaves `test-env:stop` cleanup state to keep in sync; the explicit script is easier to reason about.
2. **Guard script, reusing `assertLocal`.** `dev.ts` reads `ENV_FILE` from `scripts/test-env/stack.ts`, fails with a `test-env:start` hint if absent, and runs `assertLocal` on `VITE_SUPABASE_URL`. This closes the silent-fallback hole described above. It does not check that the stack is actually running; a dead stack shows up as network errors in the app, same as today.
3. **`dev:remote` = plain `vite`.** Keeps the old behaviour for the real project. `dev:e2e` becomes `npm run dev` so Playwright (`playwright.config.ts`) and docs keep working with no edits.
4. **Mock Playwright config uses `dev:remote`.** It injects dummy env and has no `.env.e2e.local` (CI, fresh clone), so the guard must not apply. Process-env priority still wins over `.env`, so behaviour is unchanged.
5. **Forward extra args.** `npm run dev -- --port N` keeps working through the wrapper.

## Risks / Trade-offs

- [Someone relies on `npm run dev` hitting production] → Marked **BREAKING** in proposal; README and `.env.example` point to `dev:remote`; the guard message names it.
- [Wrapper adds a process layer: signal handling, exit codes] → Spawn with inherited stdio and forward the exit code; verify Ctrl+C stops Vite.
- [Docker stopped, stack down] → Out of scope; documented in README quick start.

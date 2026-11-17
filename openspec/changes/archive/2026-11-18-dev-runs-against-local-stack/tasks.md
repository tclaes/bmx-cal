# Tasks

## 1. Dev command and guard

- [x] 1.1 Add `scripts/test-env/dev.ts`: require `.env.e2e.local`, run `assertLocal` on its `VITE_SUPABASE_URL`, then spawn `vite --mode e2e --port 5173 --strictPort` forwarding extra args and the exit code. Verify: with the file removed it exits non-zero with the `test-env:start` hint; with a non-local URL it exits non-zero naming the host.
- [x] 1.2 Update `package.json`: `dev` runs the wrapper, `dev:remote` is plain `vite`, `dev:e2e` is `npm run dev`. Verify: `npm run dev` with the stack up serves http://localhost:5173 and a seeded user can sign in; Ctrl+C stops the server; `npm run dev:remote` starts against `.env`.
- [x] 1.3 Unit test the guard logic (missing file, non-local URL, valid file) under `src/tests` or the existing scripts test location, and verify `npm test` passes.

## 2. Keep other entry points working

- [x] 2.1 Point `playwright.mock.config.ts` at `npm run dev:remote -- --port ${PORT} --strictPort`. Verify: `npm run test:e2e:mock` passes with `.env.e2e.local` deleted.
- [x] 2.2 Verify `npm run test:e2e` (local stack suite) still starts its server through `dev:e2e` and passes.

## 3. Documentation

- [x] 3.1 Update `README.md` (quick start uses `npm run dev`; commands table lists `dev` and `dev:remote`) and `docs/test-env.md` (commands table, agent steps, mention the guard). Verify: every command shown matches `package.json`.
- [x] 3.2 Update the `.env.example` header and the `test-env:start` success message in `scripts/test-env/start.ts` to say `npm run dev` / `dev:remote`. Verify: `npm run test-env:start` output shows the new hint.

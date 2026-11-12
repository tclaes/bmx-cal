## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - feature pages in `src/features/`, reusable UI in `src/libs/ui/`
2. Place business logic in `src/libs/core/services/`, utilities in `src/shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm test` to verify tests pass
6. Keep files focused and under 300 lines when possible
7. Make small, focused commits with descriptive messages

## End-to-end tests

Playwright specs live in `e2e/specs/`. They run against the Vite dev server with a **mocked Supabase** (`e2e/fixtures/mock-supabase.ts`), so no `.env` or network access is needed.

```bash
npm run test:e2e        # headless
npm run test:e2e:ui     # interactive UI mode
npx playwright install chromium   # first run only
```

- Use `test` from `e2e/fixtures/test.ts` and call `await backend({ tables, user })` before `page.goto()`.
- Any request to Supabase without a mock fails the test; add the table/RPC to the `tables` option.
- Sign in as a role by passing `user` (`role: 'admin'`, or `managedTeams` for a team manager).
- Prefer `getByRole` / `getByLabel`; use `data-testid` only when there is no accessible handle.

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.
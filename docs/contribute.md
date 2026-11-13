## Contributing

To run the app locally, follow the [README quick start](../README.md#run-it-locally).

When adding new features:

1. Follow the smart/dumb component pattern - feature pages in `src/features/`, reusable UI in `src/libs/ui/`
2. Place business logic in `src/libs/core/services/`, utilities in `src/shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm run stylelint` to verify styles
6. Run `npm test` to verify tests pass
7. Keep files focused and under 300 lines when possible
8. Make small, focused commits with descriptive messages

## End-to-end tests

There are two Playwright suites:

- **Full-stack** (`e2e/*.spec.ts`, `playwright.config.ts`): runs against the local Supabase test environment (see `docs/test-env.md`). Run with `npm run test:e2e`.
- **Mocked** (`e2e/specs/`, `playwright.mock.config.ts`): runs against the Vite dev server with a **mocked Supabase** (`e2e/fixtures/mock-supabase.ts`), so no `.env`, Docker or network is needed.

```bash
npm run test:e2e:mock      # headless
npm run test:e2e:mock:ui   # interactive UI mode
npx playwright install chromium   # first run only
```

The notes below apply to the mocked suite.

- Use `test` from `e2e/fixtures/test.ts` and call `await backend({ tables, user })` before `page.goto()`.
- Any request to Supabase without a mock fails the test; add the table/RPC to the `tables` option.
- Sign in as a role by passing `user` (`role: 'admin'`, or `managedTeams` for a team manager).
- Prefer `getByRole` / `getByLabel`; use `data-testid` only when there is no accessible handle.

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.

## CI

Every pull request must pass these gates: `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test` and `npm run build`. CI installs with `npm ci` and uses the Node version in `.nvmrc` (currently 24).

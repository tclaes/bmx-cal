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

### Spacing tokens

Every `margin*`, `padding*`, `gap`, `row-gap` and `column-gap` value (and the legacy `grid-*gap` aliases) uses the `--spacing-*` tokens from `src/styles/variables.css` (`--spacing-xxs` 2px up to `--spacing-3xl` 64px), or a `calc()` of them. `0`, `auto`, `inherit` and percentages are fine, and so is a `calc()` that mixes spacing tokens with other design tokens. Snap an off-scale value to the nearest token instead of adding a new one. `npm run stylelint` fails on any `px`, `rem` or `em` literal in these properties. When a literal really is needed (for example the visually-hidden `margin: -1px`), put `/* stylelint-disable-next-line declaration-property-value-disallowed-list -- <reason> */` above it.

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
- `tables` supplies response data (RPCs as `rpc:<fn>`); unlisted tables and RPCs return `[]`. Only requests to endpoints the mock does not handle at all (e.g. a new auth or functions path) fail the test, so extend `mock-supabase.ts` for those. A test that never calls `backend()` also fails.
- Writes mutate a per-test copy of `tables`: inserts, `PATCH` and `DELETE` (with `id=eq.` / `in.(…)` filters) are visible to later reads, and `mock.writes` records `method`, `table`, `body` and the raw `query`.
- Name a spec `*.mobile.spec.ts` to run it in the 375px `mobile` project instead of desktop Chromium; keep those to smoke checks. `e2e/specs/a11y.spec.ts` runs axe (WCAG A/AA) on public pages: add new public routes to `e2e/fixtures/pages.ts` so they get heading, axe and overflow checks.
- `failingFunctions: ['send-contact-email']` makes an edge function answer 500, to test failure paths.
- Auth is mocked too. Pass `accounts` to seed users who can sign in; registration needs no setup (`backend()` alone is enough) and adds the new user to the mock. Assert on `mock.calls` (auth and edge-function requests, except the `GET /auth/v1/user` session lookup, which is not logged) or `mock.writes` (PostgREST writes).
- Sign in as a role by passing `user` (`role: 'admin'`, or `managedTeams` for a team manager).
- Prefer `getByRole` / `getByLabel`; use `data-testid` only when there is no accessible handle.

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.

## CI

Every pull request must pass these gates: `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test` and `npm run build`. CI installs with `npm ci` and uses the Node version in `.nvmrc` (currently 24).

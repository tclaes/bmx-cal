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

## Colors

Colors have two layers. `src/styles/palette.css` is the palette: `--palette-*` primitives named after the color (`--palette-cyan-500`), each raw hex value once. It is the only file allowed to contain raw color values. `src/styles/colors.css` defines the role-based tokens and builds them only from the palette (`var(--palette-*)`, `color-mix()` for alpha). Components, other stylesheets and non-test `.ts` files use `var(--color-*)` (or the `--race-*`, `--badge-*`, `--hero-*` groups). Allowed keywords: `transparent`, `currentColor`, `inherit`, `none`. For a translucent variant use `color-mix(in srgb, var(--color-primary) 10%, transparent)`. Never use `--palette-*` outside `colors.css`. If no token fits, add a semantic token to `colors.css` (and a primitive to `palette.css` for a new color) instead of writing a literal.

`npm run stylelint` fails on hex colors, `rgb()/hsl()`-style functions and named colors outside `palette.css`; `src/tests/no-color-literals.test.ts` covers TypeScript and the palette rules.

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

## OpenSpec changes

Archive an OpenSpec change in the same pull request that implements it, before the PR merges. Do not leave it for a follow-up PR.

- Archive once the implementation is done and all tasks in `tasks.md` are checked, ideally after review has settled. Run `/opsx:archive <change>`: it moves the change to `openspec/changes/archive/YYYY-MM-DD-<change>/`. When the change has delta specs, choose to sync them, then check that `openspec/specs/<capability>/spec.md` contains the change's requirements. A change without delta specs (`skip_specs: true`) only moves.
- This way master's specs always describe master's code, and no finished changes pile up in `openspec/changes/`.
- Commits after the archive are fine (review fixes, docs). If one changes behaviour, update the main spec in `openspec/specs/` and the archived change's files to match. Do not move the change back.

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.

## CI

Every pull request must pass these gates: `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test` and `npm run build`. CI installs with `npm ci` and uses the Node version in `.nvmrc` (currently 24).

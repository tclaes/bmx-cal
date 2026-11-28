# Tasks

## 1. Regression test first

- [x] 1.1 In `src/tests/event-grouping.test.ts`, add tests that set `process.env.TZ` (restored after each test). With `America/New_York`, `groupEventsByYear` puts a `2026-01-01` race in 2026. With `Pacific/Auckland`, it puts a `2025-12-31` race in 2025. Verify the New York test fails on the current code (it gives 2025).

## 2. Shared helper and fix

- [x] 2.1 Add `yearOf(date: string): number` to `src/shared/utils/date-format.ts`. It reads the year from the leading `YYYY` of an ISO date or date-time string, and throws on anything else. Export it from `src/shared/utils/index.ts`. Add unit tests in `src/tests/date-format.test.ts`: a plain date, a date-time, a New Year's Day date with TZ set behind UTC, and an invalid string. Verify with `npx vitest run src/tests/date-format.test.ts`.
- [x] 2.2 Use `yearOf` in `groupEventsByYear` (`src/features/admin/event-grouping.ts`) and in `groupPastByYear` (`src/features/calendar/visible-events.ts`). Verify the 1.1 tests now pass and the existing `event-grouping` and `visible-events` tests still pass.

## 3. Final checks

- [x] 3.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` and `npm run test:e2e:mock`. Verify all pass, including the admin dashboard's "lists upcoming events grouped by year" E2E test. Result: everything passed except one intermittent failure in the full mock E2E run, `a11y.spec.ts` › "/guide has no axe violations", which passed 3/3 when rerun on its own and is unrelated to this change (it does not touch the guide page).

## Workflow follow-up

- Open the PR against `development` with "Closes #53", and archive this change in it before merging.

# Tasks

## 1. Test first

- [x] 1.1 Add a test to `e2e/specs/admin.spec.ts`, in the import describe block. Upload a CSV with two races through the existing `uploadCsv` helper, then go to Confirm Import with "Review & Confirm". For each row, compute the WCAG contrast of the title, the date, the type and location line, and the Edit hint against the row's computed background. Assert each is at least 4.5:1, and that the date and the type and location line sit below the title. Clicking the second row must show "Event 2 of 2". Verify it fails on the current code (the title has black text).

## 2. Fix the row

- [x] 2.1 In `src/shared/DocumentUpload.svelte`, give `.confirm-event-row` `color: var(--color-text-primary)` and `font: inherit`. Restructure the row:
  - a main column with the title (`<strong>`), the date line, and one muted details line, `Type: … · Location: …`, keeping the unknown-location resolution note;
  - the Edit hint on the right, vertically centred.

  Use a two-column grid (`1fr auto`) with token spacing. Remove the now-unused `.confirm-event-details` right alignment and the 640px row and details overrides. Verify `npm run stylelint` passes and the test from 1.1 passes.
- [x] 2.2 Check it in the browser at 375px and 1280px with a two-race import. Verify with a screenshot that the rows read title, date, details, with Edit on the right.

## 3. Final checks

- [x] 3.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` and `npm run test:e2e:mock` (including the axe checks). Verify all pass. Report any known flaky test separately, with its rerun result.

## Workflow follow-up

- Open the PR against `development` with "Closes #50", and archive this change in it before merging.

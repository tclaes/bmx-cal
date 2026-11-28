# Tasks

## 1. Fix the badge

- [x] 1.1 Add `src/tests/bug-reports-panel.test.ts`. It mocks `adminBugReportService.getAllReports` and `syncGithubStatuses` (in `@features/bug-report/bug-report.service`) with reports in statuses `open`, `in_progress`, `resolved` and `duplicate`, renders `BugReportsPanel`, and asserts the badges read "Open", "In Progress", "Resolved" and "duplicate". Verify it fails before the fix.
- [x] 1.2 In `src/features/admin/BugReportsPanel.svelte`, replace `<Badge variant=…>{STATUS_LABELS[report.status] ?? report.status}</Badge>` with `<Badge variant=… label={STATUS_LABELS[report.status] ?? report.status} />`. Verify the new test passes.

## 2. Final checks

- [x] 2.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` and `npm run test:e2e:mock`. Verify all pass, and that `npm run check` reports no new warnings.

## Workflow follow-up

- Open the PR against `development` with "Closes #55", and archive this change in it before merging.

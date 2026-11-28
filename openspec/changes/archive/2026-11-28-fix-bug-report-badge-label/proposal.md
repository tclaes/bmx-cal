# Proposal

## Why

In the admin dashboard's Bug reports panel, every report's status badge is an empty coloured pill (GitHub issue #55). `BugReportsPanel.svelte` puts the status text inside the component as children (`<Badge variant=…>{label}</Badge>`), but `src/libs/ui/Badge.svelte` has no `<slot>` and only renders its `label` prop, so the text is dropped. Admins can only infer a report's status from the pill's colour. No test renders the panel, which is why it went unnoticed. Svelte 5's stricter type check flagged it during the upgrade investigation (#56).

## What Changes

- `BugReportsPanel.svelte` passes the status text through `Badge`'s `label` prop, as every other `Badge` usage does. Text: `Open`, `In Progress` or `Resolved`, falling back to the raw status value for anything else.
- A component test renders the panel and checks each badge's text, including that fallback.
- Correction to the issue draft: the admin panel is English-only, so the labels are fixed English strings, not translated text.

Out of scope: translating the admin panel, and changing `Badge` to accept children.

## Capabilities

### New Capabilities
- `admin-bug-reports`: how admins see and manage submitted bug reports in the admin dashboard, starting with how each report's status is shown.

### Modified Capabilities

(none)

## Impact

- `src/features/admin/BugReportsPanel.svelte` (one line)
- New `src/tests/bug-reports-panel.test.ts`
- No API, data or dependency changes

# Proposal

## Why

In the Confirm Import step of the document and AI import flow, most of the text in each event row is unreadable (GitHub issue #50). Each row is a `<button class="confirm-event-row">` in `src/shared/DocumentUpload.svelte`. It sets a background but no text colour, and buttons don't inherit colour, so the race title and the Type and Location values fall back to the browser's black on the near-black card (1.17:1 contrast). Admins and team managers confirm imports of 45 or more races from this list without being able to read them.

The issue calls this a dark-mode bug, but the app has a single dark theme (Startlicht), so it affects everyone. The issue also notes that the Type/Location column floats in the middle of each row with a wide gap before "Edit", which makes long lists hard to scan.

## What Changes

- Every text element in a confirm row is readable. The row sets its text colour (and font) from the design tokens instead of the browser's button defaults.
- New row layout, as chosen with the user: title on top, then the date, then one muted line "Type: … · Location: …" (still with the location resolution note for unknown locations). "Edit" sits on the right, vertically centred. The layout is the same on every width, so the 640px special case for these rows goes away.
- Clicking a row still jumps to that event in the editor.
- An E2E test checks the row text contrast and the new layout.

Out of scope: the summary block above the list (File / Events / Team), which is already readable; the import flow itself.

## Capabilities

### New Capabilities
- `event-import`: how admins and team managers review the races found in an uploaded file before they are imported, starting with the Confirm Import list.

### Modified Capabilities

(none)

## Impact

- `src/shared/DocumentUpload.svelte`: confirm-row markup and styles. The component is shared by the admin dashboard and the team-manager dashboard, so both get the fix.
- `e2e/specs/admin.spec.ts`: a new test on the existing CSV import flow.
- No API, data or dependency changes.

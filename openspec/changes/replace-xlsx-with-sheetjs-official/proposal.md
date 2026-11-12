# Proposal

## Why

The admin Excel import depends on `xlsx@0.18.5` from npm, the last version SheetJS published there. It has known advisories (prototype pollution, ReDoS on crafted files) that are fixed only in releases distributed from `cdn.sheetjs.com`. The parser runs in the browser on files an admin uploads, so a malicious spreadsheet is a realistic input. Replacing the package closes the advisories without changing what users can import. See Phase 2 of the tech-debt audit.

## What Changes

- Replace the npm `xlsx` dependency with the official SheetJS build from `cdn.sheetjs.com` (current 0.20.x, pinned to an exact version in `package.json`), keeping `.xlsx` and legacy `.xls` import.
- Update `src/shared/parsers/excel-parser.ts` only where the newer API requires it (read as `ArrayBuffer` instead of the deprecated binary string) and remove the `any` types there.
- Add parser tests with generated `.xlsx` and `.xls` fixtures (none exist today), including Excel serial-date cells.
- Update `docs/file-import.md` and the Vite chunk rule if the module id changes.
- Confirm CI installs the tarball dependency with `npm ci`.

Out of scope: moving to another spreadsheet library, dropping `.xls`, changes to column mapping (`row-mapper.ts`) or the other parsers.

## Capabilities

### New Capabilities

### Modified Capabilities

(No spec-level behavior changes; `skip_specs: true`.)

## Impact

- `package.json`, `package-lock.json`, `vite.config.ts` (chunk rule)
- `src/shared/parsers/excel-parser.ts`, new `src/tests/excel-parser.test.ts`
- `docs/file-import.md`
- Supply chain: the dependency is now fetched from `cdn.sheetjs.com` rather than the npm registry

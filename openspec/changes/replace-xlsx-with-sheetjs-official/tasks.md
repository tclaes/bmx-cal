# Tasks

## 1. Characterize current behavior

- [ ] 1.1 Add `src/tests/excel-parser.test.ts` with generated `.xlsx` and `.xls` fixtures covering normal rows, Excel serial dates and blank cells, against the current `xlsx@0.18.5`; verify `npm test` passes before any swap.

## 2. Swap the dependency

- [ ] 2.1 Install the pinned official SheetJS tarball, update `package.json` and the lockfile, adjust the `vite.config.ts` chunk rule if the module id changed; verify `npm ci && npm run build` succeeds from a clean checkout.
- [ ] 2.2 Update `excel-parser.ts` to read via `file.arrayBuffer()` with `type: 'array'`, and remove its `any` types; verify the tests from 1.1 still pass unchanged and `npm run check` is clean.

## 3. CI and docs

- [ ] 3.1 Push and verify the CI workflow's `npm ci` step installs the tarball dependency.
- [ ] 3.2 Update `docs/file-import.md` (supported formats, SheetJS source, manual update note); verify the documented formats match `getAcceptedFormats` in `file-parser.ts`.
- [ ] 3.3 Run `npm audit` and record that the `xlsx` advisories no longer apply.

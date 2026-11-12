# Design

## Context

`excel-parser.ts` reads the file with `FileReader.readAsBinaryString`, calls `XLSX.read(data, { type: 'binary' })`, converts the first sheet with `sheet_to_json` and uses `XLSX.SSF.parse_date_code` for serial dates. The importer accepts `.xlsx` and `.xls` (`file-parser.ts`). There are no parser tests. `vite.config.ts` groups any module id containing `xlsx` into the `utils` chunk. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**
- Patched SheetJS with the existing API surface, so the parser change stays small.
- Reproducible installs in CI and locally.
- Tests that prove `.xlsx`, `.xls` and date handling still work.

**Non-Goals:**
- A different library or a rewrite of the import pipeline.

## Decisions

- **Official SheetJS tarball** (`https://cdn.sheetjs.com/xlsx-<version>/xlsx-<version>.tgz`) pinned to an exact version, as the maintainers document. Alternatives: `exceljs` or `read-excel-file` are on npm but read `.xlsx` only, which would drop `.xls` and need a parser rewrite; removing Excel import loses a feature.
- **Read as `ArrayBuffer`** (`file.arrayBuffer()` and `type: 'array'`) instead of `readAsBinaryString`, which is deprecated and slower; this also removes the `FileReader` wrapper.
- **Generate fixtures in the test** with SheetJS's own writer (`bookType: 'xlsx'` and `'biff8'`) instead of committing binary files.
- **Keep `normalizeRow`'s contract** (rows as `Record<string, unknown>`); only the parser's own types change.

## Risks / Trade-offs

- [The registry is no longer npm; an outage or tampering at `cdn.sheetjs.com` affects installs] → Pin the exact version, rely on the integrity hash in `package-lock.json`, and verify `npm ci` in CI. If the host proves unreliable, vendor the tarball into the repo.
- [The newer major may change date or empty-cell handling] → The new fixtures assert dates and blank cells before and after the swap.
- [Some tooling (Dependabot, `npm audit`) handles tarball URLs poorly] → Note in `docs/file-import.md` that updates are manual.

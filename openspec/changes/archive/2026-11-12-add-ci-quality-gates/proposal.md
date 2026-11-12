# Proposal

## Why

CI (`.github/workflows/ci.yml`) runs `npm run sheriff`, `npm test` and `npm run build`, but not the `check` (svelte-check + tsc) or `stylelint` scripts, even though `docs/contribute.md` tells contributors to run them. Type errors and style regressions can reach the target branch. (On the redesign branch Sheriff is already enforced; on the original `master` baseline it was not.) CI also uses `npm i` (non-reproducible) and no pinned Node version. This is the cheapest, highest-leverage item from the tech-debt audit (Phase 1) and protects every later refactor.

## What Changes

- Add CI steps for `npm run check` and `npm run stylelint` ahead of tests and build, keeping the existing `npm run sheriff` step.
- Switch `npm i` to `npm ci`; pin Node via `.nvmrc` (and `engines` in `package.json`) and have `setup-node` read it.
- Fix whatever the three newly-enforced checks currently report so CI is green on first run (including the ~17 `any` / `@ts-ignore` escapes in `src/` where they cause check failures or are trivially typeable).
- Documentation tidy: move `SECURITY_DEPLOYMENT.md` into `docs/`, give the cron docs consistent naming (`docs/cron.md` is a 7-line pointer to `docs/CRON_JOBS.md`), and update `docs/contribute.md` to state which checks CI enforces.

Out of scope: a logging abstraction (survey shows only ~7 non-test `console.*` calls in `src/`; the rest are Deno edge-function logs, which are intentional), coverage thresholds, Svelte 5 migration, edge-function refactors.

## Capabilities

### New Capabilities
<!-- None: tooling and docs only, no user-facing behavior change. -->

### Modified Capabilities
<!-- None. Change sets skip_specs: true. -->

## Impact

- `.github/workflows/ci.yml`, `package.json` (`engines`), new `.nvmrc`
- Possible small type/style fixes across `src/` surfaced by the checks
- `docs/contribute.md`, `docs/cron.md`, `docs/CRON_JOBS.md`, `SECURITY_DEPLOYMENT.md`, and any files linking to them
- No runtime, database or edge-function behavior changes

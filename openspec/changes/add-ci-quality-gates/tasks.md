# Tasks

## 1. Baseline

- [x] 1.1 Run `npm ci` then `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` locally; record pass/fail and violation counts in the PR description. Verified by the recorded output.

## 2. Make the checks pass

- [x] 2.1 Fix all `svelte-check`/`tsc` errors, replacing `any`/`@ts-ignore` in `src/` with real types where practical. Verify `npm run check` exits 0.
- [x] 2.2 Fix all Sheriff violations without altering `sheriff.config.ts` rules. Verify `npm run sheriff` exits 0.
- [x] 2.3 Fix all stylelint errors (use `npm run stylelint:fix` then review the diff). Verify `npm run stylelint` exits 0.
- [x] 2.4 Confirm `npm test` and `npm run build` still pass after the fixes.

## 3. Enforce in CI

- [x] 3.1 Add `.nvmrc` and `engines.node` in `package.json`; verify `nvm use` picks the version and `npm ci && npm test` pass under it.
- [x] 3.2 Update `.github/workflows/ci.yml`: `node-version-file: .nvmrc`, `npm ci`, and steps for check, sheriff, stylelint before test and build. Verify with a PR run where all steps are green.
- [ ] 3.3 Prove the gates bite: on a throwaway branch introduce one type error, one boundary violation and one style error, and verify each fails CI (then discard the branch).

## 4. Documentation

- [x] 4.1 `git mv SECURITY_DEPLOYMENT.md docs/security-deployment.md`, update inbound links, and verify with `grep -r SECURITY_DEPLOYMENT` returning nothing.
- [x] 4.2 Normalise cron doc naming (`docs/cron.md` stays the entry point, details file lowercase), update links and `src/tests/cron-jobs.test.ts` if it references the path; verify `npm test` passes.
- [x] 4.3 Update `docs/contribute.md` to list the checks CI enforces and the Node version; verify the commands listed run as written.

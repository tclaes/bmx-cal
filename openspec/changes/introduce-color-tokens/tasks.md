## Tasks

## 1. Tokens
- [x] 1.1 Move all color tokens from `variables.css` into `src/styles/colors.css` and import it in `app.css`
- [x] 1.2 Add missing tokens (white, shadow, overlay, focus ring, badge variants, registration status)
- [x] 1.3 Rebuild `--shadow-*` on `--color-shadow`

## 2. Migration
- [x] 2.1 Replace raw hex/`rgb()` and `var(--x, #fallback)` in `.svelte` files (Badge, GetInTouch, Guide, legal, team-manager, CookieConsent, InstallPrompt, Dropdown, Modal, auth SVGs, …)
- [x] 2.2 Verify no raw colors remain outside `colors.css` and tests

## 3. TypeScript
- [x] 3.1 Refactor `registration-status.ts` to return `var(--color-status-*)`
- [x] 3.2 Add Vitest guard test for color literals in non-test `src/**/*.ts`

## 4. Enforcement
- [x] 4.1 Add `color-no-hex`, `function-disallowed-list`, named-color rule and `colors.css` override to `.stylelintrc.json`
- [x] 4.2 `npm run stylelint` passes
- [ ] 4.3 Make the CI check required on `master` (stylelint already runs in CI; branch protection is set in GitHub)

## 5. Docs & verification
- [x] 5.1 Document the rule in `docs/contribute.md` and `docs/coding-styles.md`
- [x] 5.2 Check contrast: status/badge colors unchanged from before; known gaps left as-is
- [x] 5.3 Run `npm run check`, `npm test`, `npm run build`

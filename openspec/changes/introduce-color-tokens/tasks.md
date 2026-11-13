## Tasks

## 1. Tokens
- [x] 1.1 Split `colors.css` colors into `--palette-*` primitives and `--color-*` semantic aliases (keep existing semantic names)
- [x] 1.2 Add missing semantic tokens (white/on-color, success/warning/danger/info text + border, overlay, focus ring, shadow base, status-*)
- [x] 1.3 Rebuild `--shadow-*` on the shadow token
## 2. Migration (one commit per area, with before/after screenshots)
- [x] 2.1 `src/libs/ui/*` (Badge, …) and `src/shared/*`
- [x] 2.2 `src/layout/*` (Navigation, UpdatePrompt, CookieConsent)
- [x] 2.3 `src/features/calendar/*` (EventCard, AccountCTA, registration status)
- [x] 2.4 `src/features/auth/*`
- [x] 2.5 `src/features/my-events/*`, `team-manager/*`, `admin/*`
- [x] 2.6 `src/features/guide/*`, `about/*`, `legal/*`, `bug-report/*`
- [x] 2.7 Replace named `white`/`black` and `rgb(a)` usages in all remaining files
## 3. TypeScript
- [x] 3.1 Refactor `registration-status.ts` to use tokens
- [x] 3.2 Add Vitest guard test for color literals in `src/**/*.ts`
## 4. Enforcement
- [x] 4.1 Add `color-no-hex`, `function-disallowed-list`, named-color rule and `colors.css` override to `.stylelintrc.json`
- [x] 4.2 Run `npm run stylelint`, fix remaining violations (enable rules last so migration commits stay green)
- [ ] 4.3 Confirm the color stylelint check is a required CI check on `master` (CI step `npm run stylelint:colors` added; branch protection to be set in GitHub)
## 5. Docs & verification
- [x] 5.1 Document the token tiers and the "tokens only" rule in `docs/contribute.md`
- [x] 5.2 Verify contrast for status/feedback token pairs (WCAG AA)
- [x] 5.3 Run `npm run check`, `npm test`, `npm run sheriff`, `npm run build`

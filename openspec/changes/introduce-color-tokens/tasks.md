## Tasks

## 1. Tokens
- [ ] 1.1 Split `variables.css` colors into `--palette-*` primitives and `--color-*` semantic aliases (keep existing semantic names)
- [ ] 1.2 Add missing semantic tokens (white/on-color, success/warning/danger/info text + border, overlay, focus ring, shadow base, status-*)
- [ ] 1.3 Rebuild `--shadow-*` on the shadow token
## 2. Migration (one commit per area, with before/after screenshots)
- [ ] 2.1 `src/libs/ui/*` (Badge, …) and `src/shared/*`
- [ ] 2.2 `src/layout/*` (Navigation, UpdatePrompt, CookieConsent)
- [ ] 2.3 `src/features/calendar/*` (EventCard, AccountCTA, registration status)
- [ ] 2.4 `src/features/auth/*`
- [ ] 2.5 `src/features/my-events/*`, `team-manager/*`, `admin/*`
- [ ] 2.6 `src/features/guide/*`, `about/*`, `legal/*`, `bug-report/*`
- [ ] 2.7 Replace named `white`/`black` and `rgb(a)` usages in all remaining files
## 3. TypeScript
- [ ] 3.1 Refactor `registration-status.ts` to use tokens
- [ ] 3.2 Add Vitest guard test for color literals in `src/**/*.ts`
## 4. Enforcement
- [ ] 4.1 Add `color-no-hex`, `function-disallowed-list`, named-color rule and `variables.css` override to `.stylelintrc.json`
- [ ] 4.2 Run `npm run stylelint`, fix remaining violations (enable rules last so migration commits stay green)
- [ ] 4.3 Confirm stylelint is a required CI check on `master`
## 5. Docs & verification
- [ ] 5.1 Document the token tiers and the "tokens only" rule in `docs/contribute.md`
- [ ] 5.2 Verify contrast for status/feedback token pairs (WCAG AA)
- [ ] 5.3 Run `npm run check`, `npm test`, `npm run sheriff`, `npm run build`

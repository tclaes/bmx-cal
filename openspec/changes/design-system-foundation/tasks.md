## 1. Preparation
- [x] 1.1 Export design B boards (mobile, desktop, logo B1, type colours) to `design/` in this change
- [ ] 1.2 Confirm hosting/preview setup (deploy preview per PR)

## 2. Tokens
- [ ] 2.1 Replace values in `src/styles/variables.css` with palette and type scale
- [ ] 2.2 Add race type tokens (CV, TC, CW, 3NC, EC, WC)
- [ ] 2.3 Check stylelint passes

## 3. Logo and icons
- [ ] 3.1 Add `Logo` component (B1, with wordmark variant)
- [ ] 3.2 Update favicon, PWA icons and `theme-color`

## 4. Components
- [ ] 4.1 Restyle `Button`, `Badge`, `Navigation` on tokens
- [ ] 4.2 Add `TypeLabel` with unknown-type fallback
- [ ] 4.3 Add `StartLight` driven by `registration-status.ts`
- [ ] 4.4 Add `RaceRow` (stretched link, separate registration action)
- [ ] 4.5 Unit tests for 4.2 to 4.4

## 5. Verification
- [ ] 5.1 `npm run test`, `check`, `build` green; sheriff boundaries respected
- [ ] 5.2 Check contrast (AA) and 44px targets
- [ ] 5.3 Review on a deploy preview on a real phone

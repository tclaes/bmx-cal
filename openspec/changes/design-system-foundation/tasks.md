## 1. Preparation
- [x] 1.1 Export design B boards (mobile, desktop, logo B1, type colours) to `design/` in this change
- [x] 1.2 Preview setup: manual preview via bolt.new (import branch, set VITE_SUPABASE_* env vars)

## 2. Tokens
- [x] 2.1 Replace values in `src/styles/variables.css` with palette and type scale
- [x] 2.2 Add race type tokens (CV, TC, CW, 3NC, EC, WC)
- [x] 2.3 Check stylelint passes

## 3. Logo and icons
- [x] 3.1 Add `Logo` component (B1, with wordmark variant)
- [x] 3.2 Update favicon, PWA icons and `theme-color`

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

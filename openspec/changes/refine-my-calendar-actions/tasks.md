# Tasks

## 1. Preparation

- [ ] 1.1 Branch `feat/my-calendar-actions` from `feat/redesign-my-calendar`; `npm test`, `npm run build`, `npm run sheriff` green

## 2. Feature flag

- [ ] 2.1 Add `src/config/features.ts` (`notifications` from `VITE_FEATURE_NOTIFICATIONS`, default off); document it in `docs/env.md`; unit test that it is off by default and on only for `'true'`
- [ ] 2.2 Gate the notification block and the `PushService` calls in `MyEventsPage` behind the flag; test that with the flag off no block renders and `PushService` is never called

## 3. Selection bar and actions

- [ ] 3.1 Add i18n labels (nl, fr, en): "Clear selection", "{count} events cleared", "Undo"
- [ ] 3.2 Rebuild the header block: selection bar (star, count, clear text button) and two equal actions (accent export, outlined save for signed-in users); stacked on mobile, in the bar from 768px; test visibility rules (none selected, signed out, signed in)
- [ ] 3.3 Clear with 6 second undo toast restoring the exact previous selection; test clear, undo within the window and expiry (fake timers)
- [ ] 3.4 Spacing on tokens only, all controls at least 44px; `grep -nE "#[0-9a-fA-F]{3,8}|white" src/features/my-events` has no hits

## 4. Verification

- [ ] 4.1 `npm test`, `npm run check`, `npm run build`, `npm run sheriff` green; CI green on the branch
- [ ] 4.2 Check `/my-events` signed in on mobile, tablet and desktop against the agreed mockup, with the flag off and on

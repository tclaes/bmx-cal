# Tasks

## 1. Preparation

- [x] 1.1 Branch `feat/my-calendar-actions` from `feat/redesign-my-calendar`; `npm test`, `npm run build`, `npm run sheriff` green

## 2. Feature flags (database)

- [x] 2.1 Migration `create_feature_flags` (written and verified against the local test environment with real anon, user and admin sessions; applied to the Bolt project, where a follow-up migration also revokes the TRUNCATE, REFERENCES and TRIGGER privileges that Supabase's default grants give `authenticated`): table, RLS (public select, admin write), audit trigger, seed `notifications = false`; apply with the Supabase MCP; grant `select` to anon and authenticated and writes to authenticated only; verify with `execute_sql` that anon can read and cannot write, and run the security advisor;
- [x] 2.2 `FeatureFlagService` (`getAll`, `setFlag`) and `featureFlags` store with `featureEnabled(key)` / `isFeatureEnabled(key)` that are false until loaded, when missing and on error; unit tests for fail-closed behaviour
- [x] 2.3 Load the flags at app start; document the table in `docs/db.md` and the mechanism in `docs/features.md`
- [x] 2.4 Admin dashboard "Feature flags" section with a switch per flag and last change shown; test that toggling calls `setFlag` and updates the display

## 3. Notification block behind the flag

- [x] 3.1 Gate the notification block and the `PushService` calls in `MyEventsPage` behind `featureEnabled('notifications')` and sign-in; tests: flag off means no block and no `PushService` call, flag on shows it, signed out never shows it

## 4. Selection bar and actions

- [x] 4.1 Add i18n labels (nl, fr, en): "Clear selection", "{count} events cleared", "Undo", "Create an account to export", "Sign in", and a one-line reason; remove the `myEventsDemo` texts
- [x] 4.2 Rebuild the header block: selection bar (star, count, clear) and, for signed-in users, equal accent export and outlined save actions (stacked on mobile, in the bar from 768px); tests for none selected, signed in
- [x] 4.3 Signed-out visitors: remove `access` and `fallback` from the `/my-events` route; show the account action and sign-in link instead of export and save; test that export and save are not rendered and the account action opens `/register`
- [x] 4.4 Delete `MyEventsDemoPage.svelte` and `my-events-demo.test.ts`; fix remaining references (`grep -rn "MyEventsDemo\|myEventsDemo" src` is empty)
- [x] 4.5 Clear with 6 second undo toast restoring the exact previous selection; tests with fake timers for clear, undo and expiry
- [x] 4.6 Spacing on tokens, all controls at least 44px; `grep -rnE "#[0-9a-fA-F]{3,8}\b|\bwhite\b" src/features/my-events | grep -v white-space` has no hits

## 5. Verification

- [x] 5.1 `npm test`, `npm run check`, `npm run build`, `npm run sheriff` green; CI green on the branch
- [x] 5.2 Using the local seeded environment (`docs/test-env.md`) with its seeded admin and normal logins, check `/my-events` signed in and signed out on mobile, tablet and desktop against the agreed mockup, with the notifications flag off and on; check the admin toggle changes what a visitor sees after a reload

# Tasks

## 1. Release definition and build output

- [x] 1.1 Add `src/config/release.json` (`version`, `minVersion`, `notes` nl/fr/en) and make `src/config/version.ts` export `APP_VERSION`, `MIN_VERSION`, `RELEASE_NOTES` from it. Remove `FORCE_UPDATE` from `version.ts` and `config/index.ts`. Verify with `npm run check`.
- [x] 1.2 Set `package.json` `version` equal to `release.json`. Add a unit test that fails when the two differ, and verify it passes with `npm test`.
- [x] 1.3 Add an inline Vite plugin in `vite.config.ts` that emits `dist/version.json` and replaces `__APP_VERSION__` in `dist/sw.js`. Verify after `npm run build` that `dist/version.json` contains the release and `dist/sw.js` has no placeholder left.
- [x] 1.4 Add `public/_headers` with `Cache-Control: no-cache` for `/version.json`, `/sw.js` and `/index.html` as an extra safeguard (the host is Netlify via Bolt; correctness must not depend on it). Verify the file ends up in `dist/` after the build.

## 2. Decision logic

- [x] 2.1 Rewrite `src/shared/utils/version-checker.ts`: a hardened `compareVersions`, `isValidManifest`, and the pure `resolveUpdateState` (effective minimum = max; mandatory only if deployed ≥ minimum; optional unless dismissed for that version). Remove `checkForUpdate`, `isVersionOutdated`, `storeCurrentVersion` and `manualUpdateCheck`. Verify with `npm run check`.
- [x] 2.2 Rewrite `src/tests/version-checker.test.ts` to cover every spec scenario of the decision logic (feature release, crucial fix, override higher/lower, override too high, dismissed same/newer version, up to date, invalid manifest). Verify the tests pass.

## 3. Supabase override

- [x] 3.1 Add the migration `supabase/migrations/<timestamp>_create_app_release_policy.sql` (single-row table, version check constraint, RLS: public select, admin-only write, seed row with `min_version` null). Verify it in the local test environment (`docs/test-env.md`): anon can select, a non-admin update is rejected, an admin update succeeds.
- [x] 3.2 Document the `app_release_policy` table and its RLS in `docs/db.md`. Verify the table appears in the Tables list.

## 4. Release service and store

- [x] 4.1 Add `src/libs/core/services/release.service.ts` with `fetchManifest()` (`/version.json?ts=`, `cache: 'no-store'`, accept only a `application/json` content-type plus the shape check, so the SPA fallback HTML returns `null`) and `fetchOverride()` (Supabase select with a ~3 s timeout). Both return `null` on any error. Export it via the services index and verify with `npm run sheriff`.
- [x] 4.2 Rework `updateStore` in `pwa.store.ts`: `state`, `deployedVersion`, `message`, `checking`, `check()`, `dismiss()` (persists `update_dismissed_version`) and `applyUpdate()` (`registration.update()` with a 3 s timeout, then `location.reload()`). Verify with unit tests that mock fetch and Supabase, covering the offline → `none` case and the HTML-200 (SPA fallback) → `none` case.
- [x] 4.3 Wire the checks in `src/main.ts`: on load, on `visibilitychange` → visible (throttled to 1/min), and every 30 min. Remove the `updatefound` / `SW_UPDATED` handling. Verify with a test using fake timers that `check()` runs on each trigger.

## 5. Service worker

- [x] 5.1 Update `public/sw.js`: `CACHE_NAME = 'bmx-calendar-__APP_VERSION__'`, network-first for navigations with fallback to cached `/index.html`, cache-first for other same-origin GETs, never intercept `/version.json`, keep `skipWaiting`/`clients.claim`, delete old caches, and remove the `SW_UPDATED` post. Keep push handling unchanged. Update `src/tests/pwa-functionality.test.ts` and verify it passes.
- [x] 5.2 Verify manually with `npm run build && npx vite preview`: load the app, rebuild with a bumped version, and confirm a single reload serves the new version and the old cache is gone (DevTools → Application).

## 6. UI

- [x] 6.1 Add i18n keys (nl/fr/en) for the optional banner, the mandatory overlay (title, body, button), "what's new" (title, close) and "latest version". Remove the now-unused `criticalUpdate` text. Verify with `npm run check` (the i18n types must match).
- [x] 6.2 Simplify `src/layout/UpdatePrompt.svelte` to the optional banner (dismiss + reload via `applyUpdate`, no critical styling). Update `src/tests/update-prompt.test.ts` and verify it passes.
- [x] 6.3 Add `src/layout/UpdateRequired.svelte`: a native `<dialog>` opened with `showModal()` (top layer, rest of the page inert, Escape prevented) with the override message or generic text, one "update now" button (≥ 44px), token-only styling. Render it in `AppLayout`. Add a component test: it is shown when `state = 'mandatory'`, has no dismiss control, and the button calls `applyUpdate`.
- [x] 6.4 Add `src/layout/WhatsNew.svelte`: shown once when `last_seen_version` < `APP_VERSION` and notes exist for the locale; it never shows on a first visit. Add a component test for both cases.
- [x] 6.5 Update `Footer.svelte` and `ProfilePage.svelte` to use `updateStore.check()` and `state` (show the "latest version" message when `none`). Update `src/tests/footer-version-check.test.ts` and verify it passes.
- [x] 6.6 Check the mandatory overlay, banner and "what's new" at mobile width (375px) in the browser: tokens only, no horizontal scroll, keyboard focus stays in the overlay. Verify with `npm run stylelint`.

## 7. Documentation and integration

- [x] 7.1 Write `docs/releases.md` (feature release, crucial fix, emergency override SQL, how to clear it, how to verify `/version.json` live), reference it from `AGENTS.md`, and update the `config/` description in `docs/architecture.md`. Verify the links resolve.
- [x] 7.2 Set the first release to `1.0.0` with notes in `release.json` and `package.json`.
- [x] 7.3 Run every quality gate: `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build`. All must pass.

## Workflow follow-up

- Apply the `app_release_policy` migration to production via Supabase MCP `apply_migration` before the frontend deploy.
- After deploying, check `https://bmxkalender.be/version.json` and its `Cache-Control` header.
- Archive the change after review.
